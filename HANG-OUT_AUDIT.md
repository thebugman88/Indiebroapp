# 🎤 Hang Out — Full Code Audit
**Project:** `hang-out`  
**Stack:** Vite + React 19 + TypeScript + TailwindCSS v4 + Express + WebSocket + Gemini AI  
**Deploy Target:** Currently local only (Express server won't run on Vercel)  
**Date:** 2026-08-23

---

## ✅ What's Working Well

| Area | Status | Notes |
|------|--------|-------|
| Real-time WebSocket server | ✅ Solid | Multi-room chat, shared pads, matchmaking all functional |
| Room management | ✅ Working | Rap-Battle, Collaboration, Lounge, Marketing, Showcase rooms fully wired |
| Battle matching & state | ✅ Working | Tier-based queuing and battle state updates broadcast correctly |
| UI/UX Design | ✅ Premium | Dark theme with glassmorphism, real-time indicators, responsive layout |
| TypeScript interfaces | ✅ Clean | Well-structured `types.ts` with all room and user profiles defined |

---

## 🚨 Critical Bugs (Fix These First)

### 1. **`server.ts` Lines 101, 144, 180, 509 — Wrong Gemini Model Name → All AI Endpoints Fail**

```ts
model: 'gemini-3.6-flash',  // ❌ Does not exist (4 occurrences)
```

The correct model is `"gemini-2.5-flash"`. Every AI-powered feature fails:
- ✗ `/api/gemini/battle-judge` (battle verdict)
- ✗ `/api/gemini/ai-bot-rap` (AI opponent verses)
- ✗ `/api/gemini/marketing-advisor` (marketing strategy)
- ✗ AI bot auto-response in WebSocket handler

**Fix:** Replace all 4 occurrences with `"gemini-2.5-flash"`.

---

### 2. **Architecture — Express Server Won't Run on Vercel**

```
LOCAL DEV: npm run dev → tsx server.ts ✅ Works
VERCEL DEPLOY: npm run build:vercel → No Express server ❌ 404 on all /api/* routes
```

Hang Out relies on Express endpoints:
- `/api/gemini/battle-judge` — POST
- `/api/gemini/ai-bot-rap` — POST  
- `/api/gemini/marketing-advisor` — POST

**Current Problem:** 
- On Vercel, Express server never starts
- Frontend calls `fetch('/api/gemini/...')` → gets 404
- **WebSocket also won't connect** on Vercel (Express server is the WebSocket host)

**Solution:** 
1. **Create Vercel Serverless Functions** for the 3 AI endpoints
2. **Host WebSocket separately** (Vercel doesn't support persistent WebSocket servers)
   - Use **Socket.io on Vercel** with persistent function, OR
   - Use **Fly.io / Railway** for the WebSocket + Express server
   - Use **PubSub service** (e.g., Pusher, Firebase Realtime) for real-time sync

Recommended: **Keep Express locally for WebSocket**, deploy **AI endpoints as Vercel serverless functions**.

---

### 3. **Missing `vercel.json` Configuration**

No `vercel.json` exists. Vercel needs explicit config to:
- Route `/api/*` to serverless functions
- Rewrite root to `index.html` (SPA support)
- Set environment variables in deployment

---

## ⚠️ Configuration Issues

| What | Problem | Solution |
|------|---------|----------|
| `package.json` name | Set to `"react-example"` | Change to `"hang-out"` |
| `vite.config.ts` | Doesn't expose `GEMINI_API_KEY` to client | Add `define` config like royalty/lyric-pro apps |
| `.env.example` | Says "AI Studio automatically injects" | Update to Vercel env var instructions |
| No `vercel.json` | Missing deploy config | Create with rewrites & build settings |

---

## 📋 Prioritized Fix List

| Priority | File | Issue | Action |
|----------|------|-------|--------|
| 🔴 Critical | `server.ts` L101, 144, 180, 509 | Model `gemini-3.6-flash` doesn't exist | Replace with `gemini-2.5-flash` (4 places) |
| 🔴 Critical | Architecture | Express/WebSocket won't run on Vercel | Create `api/` serverless functions + decide WebSocket strategy |
| 🔴 Critical | Missing file | No `vercel.json` | Create with SPA rewrites & env config |
| 🟡 Important | `package.json` | Name is `react-example` | Change to `hang-out` |
| 🟡 Important | `vite.config.ts` | `GEMINI_API_KEY` not exposed to client | Add `loadEnv` + `define` config |
| 🟡 Important | `.env.example` | Wrong instructions for Vercel | Update to Vercel deploy docs |

---

## 🎯 WebSocket & Real-Time Architecture (Vercel Challenge)

### Current Setup (Local)
```
Browser → Express WebSocket (localhost:3000)
         ↓
     Real-time rooms, chat, battles
```

### Vercel Deployment Problem
Vercel doesn't support:
- Persistent WebSocket connections
- Long-lived Express servers

### Solutions:

**Option A: Use PubSub Service (Easiest for Vercel)**
- Replace WebSocket with **Pusher**, **Socket.io Cloud**, or **Firebase Realtime**
- AI endpoints become serverless functions
- Real-time sync handled by PubSub service
- **Pros:** Vercel-native, scales automatically
- **Cons:** Costs money, requires SDK swap

**Option B: Keep Express Locally, Use Serverless for AI (Recommended)**
- Deploy **Express + WebSocket to Fly.io or Railway**
- Deploy **AI endpoints to Vercel** as serverless functions
- **Pros:** Free tier available, uses existing code
- **Cons:** Two deployments to manage

**Option C: Socket.io with Adapter (Medium Complexity)**
- Replace WebSocket with `socket.io`
- Use Redis/Postgres adapter for Vercel Functions to communicate
- Runs WebSocket as part of serverless function lifecycle
- **Pros:** All in Vercel
- **Cons:** More complex, needs Redis setup

---

## 📝 Recommended Immediate Actions

### Phase 1: Critical Fixes (Today)
1. Fix Gemini model name (4 places) → `gemini-2.5-flash`
2. Update `package.json` name → `hang-out`
3. Update `.env.example` → Vercel instructions
4. Expose `GEMINI_API_KEY` in `vite.config.ts`

### Phase 2: Deployment Strategy (This Week)
Choose WebSocket solution:
- **A:** Switch to Pusher/Socket.io Cloud
- **B:** Deploy Express to Fly.io, AI to Vercel
- **C:** Use Socket.io Redis adapter

### Phase 3: Vercel Setup (This Week)
- Create Vercel serverless functions for AI endpoints
- Create `vercel.json` config
- Set `GEMINI_API_KEY` in Vercel env vars
- Deploy frontend + AI endpoints

---

## Summary

Hang Out has a **solid real-time architecture** with WebSocket rooms, battle matchmaking, and collaborative features all working great locally. The **core issue is Vercel deployment**: the Express server that hosts WebSocket and AI endpoints doesn't run on Vercel. 

**Immediate action:** Fix the 4 Gemini model name errors + decide on a WebSocket hosting strategy (PubSub service vs. separate deployment). Once decided, the Vercel serverless setup is straightforward.

The app is **production-quality for local/self-hosted deployment** right now. For Vercel, needs architectural decisions first.
