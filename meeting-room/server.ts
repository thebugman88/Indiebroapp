import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import type {
  MeetingRoomState,
  Topic,
  Motion,
  Attendee,
  ChatMessage,
  WSClientMessage,
  WSServerMessage,
  VoteChoice,
} from './src/types.js';

const app = express();
const PORT = 5781;
app.use(express.json());

// In-memory Room State authoritative store
const rooms = new Map<string, MeetingRoomState>();

// Sockets map: socket -> { roomId, attendeeId }
interface ClientMeta {
  roomId: string;
  attendeeId: string;
  ws: WebSocket;
}
const clients = new Map<WebSocket, ClientMeta>();

function getOrCreateRoom(roomId: string, title?: string): MeetingRoomState {
  const normalizedId = roomId.trim().toLowerCase() || 'general';
  let room = rooms.get(normalizedId);
  if (!room) {
    room = {
      roomId: normalizedId,
      roomTitle: title || `${normalizedId.toUpperCase()} Assembly Room`,
      meetingStatus: 'in_session',
      startedAt: Date.now(),
      moderatorId: '',
      topics: [
        {
          id: 'topic-1',
          title: 'Opening Remarks & Attendance Quorum',
          description: 'Establish meeting quorum, confirm attendance, and review today’s agenda items.',
          presenter: 'Moderator',
          status: 'in_progress',
          createdAt: Date.now() - 360000,
          updatedAt: Date.now() - 360000,
          tags: ['General', 'Procedural'],
        },
        {
          id: 'topic-2',
          title: 'Budget Allocation & Strategic Priorities',
          description: 'Review proposed fiscal allocation and deliberate amendments before official vote.',
          presenter: 'Finance Committee',
          status: 'planned',
          createdAt: Date.now() - 300000,
          updatedAt: Date.now() - 300000,
          tags: ['Finance', 'Action Item'],
        },
        {
          id: 'topic-3',
          title: 'Bylaw Amendments & Procedural Standards',
          description: 'Discussion on proposed rules update and transition timeline.',
          presenter: 'Governance Lead',
          status: 'planned',
          createdAt: Date.now() - 240000,
          updatedAt: Date.now() - 240000,
          tags: ['Governance'],
        },
      ],
      activeMotion: null,
      motionHistory: [],
      attendees: {},
      chatMessages: [],
      lastUpdated: Date.now(),
    };
    rooms.set(normalizedId, room);
  }
  return room;
}

function broadcastToRoom(roomId: string, message: WSServerMessage, excludeSocket?: WebSocket) {
  const payload = JSON.stringify(message);
  for (const [ws, meta] of clients.entries()) {
    if (meta.roomId === roomId && ws !== excludeSocket && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(payload);
      } catch (err) {
        console.error('Error broadcasting message to client:', err);
      }
    }
  }
}

function computeMotionTally(motion: Motion): Motion['tally'] {
  let ya = 0;
  let na = 0;
  let abstain = 0;
  for (const vote of Object.values(motion.votes)) {
    if (vote.choice === 'ya') ya++;
    else if (vote.choice === 'na') na++;
    else if (vote.choice === 'abstain') abstain++;
  }
  return {
    ya,
    na,
    abstain,
    total: ya + na + abstain,
  };
}

function evaluateMotionResult(motion: Motion): { status: 'passed' | 'rejected'; summary: string } {
  const { ya, na, abstain, total } = motion.tally;
  const activeVotes = ya + na; // majority calculated from non-abstaining votes

  let passed = false;
  if (motion.requiredMajority === 'unanimous') {
    passed = activeVotes > 0 && na === 0;
  } else if (motion.requiredMajority === 'two_thirds') {
    passed = activeVotes > 0 && ya / activeVotes >= 2 / 3;
  } else {
    // simple majority
    passed = activeVotes > 0 && ya > na;
  }

  const status = passed ? 'passed' : 'rejected';
  const summary = `${passed ? 'Motion Carried (PASSED)' : 'Motion Failed (REJECTED)'}: ${ya} Ya, ${na} Na, ${abstain} Abstentions out of ${total} total cast votes.`;
  return { status, summary };
}

// REST API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now(), totalRooms: rooms.size, totalClients: clients.size });
});

app.get('/api/room/:roomId', (req, res) => {
  const room = getOrCreateRoom(req.params.roomId);
  res.json(room);
});

