<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Hang Out

Hang Out is a real-time artist community app with rap battles, collaboration rooms, and optional Gemini-powered tools.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env`.
3. Set `GEMINI_API_KEY` only in the backend environment. Do not use `VITE_GEMINI_API_KEY`.
4. Add the Firebase `VITE_FIREBASE_*` values when Firebase is enabled.
5. Set `VITE_BACKEND_URL` to the deployed backend URL for production.
6. Run the app:
   `npm run dev`

## Deployment architecture

Vercel can host the Vite frontend, but it does not host the long-lived WebSocket server in `server.ts`. Deploy that backend separately with Firebase Cloud Functions or Google Cloud Run, then set `VITE_BACKEND_URL` in Vercel. Keep `GEMINI_API_KEY` in that backend's environment only.
