import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import {
  verifyFirebaseToken,
  type TokenVerifier,
  type VerifiedIdentity,
} from "./auth";
import { textField } from "./media";
import type {
  MeetingRoomState,
  Motion,
  VoteChoice,
} from "../meeting-room/src/types";
import type { BattleState, UserProfile } from "../hang-out/src/types";

interface Client {
  ws: WebSocket;
  kind: "meeting" | "hangout";
  identity?: VerifiedIdentity;
  room?: string;
  profile?: UserProfile;
  token?: string;
  count: number;
  since: number;
}
interface HangRoom {
  history: any[];
  sharedPad: string;
  battles: BattleState[];
  waiting: Map<string, UserProfile[]>;
}
const admin = (c: Client) =>
  c.identity?.admin === true && c.identity.email_verified === true;
const roomId = (value: unknown) => {
  const id = textField(value, 100);
  if (!/^[a-zA-Z0-9 _/&().()-]+$/.test(id)) throw new Error("Invalid room ID.");
  return id;
};

/** Single persistent Node process; rooms are public to registered users, never cross-broadcast. */
export function attachRealtime(
  server: Server,
  verify: TokenVerifier = verifyFirebaseToken,
) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
  const clients = new Set<Client>();
  const meetings = new Map<string, MeetingRoomState>();
  const hangouts = new Map<string, HangRoom>();
  const send = (c: Client, event: unknown) => {
    if (c.ws.readyState === WebSocket.OPEN) c.ws.send(JSON.stringify(event));
  };
  const members = (c: Client) =>
    [...clients].filter(
      (other) =>
        other.identity && other.kind === c.kind && other.room === c.room,
    );
  const broadcast = (c: Client, event: unknown) =>
    members(c).forEach((other) => send(other, event));
  function profiles(c: Client) {
    return [
      ...new Map(
        members(c).map((other) => [other.identity!.uid, other.profile!]),
      ).values(),
    ];
  }
  function leave(c: Client) {
    if (!c.room) return;
    const oldRoom = c.room;
    c.room = undefined;
    if (c.kind === "meeting") {
      const room = meetings.get(oldRoom);
      if (
        room &&
        ![...clients].some(
          (other) =>
            other !== c &&
            other.kind === c.kind &&
            other.room === oldRoom &&
            other.identity?.uid === c.identity?.uid,
        )
      ) {
        delete room.attendees[c.identity!.uid];
        broadcast(
          { ...c, room: oldRoom },
          { type: "ATTENDEE_LEFT", attendeeId: c.identity!.uid },
        );
      }
    } else {
      const room = hangouts.get(oldRoom);
      if (room)
        for (const [tier, queue] of room.waiting)
          room.waiting.set(
            tier,
            queue.filter((p) => p.id !== c.identity!.uid),
          );
      broadcast(
        { ...c, room: oldRoom },
        {
          type: "USER_LEFT_ROOM",
          roomUsers: profiles({ ...c, room: oldRoom }),
        },
      );
    }
    // Remove empty rooms; don't retain unbounded abandoned room state.
    if (
      ![...clients].some(
        (other) => other.kind === c.kind && other.room === oldRoom,
      )
    ) {
      (c.kind === "meeting" ? meetings : hangouts).delete(oldRoom);
    }
  }
  function closeMotion(c: Client, room: MeetingRoomState) {
    const m = room.activeMotion;
    if (!m) throw new Error("No active motion.");
    const { ya, na, abstain } = m.tally;
    const active = ya + na;
    const passed =
      active > 0 &&
      (m.requiredMajority === "unanimous"
        ? na === 0
        : m.requiredMajority === "two_thirds"
          ? ya / active >= 2 / 3
          : ya > na);
    m.status = passed ? "passed" : "rejected";
    m.closedAt = Date.now();
    m.resultSummary = `${ya} Ya, ${na} Na, ${abstain} abstentions. ${passed ? "Passed" : "Rejected"}.`;
    room.motionHistory = [m, ...room.motionHistory].slice(0, 100);
    room.activeMotion = null;
    broadcast(c, { type: "MOTION_CLOSED", motion: m });
  }
  function meeting(c: Client, msg: any) {
    const uid = c.identity!.uid;
    const now = Date.now();
    if (msg.type === "JOIN_ROOM") {
      const id = roomId(msg.roomId);
      leave(c);
      if (!meetings.has(id) && meetings.size >= 100)
        throw new Error("Room capacity reached.");
      let room = meetings.get(id);
      if (!room) {
        room = {
          roomId: id,
          roomTitle: id,
          meetingStatus: "scheduled",
          startedAt: now,
          moderatorId: "",
          topics: [],
          activeMotion: null,
          motionHistory: [],
          attendees: {},
          chatMessages: [],
          lastUpdated: now,
        };
        meetings.set(id, room);
      }
      c.room = id;
      const attendee = {
        id: uid,
        name: c.profile!.nickname,
        role: admin(c) ? ("host" as const) : ("attendee" as const),
        status: "active" as const,
        joinedAt: now,
        lastSeen: now,
        hasHandRaised: false,
        avatarColor: "#F59E0B",
      };
      room.attendees[uid] = attendee;
      if (admin(c)) room.moderatorId = uid;
      send(c, { type: "INIT_STATE", state: room, yourId: uid });
      broadcast(c, { type: "ATTENDEE_JOINED", attendee });
      return;
    }
    const room = meetings.get(c.room || "");
    if (!room || !room.attendees[uid]) throw new Error("Join a room first.");
    if (room.activeMotion?.expiresAt && now >= room.activeMotion.expiresAt)
      closeMotion(c, room);
    const attendee = room.attendees[uid];
    attendee.lastSeen = now;
    if (msg.type === "SEND_CHAT") {
      const message = {
        id: randomUUID(),
        senderId: uid,
        senderName: attendee.name,
        senderRole: attendee.role,
        text: textField(msg.text, 4000),
        timestamp: now,
        isQuestion: msg.isQuestion === true,
      };
      room.chatMessages = [...room.chatMessages, message].slice(-200);
      broadcast(c, { type: "CHAT_MESSAGE", message });
      return;
    }
    if (msg.type === "SEND_REACTION") {
      broadcast(c, {
        type: "REACTION",
        reaction: {
          id: randomUUID(),
          emoji: textField(msg.emoji, 16),
          senderName: attendee.name,
          timestamp: now,
        },
      });
      return;
    }
    if (msg.type === "TOGGLE_HAND_RAISE" || msg.type === "UPDATE_STATUS") {
      attendee.hasHandRaised =
        msg.type === "TOGGLE_HAND_RAISE"
          ? msg.raised === true
          : attendee.hasHandRaised;
      attendee.status = attendee.hasHandRaised ? "hand_raised" : "active";
      broadcast(c, { type: "ATTENDEE_UPDATED", attendee });
      return;
    }
    if (msg.type === "CAST_VOTE") {
      const m = room.activeMotion;
      if (
        !m ||
        m.id !== msg.motionId ||
        m.status !== "active" ||
        !["ya", "na", "abstain"].includes(msg.choice)
      )
        throw new Error("Invalid or closed motion.");
      m.votes[uid] = {
        attendeeId: uid,
        attendeeName: attendee.name,
        choice: msg.choice as VoteChoice,
        timestamp: now,
      };
      const votes = Object.values(m.votes);
      m.tally = {
        ya: votes.filter((v) => v.choice === "ya").length,
        na: votes.filter((v) => v.choice === "na").length,
        abstain: votes.filter((v) => v.choice === "abstain").length,
        total: votes.length,
      };
      broadcast(c, {
        type: "VOTE_RECORDED",
        motionId: m.id,
        tally: m.tally,
        voteCount: votes.length,
      });
      return;
    }
    if (!admin(c))
      throw new Error("Only a verified administrator can moderate meetings.");
    switch (msg.type) {
      case "UPDATE_ROLE":
        attendee.role = "host";
        break;
      case "ADD_TOPIC": {
        if (room.topics.length >= 100) throw new Error("Topic limit reached.");
        room.topics.push({
          id: randomUUID(),
          title: textField(msg.topic?.title, 200),
          description: textField(msg.topic?.description || "", 4000, false),
          status: "planned",
          createdAt: now,
          updatedAt: now,
          tags: [],
        });
        break;
      }
      case "UPDATE_TOPIC": {
        const topic = room.topics.find((t) => t.id === msg.topicId);
        if (!topic) throw new Error("Topic not found.");
        if (msg.updates?.title !== undefined)
          topic.title = textField(msg.updates.title, 200);
        if (msg.updates?.description !== undefined)
          topic.description = textField(msg.updates.description, 4000, false);
        if (
          ["planned", "in_progress", "completed", "tabled"].includes(
            msg.updates?.status,
          )
        )
          topic.status = msg.updates.status;
        topic.updatedAt = now;
        break;
      }
      case "DELETE_TOPIC":
        room.topics = room.topics.filter((t) => t.id !== msg.topicId);
        break;
      case "REORDER_TOPICS": {
        if (
          !Array.isArray(msg.topicIds) ||
          new Set(msg.topicIds).size !== room.topics.length ||
          !room.topics.every((t) => msg.topicIds.includes(t.id))
        )
          throw new Error("Invalid topic order.");
        room.topics.sort(
          (a, b) => msg.topicIds.indexOf(a.id) - msg.topicIds.indexOf(b.id),
        );
        break;
      }
      case "START_MOTION": {
        if (room.activeMotion)
          throw new Error("Close the active motion first.");
        const duration = Math.max(
          15,
          Math.min(3600, Number(msg.motion?.durationSeconds) || 120),
        );
        const majority = msg.motion?.requiredMajority;
        const motion: Motion = {
          id: randomUUID(),
          title: textField(msg.motion?.title, 200),
          description: textField(msg.motion?.description || "", 4000, false),
          proposedBy: uid,
          status: "active",
          requiredMajority: ["simple", "two_thirds", "unanimous"].includes(
            majority,
          )
            ? majority
            : "simple",
          startedAt: now,
          expiresAt: now + duration * 1000,
          durationSeconds: duration,
          votes: {},
          tally: { ya: 0, na: 0, abstain: 0, total: 0 },
        };
        room.activeMotion = motion;
        broadcast(c, { type: "MOTION_STARTED", motion });
        break;
      }
      case "CLOSE_MOTION":
        if (room.activeMotion?.id !== msg.motionId)
          throw new Error("Motion mismatch.");
        closeMotion(c, room);
        break;
      case "UPDATE_MEETING_STATUS":
        if (!["scheduled", "in_session", "adjourned"].includes(msg.status))
          throw new Error("Invalid status.");
        room.meetingStatus = msg.status;
        break;
      case "UPDATE_ROOM_TITLE":
        room.roomTitle = textField(msg.title, 200);
        break;
      case "RESET_MEETING":
        room.topics = [];
        room.activeMotion = null;
        room.motionHistory = [];
        room.chatMessages = [];
        break;
      case "KICK_ATTENDEE":
        for (const other of members(c))
          if (other.identity?.uid === msg.attendeeId && other !== c)
            other.ws.close(4003, "Removed by room moderator");
        break;
      default:
        throw new Error("Unsupported meeting event.");
    }
    room.lastUpdated = now;
    broadcast(c, { type: "STATE_UPDATE", state: room });
  }
  function hangout(c: Client, msg: any) {
    const uid = c.identity!.uid;
    if (msg.type === "REGISTER_USER") return; // Identity always comes from Firebase, not the profile payload.
    if (msg.type === "JOIN_ROOM") {
      const id = roomId(msg.roomId);
      leave(c);
      if (!hangouts.has(id) && hangouts.size >= 100)
        throw new Error("Room capacity reached.");
      if (!hangouts.has(id))
        hangouts.set(id, {
          history: [],
          sharedPad: "",
          battles: [],
          waiting: new Map(),
        });
      c.room = id;
      const room = hangouts.get(id)!;
      send(c, {
        type: "ROOM_JOINED",
        history: room.history,
        sharedPad: room.sharedPad,
        roomUsers: profiles(c),
        activeBattles: room.battles,
      });
      broadcast(c, { type: "USER_JOINED_ROOM", roomUsers: profiles(c) });
      send(c, { type: "ONLINE_COUNT_UPDATE", count: profiles(c).length });
      return;
    }
    const room = hangouts.get(c.room || "");
    if (!room) throw new Error("Join a room first.");
    if (msg.roomId !== undefined && msg.roomId !== c.room)
      throw new Error("Room membership mismatch.");
    if (msg.type === "SEND_CHAT_MESSAGE") {
      if (
        msg.message?.audioUrl ||
        (msg.message?.type && msg.message.type !== "text")
      )
        throw new Error(
          "Room media uploads are unavailable. Use direct messages for voice notes.",
        );
      const message = {
        id: randomUUID(),
        roomId: c.room,
        sender: c.profile!,
        content: textField(msg.message?.content, 4000),
        timestamp: Date.now(),
        type: "text",
      };
      room.history = [...room.history, message].slice(-200);
      broadcast(c, { type: "NEW_CHAT_MESSAGE", message });
      return;
    }
    if (msg.type === "UPDATE_SHARED_PAD") {
      room.sharedPad = textField(msg.content, 20000, false);
      broadcast(c, { type: "SHARED_PAD_UPDATED", content: room.sharedPad });
      return;
    }
    if (msg.type === "ENTER_MATCHMAKING") {
      if (!["Flow", "Fluent", "Fanatic"].includes(msg.tier))
        throw new Error("Invalid battle tier.");
      if (
        room.battles.some(
          (b) =>
            b.status !== "finished" &&
            [b.player1.id, b.player2.id].includes(uid),
        )
      )
        throw new Error("Finish your current battle first.");
      for (const [tier, q] of room.waiting)
        room.waiting.set(
          tier,
          q.filter((p) => p.id !== uid),
        );
      const queue = (room.waiting.get(msg.tier) || []).filter((p) =>
        profiles(c).some((member) => member.id === p.id),
      );
      const opponent = queue.shift();
      if (!opponent) queue.push(c.profile!);
      else {
        const battle: BattleState = {
          id: randomUUID(),
          tier: msg.tier,
          player1: opponent,
          player2: c.profile!,
          status: "in-progress",
          currentRound: 1,
          turnPlayerId: opponent.id,
          timeRemaining: 60,
          verses: [],
          spectatorVotes: { p1Votes: 0, p2Votes: 0, voterIds: [] },
          createdAt: Date.now(),
        };
        room.battles = [...room.battles.slice(-49), battle];
        broadcast(c, { type: "BATTLE_MATCHED", battle });
      }
      room.waiting.set(msg.tier, queue);
      return;
    }
    if (msg.type === "CANCEL_MATCHMAKING") {
      for (const [tier, q] of room.waiting)
        room.waiting.set(
          tier,
          q.filter((p) => p.id !== uid),
        );
      return;
    }
    const battle = room.battles.find((b) => b.id === msg.battleId);
    if (!battle) throw new Error("Battle not found in your room.");
    if (msg.type === "SUBMIT_BATTLE_VERSE") {
      if (msg.audioUrl)
        throw new Error(
          "Battle audio uploads are unavailable; submit a text verse.",
        );
      if (battle.status !== "in-progress" || battle.turnPlayerId !== uid)
        throw new Error("It is not your turn.");
      battle.verses.push({
        id: randomUUID(),
        battleId: battle.id,
        round: battle.currentRound,
        authorId: uid,
        authorName: c.profile!.nickname,
        text: textField(msg.verseText, 8000),
        timestamp: Date.now(),
      });
      battle.turnPlayerId =
        uid === battle.player1.id ? battle.player2.id : battle.player1.id;
      battle.currentRound = Math.min(
        3,
        Math.floor(battle.verses.length / 2) + 1,
      );
      if (battle.verses.length >= 6) battle.status = "finished"; // Real spectator votes, never an invented AI winner.
    } else if (msg.type === "SPECTATOR_VOTE") {
      if (
        [battle.player1.id, battle.player2.id].includes(uid) ||
        battle.spectatorVotes.voterIds.includes(uid)
      )
        throw new Error("Only one vote per spectator.");
      if (![battle.player1.id, battle.player2.id].includes(msg.voteForPlayerId))
        throw new Error("Invalid contestant.");
      battle.spectatorVotes.voterIds.push(uid);
      if (msg.voteForPlayerId === battle.player1.id)
        battle.spectatorVotes.p1Votes++;
      else battle.spectatorVotes.p2Votes++;
    } else throw new Error("Unsupported Hang Out event.");
    broadcast(c, { type: "BATTLE_UPDATED", battle });
  }
  server.on("upgrade", (request, socket, head) => {
    if (!["/ws/meeting", "/ws/hangout"].includes(request.url || "")) {
      socket.end("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
      return;
    }
    const origin = request.headers.origin;
    if (
      process.env.APP_PUBLIC_URL &&
      origin !== new URL(process.env.APP_PUBLIC_URL).origin
    ) {
      socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
      return;
    }
    if (clients.size >= 1000) {
      socket.end(
        "HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n",
      );
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      const c: Client = {
        ws,
        kind: request.url === "/ws/meeting" ? "meeting" : "hangout",
        count: 0,
        since: Date.now(),
      };
      clients.add(c);
      const deadline = setTimeout(() => {
        if (!c.identity) ws.close(4001, "Authentication required");
      }, 5000);
      deadline.unref();
      const recheck = setInterval(() => {
        if (c.token)
          void verify(c.token)
            .then((identity) => {
              if (
                identity.admin !== c.identity?.admin ||
                identity.email_verified !== c.identity?.email_verified
              )
                ws.close(4001, "Claims changed");
            })
            .catch(() => ws.close(4001, "Session expired"));
      }, 60000);
      recheck.unref();
      let chain = Promise.resolve();
      ws.on("message", (raw) => {
        chain = chain
          .then(async () => {
            if (Date.now() - c.since > 60000) {
              c.count = 0;
              c.since = Date.now();
            }
            if (++c.count > 120) {
              ws.close(4008, "Rate limit exceeded");
              return;
            }
            try {
              const msg = JSON.parse(raw.toString());
              if (!c.identity) {
                if (
                  msg.type !== "AUTH" ||
                  typeof msg.token !== "string" ||
                  msg.token.length > 10000
                ) {
                  ws.close(4001, "Authentication required");
                  return;
                }
                const identity = await verify(msg.token);
                if (ws.readyState !== WebSocket.OPEN) return;
                if (
                  !identity.uid ||
                  [...clients].filter(
                    (other) => other.identity?.uid === identity.uid,
                  ).length >= 4
                ) {
                  ws.close(4008, "Session limit");
                  return;
                }
                c.identity = identity;
                c.token = msg.token;
                c.profile = {
                  id: identity.uid,
                  nickname: String(
                    (identity as any).name || "Independent Artist",
                  ).slice(0, 80),
                  role: admin(c) ? "Master Admin" : "Artist",
                  avatarUrl: "",
                };
                clearTimeout(deadline);
                send(c, { type: "AUTH_OK", uid: identity.uid });
                return;
              }
              if (msg.type === "PING") {
                send(c, { type: "PONG" });
                return;
              }
              (c.kind === "meeting" ? meeting : hangout)(c, msg);
            } catch (error) {
              if (!c.identity) ws.close(4001, "Invalid session");
              else
                send(c, { type: "ERROR", message: (error as Error).message });
            }
          })
          .catch(() => ws.close(1011, "Unable to process event"));
      });
      ws.on("close", () => {
        clearTimeout(deadline);
        clearInterval(recheck);
        leave(c);
        clients.delete(c);
      });
      ws.on("error", () => ws.close());
    });
  });
  const expiry = setInterval(() => {
    for (const [id, room] of meetings)
      if (
        room.activeMotion?.expiresAt &&
        room.activeMotion.expiresAt <= Date.now()
      ) {
        const c = [...clients].find(
          (c) => c.kind === "meeting" && c.room === id,
        );
        if (c) closeMotion(c, room);
      }
  }, 1000);
  expiry.unref();
  server.on("close", () => {
    clearInterval(expiry);
    for (const c of clients) c.ws.terminate();
    wss.close();
  });
  return {
    broadcast(event: unknown) {
      for (const c of clients) if (c.identity) send(c, event);
    },
    kick(uid: string) {
      for (const c of clients)
        if (c.identity?.uid === uid)
          c.ws.close(4003, "Removed by administrator");
    },
  };
}