async function startServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    let currentMeta: ClientMeta | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as WSClientMessage;

        if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
          return;
        }

        if (msg.type === 'JOIN_ROOM') {
          const roomId = (msg.roomId || 'general').trim().toLowerCase();
          const room = getOrCreateRoom(roomId);
          const attendeeId = msg.attendee.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

          const now = Date.now();
          const attendee: Attendee = {
            id: attendeeId,
            name: msg.attendee.name.trim() || `Attendee ${Object.keys(room.attendees).length + 1}`,
            role: msg.attendee.role || (Object.keys(room.attendees).length === 0 ? 'host' : 'attendee'),
            status: msg.attendee.status || 'active',
            joinedAt: now,
            lastSeen: now,
            hasHandRaised: false,
            avatarColor: msg.attendee.avatarColor || '#3B82F6',
          };

          if (attendee.role === 'host' && !room.moderatorId) {
            room.moderatorId = attendeeId;
          }

          room.attendees[attendeeId] = attendee;
          room.lastUpdated = now;

          currentMeta = { roomId, attendeeId, ws };
          clients.set(ws, currentMeta);

          // Send current state back to the joining client
          const initPayload: WSServerMessage = {
            type: 'INIT_STATE',
            state: room,
            yourId: attendeeId,
          };
          ws.send(JSON.stringify(initPayload));

          // Broadcast attendee joined to all other clients in room
          broadcastToRoom(roomId, {
            type: 'ATTENDEE_JOINED',
            attendee,
          }, ws);
          return;
        }

        if (!currentMeta) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'You must join a room first.' }));
          return;
        }

        const room = rooms.get(currentMeta.roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found.' }));
          return;
        }

        const attendee = room.attendees[currentMeta.attendeeId];
        const isHost = attendee?.role === 'host';

        switch (msg.type) {
          case 'UPDATE_ROLE': {
            if (attendee) {
              attendee.role = msg.role;
              if (msg.role === 'host') {
                room.moderatorId = attendee.id;
              }
              room.lastUpdated = Date.now();
              broadcastToRoom(currentMeta.roomId, {
                type: 'ATTENDEE_UPDATED',
                attendee,
              });
            }
            break;
          }

          case 'UPDATE_STATUS': {
            if (attendee) {
              attendee.status = msg.status;
              attendee.lastSeen = Date.now();
              room.lastUpdated = Date.now();
              broadcastToRoom(currentMeta.roomId, {
                type: 'ATTENDEE_UPDATED',
                attendee,
              });
            }
            break;
          }

          case 'TOGGLE_HAND_RAISE': {
            if (attendee) {
              attendee.hasHandRaised = msg.raised;
              attendee.status = msg.raised ? 'hand_raised' : 'active';
              attendee.lastSeen = Date.now();
              room.lastUpdated = Date.now();
              broadcastToRoom(currentMeta.roomId, {
                type: 'ATTENDEE_UPDATED',
                attendee,
              });
            }
            break;
          }

          case 'ADD_TOPIC': {
            const newTopic: Topic = {
              id: `topic-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              title: msg.topic.title.trim() || 'Untitled Topic',
              description: msg.topic.description?.trim() || '',
              presenter: msg.topic.presenter?.trim() || attendee?.name || 'Presenter',
              status: msg.topic.status || 'planned',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              tags: msg.topic.tags || [],
            };
            room.topics.push(newTopic);
            room.lastUpdated = Date.now();
            broadcastToRoom(currentMeta.roomId, {
              type: 'TOPIC_ADDED',
              topic: newTopic,
            });
            break;
          }

          case 'UPDATE_TOPIC': {
            const index = room.topics.findIndex((t) => t.id === msg.topicId);
            if (index !== -1) {
              room.topics[index] = {
                ...room.topics[index],
                ...msg.updates,
                updatedAt: Date.now(),
              };
              room.lastUpdated = Date.now();
              broadcastToRoom(currentMeta.roomId, {
                type: 'TOPIC_UPDATED',
                topic: room.topics[index],
              });
            }
            break;
          }

          case 'DELETE_TOPIC': {
            room.topics = room.topics.filter((t) => t.id !== msg.topicId);
            room.lastUpdated = Date.now();
            broadcastToRoom(currentMeta.roomId, {
              type: 'TOPIC_DELETED',
              topicId: msg.topicId,
            });
            break;
          }

          case 'REORDER_TOPICS': {
            const reordered: Topic[] = [];
            for (const id of msg.topicIds) {
              const item = room.topics.find((t) => t.id === id);
              if (item) reordered.push(item);
            }
            // Append any unmentioned topics
            for (const t of room.topics) {
              if (!reordered.some((r) => r.id === t.id)) {
                reordered.push(t);
              }
            }
            room.topics = reordered;
            room.lastUpdated = Date.now();
            broadcastToRoom(currentMeta.roomId, {
              type: 'STATE_UPDATE',
              state: room,
            });
            break;
          }

          case 'START_MOTION': {
            const now = Date.now();
            const duration = (msg.motion.durationSeconds && msg.motion.durationSeconds > 0) ? msg.motion.durationSeconds : undefined;
            const newMotion: Motion = {
              id: `motion-${now}-${Math.random().toString(36).substring(2, 6)}`,
              topicId: msg.motion.topicId,
              title: msg.motion.title.trim() || 'General Resolution',
              description: msg.motion.description?.trim() || '',
              proposedBy: msg.motion.proposedBy?.trim() || attendee?.name || 'Moderator',
              status: 'active',
              requiredMajority: msg.motion.requiredMajority || 'simple',
              startedAt: now,
              durationSeconds: duration,
              expiresAt: duration ? now + duration * 1000 : undefined,
              votes: {},
              tally: { ya: 0, na: 0, abstain: 0, total: 0 },
            };

            // Reset current votes for attendees in state
            for (const att of Object.values(room.attendees)) {
              delete att.currentVote;
            }

            room.activeMotion = newMotion;
            room.lastUpdated = now;

            broadcastToRoom(currentMeta.roomId, {
              type: 'MOTION_STARTED',
              motion: newMotion,
            });
            break;
          }

          case 'CAST_VOTE': {
            if (!room.activeMotion || room.activeMotion.id !== msg.motionId) {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'No active motion matching this ID.' }));
              return;
            }

            if (room.activeMotion.status !== 'active') {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'Voting on this motion has ended.' }));
              return;
            }

            // Record vote
            const choice: VoteChoice = msg.choice;
            room.activeMotion.votes[currentMeta.attendeeId] = {
              attendeeId: currentMeta.attendeeId,
              attendeeName: attendee?.name || 'Anonymous',
              choice,
              timestamp: Date.now(),
            };

            if (attendee) {
              attendee.currentVote = choice;
            }

            room.activeMotion.tally = computeMotionTally(room.activeMotion);
            room.lastUpdated = Date.now();

            broadcastToRoom(currentMeta.roomId, {
              type: 'VOTE_RECORDED',
              motionId: room.activeMotion.id,
              tally: room.activeMotion.tally,
              voteCount: room.activeMotion.tally.total,
            });

            // Update user status
            broadcastToRoom(currentMeta.roomId, {
              type: 'ATTENDEE_UPDATED',
              attendee: attendee!,
            });
            break;
          }

          case 'CLOSE_MOTION': {
            if (!room.activeMotion || room.activeMotion.id !== msg.motionId) {
              return;
            }

            const motion = room.activeMotion;
            motion.tally = computeMotionTally(motion);
            const { status, summary } = evaluateMotionResult(motion);
            motion.status = status;
            motion.closedAt = Date.now();
            motion.resultSummary = summary;

            room.motionHistory.unshift(motion);
            room.activeMotion = null;
            room.lastUpdated = Date.now();

            broadcastToRoom(currentMeta.roomId, {
              type: 'MOTION_CLOSED',
              motion,
            });
            break;
          }

          case 'UPDATE_MEETING_STATUS': {
            room.meetingStatus = msg.status;
            room.lastUpdated = Date.now();
            broadcastToRoom(currentMeta.roomId, {
              type: 'STATE_UPDATE',
              state: room,
            });
            break;
          }

          case 'UPDATE_ROOM_TITLE': {
            room.roomTitle = msg.title.trim() || 'Assembly Meeting Room';
            room.lastUpdated = Date.now();
            broadcastToRoom(currentMeta.roomId, {
              type: 'STATE_UPDATE',
              state: room,
            });
            break;
          }

          case 'SEND_CHAT': {
            const chatMsg: ChatMessage = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              senderId: currentMeta.attendeeId,
              senderName: attendee?.name || 'Attendee',
              senderRole: attendee?.role || 'attendee',
              text: msg.text.trim(),
              timestamp: Date.now(),
              isQuestion: !!msg.isQuestion,
            };
            room.chatMessages.push(chatMsg);
            if (room.chatMessages.length > 200) {
              room.chatMessages.shift();
            }
            room.lastUpdated = Date.now();
            broadcastToRoom(currentMeta.roomId, {
              type: 'CHAT_MESSAGE',
              message: chatMsg,
            });
            break;
          }

          case 'SEND_REACTION': {
            broadcastToRoom(currentMeta.roomId, {
              type: 'REACTION',
              reaction: {
                id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                emoji: msg.emoji,
                senderName: attendee?.name || 'Attendee',
                timestamp: Date.now(),
              },
            });
            break;
          }

          case 'KICK_ATTENDEE': {
            if (isHost && msg.attendeeId !== currentMeta.attendeeId) {
              delete room.attendees[msg.attendeeId];
              room.lastUpdated = Date.now();
              broadcastToRoom(currentMeta.roomId, {
                type: 'ATTENDEE_LEFT',
                attendeeId: msg.attendeeId,
              });
            }
            break;
          }

          case 'RESET_MEETING': {
            if (isHost) {
              room.topics = [];
              room.activeMotion = null;
              room.motionHistory = [];
              room.chatMessages = [];
              room.meetingStatus = 'in_session';
              room.startedAt = Date.now();
              room.lastUpdated = Date.now();
              broadcastToRoom(currentMeta.roomId, {
                type: 'STATE_UPDATE',
                state: room,
              });
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      if (currentMeta) {
        const { roomId, attendeeId } = currentMeta;
        clients.delete(ws);
        const room = rooms.get(roomId);
        if (room && room.attendees[attendeeId]) {
          delete room.attendees[attendeeId];
          room.lastUpdated = Date.now();
          broadcastToRoom(roomId, {
            type: 'ATTENDEE_LEFT',
            attendeeId,
          });
        }
      }
    });
  });

  // Vite middleware in dev mode / Static in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Meeting Room server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
