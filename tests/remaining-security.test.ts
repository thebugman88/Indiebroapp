import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import { WebSocket } from "ws";
import { attachRealtime } from "../server/realtime";
import { createAuthMiddleware } from "../server/auth";
import {
  createMessagingRouter,
  conversationId,
  type MessageStore,
} from "../server/messaging";
import { consumeSubmissionCredits, flagMutation, freshJudge, reviewMutation } from "../server/judgement";
import { decodeAudioDataUrl } from "../server/media";

const verify = async (token: string) => {
  if (!["alice", "bob", "carol", "admin"].includes(token))
    throw new Error("Invalid");
  return { uid: token, email_verified: true, admin: token === "admin" };
};
const listen = async (server: ReturnType<typeof createServer>) => {
  server.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  return (server.address() as { port: number }).port;
};
function inbox(ws: WebSocket) {
  const events: any[] = [];
  ws.on("message", (raw) => events.push(JSON.parse(raw.toString())));
  return {
    events,
    async next(type: string) {
      const end = Date.now() + 2000;
      while (Date.now() < end) {
        const i = events.findIndex((e) => e.type === type);
        if (i >= 0) return events.splice(i, 1)[0];
        await new Promise((r) => setTimeout(r, 10));
      }
      throw new Error("Missing event " + type);
    },
  };
}

