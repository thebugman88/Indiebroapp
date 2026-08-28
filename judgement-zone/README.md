<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Judgement Zone

Blind peer review for independent artists. The app uses Firebase Anonymous Auth and Firestore when configured, with local browser storage available for development without a Firebase project.

## Run Locally

**Prerequisites:** Node.js 20+

1. Copy `.env.example` to `.env.local` and fill in the `VITE_FIREBASE_*` values from your Firebase web app.
2. In Firebase Console, enable **Authentication > Anonymous** and create a **Firestore Database**.
3. Install dependencies: `npm install`
4. Start the app: `npm run dev`

## Firebase and Vercel

Add the six `VITE_FIREBASE_*` values as Vercel project environment variables for Preview and Production, then redeploy. Vite exposes only variables prefixed with `VITE_` to the browser; never put service-account credentials or private Gemini keys in these variables.

The current client writes profiles to `userProfiles/{anonymousUid}` and tracks to `tracks/{trackId}`. Before accepting untrusted public traffic, deploy Firestore Security Rules that require `request.auth != null`, restrict profile writes to `request.auth.uid == userId`, and validate review/quota mutations in a trusted Cloud Function or Vercel server endpoint. Browser-side quota checks are UX safeguards, not security controls.

Audio and cover-art object URLs are session-local previews. Production submissions need Firebase Storage upload plus Storage Rules before those assets can be shared across devices.
