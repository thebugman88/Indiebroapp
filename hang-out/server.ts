import express from 'express';
import path from 'path';
import { createServer as createHttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3001;
const httpServer = createHttpServer(app);

// Initialize Gemini AI Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// --- IN-MEMORY DATA STORES ---
interface ClientSocket extends WebSocket {
  id?: string;
  userProfile?: {
    id: string;
    nickname: string;
    role: string;
    avatarUrl: string;
    favoriteGenre: string;
  };
  currentRoom?: string;
}

// Connected clients list
const connectedClients = new Map<string, ClientSocket>();

// Chat messages store per room (last 100 messages)
const roomMessages: Record<string, any[]> = {
  'rap-battle-lobby': [],
  'rap-battle-flow': [],
  'rap-battle-fluent': [],
  'rap-battle-fanatic': [],
  'collaboration-Hip-Hop': [],
  'collaboration-R&B': [],
  'collaboration-Trap': [],
  'collaboration-Lo-Fi': [],
  'collaboration-Pop/Indie': [],
  'collaboration-Rock/Alternative': [],
  'collaboration-EDM': [],
  'collaboration-Drill': [],
  'collaboration-Afrobeat': [],
  'lounge': [],
  'marketing': [],
  'beat-showcase': [],
};

// Shared pad content per room
const roomSharedPads: Record<string, string> = {};

// Active rap battles
const activeBattles: Record<string, any> = {};

// Matchmaking queues per tier
const matchmakingQueues: Record<string, any[]> = {
  Flow: [],
  Fluent: [],
  Fanatic: [],
};

// --- GEMINI API ROUTES ---

// 1. Rap Battle Judge Route
app.post('/api/gemini/battle-judge', async (req, res) => {
  try {
    const { player1Name, player2Name, player1Verses, player2Verses, tier } = req.body;

    const prompt = `You are the Master Rap Battle Judge for "Hang Out by indiebrotherhood".
Evaluate this rap battle in the "${tier || 'Fluent'}" tier between ${player1Name} and ${player2Name}.

${player1Name}'s Verses:
${player1Verses.join('\n---\n')}

${player2Name}'s Verses:
${player2Verses.join('\n---\n')}

Provide an authentic, insightful hip-hop battle rap verdict in JSON format:
- rhymeAndFlow: score out of 10 for ${player1Name} vs ${player2Name} cadence and multi-syllabic schemes.
- punchlinesAndDelivery: score out of 10 for impact and cleverness.
- wordplayAndCadence: score out of 10 for metaphor and rhythmic pocket.
- totalScore: composite winner determination.
- winnerId: Name of the winner (${player1Name} or ${player2Name}).
- judgeFeedback: A fiery 2-3 sentence breakdown highlighting the best punchlines, technical scheme, and reason for the decision.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            p1RhymeFlow: { type: Type.NUMBER },
            p1Punchlines: { type: Type.NUMBER },
            p1Wordplay: { type: Type.NUMBER },
            p2RhymeFlow: { type: Type.NUMBER },
            p2Punchlines: { type: Type.NUMBER },
            p2Wordplay: { type: Type.NUMBER },
            winnerName: { type: Type.STRING },
            judgeFeedback: { type: Type.STRING },
          },
          required: ['p1RhymeFlow', 'p2RhymeFlow', 'winnerName', 'judgeFeedback'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, evaluation: parsed });
  } catch (error: any) {
    console.error('Battle judge error:', error);
    return res.status(500).json({ error: error.message || 'Failed to judge battle' });
  }
});

// 2. AI Rap Opponent Bot Generator Route
app.post('/api/gemini/ai-bot-rap', async (req, res) => {
  try {
    const { botName, tier, opponentVerse, round, beatStyle } = req.body;

    const prompt = `You are ${botName || 'MC Spitfire'}, a skilled battle rapper dropping bars in the "${tier || 'Fluent'}" tier on Hang Out by indiebrotherhood.
Round: ${round || 1}.
Opponent's last verse to counter: "${opponentVerse || 'Ready for action'}".
Beat style: ${beatStyle || 'Classic 90s Boom Bap'}.

Task: Write a fiery, 4-line or 8-line battle rap verse that responds directly to opponent's bars with clever rhymes, rhythm, and punchlines fitting the ${tier} skill level. (Flow = accessible rhythm; Fluent = multi-syllabic & double entendre; Fanatic = aggressive fast bars and heavy metaphors).
Return purely the verse text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an authentic, clever battle rapper writing clean, fiery rap battle bars with rhyme and rhythm.',
      },
    });

    return res.json({ success: true, verse: response.text?.trim() || 'I step to the mic, turn the heat to ten,\nDrop bars on the beat, then I do it again!' });
  } catch (error: any) {
    console.error('AI rap bot error:', error);
    return res.json({
      success: true,
      verse: 'I step to the mic with the rhythm and flow,\nIndiebrotherhood stage where the true legends grow!',
    });
  }
});