test("realtime enforces authentication, room isolation, sender identity and moderator role", async () => {
  const server = createServer();
  attachRealtime(server, verify);
  const port = await listen(server);
  const sockets: WebSocket[] = [];
  const client = async (path: string) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`, {
      origin: process.env.APP_PUBLIC_URL,
    });
    sockets.push(ws);
    const box = inbox(ws);
    await new Promise<void>((r) => ws.once("open", r));
    return { ws, box, send: (data: any) => ws.send(JSON.stringify(data)) };
  };
  try {
    const bad = await client("/ws/hangout");
    const closed = new Promise<number>((r) =>
      bad.ws.once("close", (code) => r(code)),
    );
    bad.send({ type: "JOIN_ROOM", roomId: "private" });
    assert.equal(await closed, 4001);
    const a = await client("/ws/hangout"),
      b = await client("/ws/hangout"),
      c = await client("/ws/hangout");
    for (const [client, token, room] of [
      [a, "alice", "one"],
      [b, "bob", "one"],
      [c, "carol", "two"],
    ] as const) {
      client.send({ type: "AUTH", token });
      await client.box.next("AUTH_OK");
      client.send({ type: "JOIN_ROOM", roomId: room });
      await client.box.next("ROOM_JOINED");
    }
    a.send({
      type: "SEND_CHAT_MESSAGE",
      roomId: "one",
      message: { content: "hello", sender: { id: "admin" } },
    });
    assert.equal(
      (await b.box.next("NEW_CHAT_MESSAGE")).message.sender.id,
      "alice",
    );
    c.send({ type: "PING" });
    await c.box.next("PONG");
    assert.equal(
      c.box.events.filter((e) => e.type === "NEW_CHAT_MESSAGE").length,
      0,
    );
    a.send({
      type: "SEND_CHAT_MESSAGE",
      roomId: "two",
      message: { content: "cross-room" },
    });
    assert.match((await a.box.next("ERROR")).message, /membership/);
    const m = await client("/ws/meeting");
    m.send({ type: "AUTH", token: "bob" });
    await m.box.next("AUTH_OK");
    m.send({
      type: "JOIN_ROOM",
      roomId: "one",
      attendee: { id: "admin", role: "host" },
    });
    const state = await m.box.next("INIT_STATE");
    assert.equal(state.yourId, "bob");
    assert.equal(state.state.attendees.bob.role, "attendee");
    m.send({ type: "UPDATE_ROOM_TITLE", title: "stolen" });
    assert.match((await m.box.next("ERROR")).message, /administrator/);
    const host = await client("/ws/meeting");
    host.send({ type: "AUTH", token: "admin" });
    await host.box.next("AUTH_OK");
    host.send({ type: "JOIN_ROOM", roomId: "one" });
    await host.box.next("INIT_STATE");
    host.send({
      type: "START_MOTION",
      motion: { title: "Vote", durationSeconds: 120 },
    });
    const motion = (await host.box.next("MOTION_STARTED")).motion;
    m.send({
      type: "CAST_VOTE",
      motionId: motion.id,
      choice: "ya",
      attendeeId: "alice",
    });
    assert.equal((await m.box.next("VOTE_RECORDED")).tally.total, 1);
    m.send({ type: "CAST_VOTE", motionId: motion.id, choice: "na" });
    const tally = (await m.box.next("VOTE_RECORDED")).tally;
    assert.deepEqual(tally, { ya: 0, na: 1, abstain: 0, total: 1 });
    a.send({ type: "PING" });
    await a.box.next("PONG");
    assert.equal(
      a.box.events.filter((e) => e.type === "MOTION_STARTED").length,
      0,
    );
  } finally {
    for (const ws of sockets) ws.terminate();
    await new Promise<void>((r) => server.close(() => r()));
  }
});

test("DM API derives sender and participant scope from verified identity and fails honestly", async () => {
  const calls: any[] = [];
  let failed = false;
  const store: MessageStore = {
    list: async (uid) => {
      calls.push(["list", uid]);
      return [];
    },
    read: async (uid, peer) => {
      calls.push(["read", uid, peer]);
      return [];
    },
    send: async (uid, peer, message) => {
      if (failed) throw new Error();
      calls.push(["send", uid, peer, message]);
    },
  };
  const app = express();
  app.use(
    express.json(),
    createAuthMiddleware(verify),
    createMessagingRouter(store, async (uid) => {
      if (!["alice", "bob"].includes(uid)) throw new Error();
      return { name: uid };
    }),
  );
  const server = createServer(app);
  const port = await listen(server);
  const base = `http://127.0.0.1:${port}`;
  const post = (body: any, token = "alice") =>
    fetch(base + "/bob", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  try {
    assert.equal((await fetch(base + "/contacts")).status, 401);
    const response = await post({
      type: "text",
      content: "real message",
      senderId: "admin",
      recipientId: "victim",
    });
    assert.equal(response.status, 201);
    const message = (await response.json()).message;
    assert.equal(message.senderId, "alice");
    assert.equal(message.recipientId, "bob");
    assert.equal(calls[0][1], "alice");
    await fetch(base + "/bob", { headers: { Authorization: "Bearer alice" } });
    assert.deepEqual(calls[1], ["read", "alice", "bob"]);
    assert.equal(
      (await post({ type: "audio", audioUrl: "https://attacker.invalid/file" }))
        .status,
      400,
    );
    failed = true;
    assert.equal(
      (await post({ type: "text", content: "not sent" })).status,
      503,
    );
    assert.equal(
      conversationId("alice", "bob"),
      conversationId("bob", "alice"),
    );
    assert.notEqual(
      conversationId("alice", "bob"),
      conversationId("alice", "carol"),
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
  }
});

test("reviews cannot overwrite ownership, forge rewards, review twice, or skip quotas", () => {
  const profile = { ...freshJudge("alice"), termsAccepted: true };
  const track: any = {
    id: "track",
    ownerId: "bob",
    status: "evaluating",
    reviews: [],
    durationSeconds: 60,
    title: "Original",
  };
  const body = {
    scores: { lyrics: 8, vocals: 7, instrumentation: 9, vibe: 8 },
    writtenFeedback: "A useful and constructive review.",
    judgeId: "admin",
    xpEarned: 999999,
    completedFullListen: true,
    ownerId: "alice",
  };
  const start = Date.now() - 61000;
  const result = reviewMutation(track, profile, body, start);
  assert.equal(result.track.ownerId, "bob");
  assert.equal(result.track.title, "Original");
  assert.equal(result.review.judgeId, "alice");
  assert.equal(result.profile.judgeXp, 50);
  assert.equal(result.review.completedFullListen, false);
  assert.equal(result.track.aggregatedScores.overall, 8);
  assert.equal(result.profile.dailyAuditsRemaining, 19);
  assert.equal(result.profile.judgementCredits, 4);
  assert.throws(
    () => reviewMutation(result.track, result.profile, body, start),
    /already/,
  );
  assert.throws(
    () => reviewMutation({ ...track, ownerId: "alice" }, profile, body, start),
    /cannot/,
  );
  assert.throws(
    () =>
      reviewMutation(
        track,
        { ...profile, dailyAuditsRemaining: 0 },
        body,
        start,
      ),
    /quota/,
  );
  assert.throws(
    () => reviewMutation(track, profile, body, Date.now()),
    /minimum/,
  );
  assert.throws(
    () =>
      reviewMutation(
        track,
        profile,
        { ...body, scores: { ...body.scores, lyrics: Infinity } },
        start,
      ),
    /Scores/,
  );
  assert.throws(
    () =>
      reviewMutation({ ...track, ownerId: undefined }, profile, body, start),
    /cannot/,
  );
});

test("judgment credits gate submissions and matching flags return a track only at five", () => {
  const starter = freshJudge("alice");
  assert.equal(consumeSubmissionCredits(starter).judgementCredits, 0);
  assert.throws(
    () => consumeSubmissionCredits({ ...starter, judgementCredits: 2 }),
    /three valid judgments/,
  );
  let track: any = {
    id: "flagged-track", ownerId: "owner", status: "evaluating",
    creationType: "human-created", flagCounts: { "bad-quality": 0, "wrong-ai-room": 0 },
  };
  for (let count = 1; count <= 5; count++) {
    const result = flagMutation(track, "wrong-ai-room", Date.UTC(2026, 8, 2));
    track = result.track;
    assert.equal(result.count, count);
    assert.equal(result.returned, count === 5);
  }
  assert.equal(track.status, "returned");
  assert.equal(track.returnedReason, "wrong-ai-room");
  assert.throws(() => flagMutation(track, "bad-quality"), /cannot be flagged/);
});

test("audio parser rejects remote URLs, spoofed media and oversized payloads", () => {
  for (const input of [
    "https://example.com/a.mp3",
    "data:audio/wav;base64,PGh0bWw+",
    "data:text/html;base64,PGh0bWw+",
  ])
    assert.throws(() => decodeAudioDataUrl(input));
  const bytes = Buffer.alloc(44);
  bytes.write("RIFF");
  bytes.write("WAVE", 8);
  const input = "data:audio/wav;base64," + bytes.toString("base64");
  assert.equal(decodeAudioDataUrl(input).bytes.length, 44);
  assert.throws(() => decodeAudioDataUrl(input, 10));
});

test("Semantic Lab and assistant integrations fail closed without provider credentials", async () => {
  const { semanticRouter } = await import("../server/semantic");
  const { extraAiRouter } = await import("../server/extraAi");
  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const app = express();
  app.use(
    express.json(),
    createAuthMiddleware(verify),
    semanticRouter,
    extraAiRouter,
  );
  const server = createServer(app);
  const port = await listen(server);
  try {
    for (const [route, body] of [
      ["/api/synthesize", { inputText: "Some original lyrics", bpm: 100 }],
      ["/api/ai/strategy-plan", { songTitle: "Single" }],
      ["/api/gemini/marketing-advisor", {}],
    ] as const) {
      const res = await fetch(`http://127.0.0.1:${port}${route}`, {
        method: "POST",
        headers: {
          Authorization: "Bearer alice",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      assert.equal(res.status, 503, route);
      const data = await res.json();
      assert.equal(data.success, undefined);
      assert.ok(data.error);
    }
  } finally {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
    server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
  }
});