// 3. AI Marketing Advisor Route
app.post('/api/gemini/marketing-advisor', async (req, res) => {
  try {
    const { trackTitle, genre, vibe, goals } = req.body;

    const prompt = `You are the Lead Music Marketer for "Hang Out by indiebrotherhood".
An indie artist is releasing:
Track Title: "${trackTitle}"
Genre: "${genre}"
Vibe/Description: "${vibe}"
Target Goal: "${goals || 'Get Spotify playlisting, TikTok viral traction, and indie blog coverage'}"

Provide a detailed, actionable marketing strategy in JSON format:
1. playlistPitching: 3 specific pitch angles to submit to Spotify for Artists editors & curating channels.
2. tikTokHooks: 4 creative short-form video concept ideas (TikTok/Reels/Shorts) tied to the song's energy.
3. rolloutTimeline: 4-week rollout schedule (Week -2, Week -1, Release Day, Week +1).
4. epkTips: 2-3 key sentences for their Electronic Press Kit bio.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playlistPitching: { type: Type.ARRAY, items: { type: Type.STRING } },
            tikTokHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
            rolloutTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  week: { type: Type.STRING },
                  tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['week', 'tasks'],
              },
            },
            epkTips: { type: Type.STRING },
          },
          required: ['playlistPitching', 'tikTokHooks', 'rolloutTimeline', 'epkTips'],
        },
      },
    });

    const strategy = JSON.parse(response.text || '{}');
    return res.json({ success: true, strategy });
  } catch (error: any) {
    console.error('Marketing advisor error:', error);
    return res.status(500).json({ error: 'Failed to generate marketing plan' });
  }
});

// --- WEBSOCKET SERVER FOR REAL-TIME ROOMS & MATCHMAKING ---
const wss = new WebSocketServer({ noServer: true });

// Handle HTTP upgrade for WebSockets
httpServer.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Broadcast helper
function broadcastToRoom(roomId: string, data: any) {
  const payload = JSON.stringify(data);
  for (const client of connectedClients.values()) {
    if (client.readyState === WebSocket.OPEN && client.currentRoom === roomId) {
      client.send(payload);
    }
  }
}

// Broadcast to ALL connected clients
function broadcastToAll(data: any) {
  const payload = JSON.stringify(data);
  for (const client of connectedClients.values()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function getOnlineArtistCount() {
  return [...connectedClients.values()].filter((client) => client.userProfile).length;
}

// Get active room user list
function getRoomUsers(roomId: string) {
  const users: any[] = [];
  for (const client of connectedClients.values()) {
    if (client.currentRoom === roomId && client.userProfile) {
      users.push(client.userProfile);
    }
  }
  return users;
}

wss.on('connection', (ws: ClientSocket) => {
  const clientId = Math.random().toString(36).substring(2, 10);
  ws.id = clientId;
  connectedClients.set(clientId, ws);

  ws.on('message', async (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw.toString());

      switch (data.type) {
        case 'REGISTER_USER': {
          ws.userProfile = data.profile;
          ws.send(JSON.stringify({ type: 'REGISTER_SUCCESS', clientId, onlineCount: getOnlineArtistCount() }));
          broadcastToAll({ type: 'ONLINE_COUNT_UPDATE', count: getOnlineArtistCount() });
          break;
        }

        case 'JOIN_ROOM': {
          const { roomId, profile } = data;
          if (profile) ws.userProfile = profile;

          // Leave old room notice
          if (ws.currentRoom && ws.currentRoom !== roomId) {
            broadcastToRoom(ws.currentRoom, {
              type: 'USER_LEFT_ROOM',
              userId: ws.userProfile?.id,
              roomUsers: getRoomUsers(ws.currentRoom).filter(u => u.id !== ws.userProfile?.id),
            });
          }

          ws.currentRoom = roomId;

          // Send room history & active users
          const history = roomMessages[roomId] || [];
          const pad = roomSharedPads[roomId] || '';
          ws.send(
            JSON.stringify({
              type: 'ROOM_JOINED',
              roomId,
              history,
              sharedPad: pad,
              roomUsers: getRoomUsers(roomId),
              activeBattles: Object.values(activeBattles).filter((b) => b.roomId === roomId || b.tier === roomId.replace('rap-battle-', '')),
            })
          );

          // Broadcast user joined room
          broadcastToRoom(roomId, {
            type: 'USER_JOINED_ROOM',
            user: ws.userProfile,
            roomUsers: getRoomUsers(roomId),
          });
          break;
        }

        case 'SEND_CHAT_MESSAGE': {
          const { roomId, message } = data;
          if (!roomMessages[roomId]) roomMessages[roomId] = [];

          const fullMsg = {
            ...message,
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            timestamp: Date.now(),
          };

          roomMessages[roomId].push(fullMsg);
          if (roomMessages[roomId].length > 100) roomMessages[roomId].shift();

          broadcastToRoom(roomId, {
            type: 'NEW_CHAT_MESSAGE',
            roomId,
            message: fullMsg,
          });
          break;
        }

        case 'UPDATE_SHARED_PAD': {
          const { roomId, content, user } = data;
          roomSharedPads[roomId] = content;
          broadcastToRoom(roomId, {
            type: 'SHARED_PAD_UPDATED',
            roomId,
            content,
            updatedBy: user?.nickname || 'An Artist',
          });
          break;
        }

        case 'ENTER_MATCHMAKING': {
          const { tier, user } = data;

          // Check if queue already has waiting player
          const queue = matchmakingQueues[tier] || [];
          const existingIdx = queue.findIndex((q) => q.user.id === user.id);

          if (existingIdx === -1) {
            queue.push({ socketId: ws.id, user });
          }

          if (queue.length >= 2) {
            // Match 2 human players!
            const p1 = queue.shift();
            const p2 = queue.shift();

            const battleId = 'battle_' + Date.now();
            const newBattle = {
              id: battleId,
              roomId: `rap-battle-${tier.toLowerCase()}`,
              tier,
              player1: p1.user,
              player2: p2.user,
              status: 'in-progress',
              currentRound: 1,
              turnPlayerId: p1.user.id,
              timeRemaining: 45,
              verses: [],
              spectatorVotes: { p1Votes: 0, p2Votes: 0, voterIds: [] },
              createdAt: Date.now(),
            };

            activeBattles[battleId] = newBattle;

            broadcastToRoom(`rap-battle-${tier.toLowerCase()}`, {
              type: 'BATTLE_MATCHED',
              battle: newBattle,
            });
            broadcastToRoom('rap-battle-lobby', {
              type: 'BATTLE_MATCHED',
              battle: newBattle,
            });
          } else {
            // Notify player searching
            ws.send(JSON.stringify({ type: 'MATCHMAKING_SEARCHING', tier }));

            // Fallback after 3.5 seconds to launch match with AI Battle Bot if no second human joins!
            setTimeout(() => {
              const currentQueue = matchmakingQueues[tier] || [];
              const qIdx = currentQueue.findIndex((q) => q.user.id === user.id);

              if (qIdx !== -1) {
                // Remove player from queue and trigger AI match
                currentQueue.splice(qIdx, 1);

                const aiBotNames = ['Slick Rhymes (AI)', 'MC Spitfire (AI)', 'Cypher King (AI)', 'Beat Slayer (AI)'];
                const botName = aiBotNames[Math.floor(Math.random() * aiBotNames.length)];

                const aiBotUser = {
                  id: 'bot_' + Math.random().toString(36).substring(2, 7),
                  nickname: botName,
                  role: 'Rapper',
                  avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
                  favoriteGenre: 'Hip-Hop',
                  battlesWon: 42,
                  battlesTotal: 50,
                  reputation: 999,
                };

                const battleId = 'battle_' + Date.now();
                const newBattle = {
                  id: battleId,
                  roomId: `rap-battle-${tier.toLowerCase()}`,
                  tier,
                  player1: user,
                  player2: aiBotUser,
                  isAiMatch: true,
                  status: 'in-progress',
                  currentRound: 1,
                  turnPlayerId: user.id,
                  timeRemaining: 45,
                  verses: [],
                  spectatorVotes: { p1Votes: 0, p2Votes: 0, voterIds: [] },
                  createdAt: Date.now(),
                };

                activeBattles[battleId] = newBattle;

                broadcastToRoom(`rap-battle-${tier.toLowerCase()}`, {
                  type: 'BATTLE_MATCHED',
                  battle: newBattle,
                });
                broadcastToRoom('rap-battle-lobby', {
                  type: 'BATTLE_MATCHED',
                  battle: newBattle,
                });
              }
            }, 3500);
          }
          break;
        }

        case 'CANCEL_MATCHMAKING': {
          const { tier, userId } = data;
          if (matchmakingQueues[tier]) {
            matchmakingQueues[tier] = matchmakingQueues[tier].filter((q) => q.user.id !== userId);
          }
          ws.send(JSON.stringify({ type: 'MATCHMAKING_CANCELLED' }));
          break;
        }

        case 'SUBMIT_BATTLE_VERSE': {
          const { battleId, verseText, audioUrl, author } = data;
          const battle = activeBattles[battleId];

          if (battle && battle.status === 'in-progress') {
            const verse = {
              id: 'verse_' + Date.now(),
              battleId,
              round: battle.currentRound,
              authorId: author.id,
              authorName: author.nickname,
              text: verseText,
              audioUrl,
              timestamp: Date.now(),
            };

            battle.verses.push(verse);

            // Switch turn
            const nextTurnId = author.id === battle.player1.id ? battle.player2.id : battle.player1.id;

            // Check if round finished
            const roundVerses = battle.verses.filter((v: any) => v.round === battle.currentRound);

            if (roundVerses.length >= 2) {
              if (battle.currentRound >= 3) {
                // Battle completed, move to judging!
                battle.status = 'judging';
              } else {
                battle.currentRound += 1;
                battle.turnPlayerId = battle.player1.id;
              }
            } else {
              battle.turnPlayerId = nextTurnId;
            }

            broadcastToRoom(battle.roomId, {
              type: 'BATTLE_UPDATED',
              battle,
            });
            broadcastToRoom('rap-battle-lobby', {
              type: 'BATTLE_UPDATED',
              battle,
            });

            // If next turn is an AI Bot, trigger AI response verse!
            if (battle.status === 'in-progress' && nextTurnId.startsWith('bot_')) {
              setTimeout(async () => {
                try {
                  const botPrompt = `You are ${battle.player2.nickname}, battling against ${author.nickname} in Round ${battle.currentRound} of ${battle.tier} tier battle rap.
Opponent verse: "${verseText}"
Drop a clever 4-line battle response.`;

                  const aiRes = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: botPrompt,
                  });

                  const botVerseText = aiRes.text?.trim() || "My mic is glowing gold, my lines are sharp and clear,\nIndiebrotherhood in the house, the king of rap is here!";

                  const botVerse = {
                    id: 'verse_' + Date.now(),
                    battleId,
                    round: battle.currentRound,
                    authorId: battle.player2.id,
                    authorName: battle.player2.nickname,
                    text: botVerseText,
                    timestamp: Date.now(),
                  };

                  battle.verses.push(botVerse);

                  // Update round or turn
                  const currentRoundVerses = battle.verses.filter((v: any) => v.round === battle.currentRound);
                  if (currentRoundVerses.length >= 2) {
                    if (battle.currentRound >= 3) {
                      battle.status = 'judging';
                    } else {
                      battle.currentRound += 1;
                      battle.turnPlayerId = battle.player1.id;
                    }
                  } else {
                    battle.turnPlayerId = battle.player1.id;
                  }

                  broadcastToRoom(battle.roomId, {
                    type: 'BATTLE_UPDATED',
                    battle,
                  });
                  broadcastToRoom('rap-battle-lobby', {
                    type: 'BATTLE_UPDATED',
                    battle,
                  });
                } catch (e) {
                  console.error('Error generating bot verse:', e);
                }
              }, 2000);
            }
          }
          break;
        }

        case 'SPECTATOR_VOTE': {
          const { battleId, voteForPlayerId, userId } = data;
          const battle = activeBattles[battleId];

          if (battle && !battle.spectatorVotes.voterIds.includes(userId)) {
            battle.spectatorVotes.voterIds.push(userId);
            if (voteForPlayerId === battle.player1.id) {
              battle.spectatorVotes.p1Votes += 1;
            } else {
              battle.spectatorVotes.p2Votes += 1;
            }

            broadcastToRoom(battle.roomId, {
              type: 'BATTLE_UPDATED',
              battle,
            });
          }
          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.error('WS error processing message:', e);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(clientId);
    if (ws.currentRoom && ws.userProfile) {
      broadcastToRoom(ws.currentRoom, {
        type: 'USER_LEFT_ROOM',
        userId: ws.userProfile.id,
        roomUsers: getRoomUsers(ws.currentRoom),
      });
    }
    broadcastToAll({ type: 'ONLINE_COUNT_UPDATE', count: getOnlineArtistCount() });
  });
});

// Seed initial lively ambient chat messages so every room feels instantly active!
function seedInitialAmbientData() {
  const sampleUsers = [
    { id: 'u1', nickname: 'ApexBeats', role: 'Producer', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', favoriteGenre: 'Trap' },
    { id: 'u2', nickname: 'LyricArchitect', role: 'Rapper', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', favoriteGenre: 'Hip-Hop' },
    { id: 'u3', nickname: 'VelvetSoul', role: 'Singer/Songwriter', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', favoriteGenre: 'R&B' },
    { id: 'u4', nickname: 'MixMasterG', role: 'Audio Engineer', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', favoriteGenre: 'Lo-Fi' },
  ];

  roomMessages['lounge'] = [
    { id: 'm1', roomId: 'lounge', sender: sampleUsers[0], content: "Yo family! Welcome to Hang Out by indiebrotherhood. Just finished a 140BPM Drill beat in the studio 🔥", timestamp: Date.now() - 600000 },
    { id: 'm2', roomId: 'lounge', sender: sampleUsers[1], content: "Ayy line up in the Rap Battle arena! Testing punchlines in the Fluent room.", timestamp: Date.now() - 400000 },
    { id: 'm3', roomId: 'lounge', sender: sampleUsers[2], content: "Looking for a producer to cook an R&B hook on a warm rhodes progression!", timestamp: Date.now() - 200000 },
  ];

  roomMessages['rap-battle-flow'] = [
    { id: 'm_rf1', roomId: 'rap-battle-flow', sender: sampleUsers[1], content: "Flow tier is active! Warm up your double-time schemes and clean cadences.", timestamp: Date.now() - 300000 },
  ];

  roomSharedPads['collaboration-Hip-Hop'] = `// HANG OUT COLLAB SCRATCHPAD (Hip-Hop)
Verse 1 (Hook Idea):
"From the basement studio to the main stage light,
Indiebrotherhood we grinding through the night.
No major label contract, we holding our own,
Every beat, every bar, we building the throne."

[Drop your bars below and collaborate!]`;
}

seedInitialAmbientData();

// Start Express server + Vite
async function startApp() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist/client');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Hang Out server running on http://0.0.0.0:${PORT}`);
  });
}

startApp();
