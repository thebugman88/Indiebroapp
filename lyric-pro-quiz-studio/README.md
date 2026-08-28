# SONIC IQ LAB
> **Engineered by indiebrotherhood**

Welcome to the **SONIC IQ LAB** architecture documentation! This file contains developer and creator instructions for monetization, backend API proxying, audio synthesizers, and combining modular micro-apps into a single master super-app.

---

## 1. Zero-Key Server API Architecture (No API Keys Required for Visitors)

### How It Works for Public Users:
Visitors to your application **never need to bring or enter their own API keys**. All requests are routed through a secure, full-stack server-side proxy.

- **Client Side (`/src/components/AiQuizGeneratorModal.tsx`)**:
  - User selects genre, difficulty, theme, and prompt.
  - Client sends a POST request to `/api/generate-quiz`.
- **Server Side (`/server.ts`)**:
  - Express server receives the request and initializes the Google Gemini API client (`@google/genai`) using `process.env.GEMINI_API_KEY`.
  - The API key stays 100% hidden on the server and is never exposed to browser network tabs.
  - Generates structured JSON trivia quizzes and returns them directly to the client.

---

## 2. Audio Snippet Engine (Web Audio Synthesizer)

To guarantee that audio snippet quizzes work 100% reliably for all visitors without copyright strikes, external CDN rate limits, or broken audio links:

- Located at: `/src/lib/audioSynth.ts` (`sonicSynth`)
- Utilizes the browser's native **Web Audio API** to synthesize 5-second copyright-free musical snippets dynamically per genre (Hip Hop basslines, EDM arpeggios, Rock synth leads, Pop chords).
- Features interactive play/stop controls, live audio spectrum bouncing graphics, and victory/defeat sound effects.

---

## 3. Monetization & Ad Revenue Strategy

The app comes pre-configured with high-conversion monetization placements ready for AdSense / Google AdMob / Direct Sponsor integration:

### A. Rewarded Video Ads (`/src/components/SponsoredAdBanner.tsx` - `variant="reward_cta"`)
- Players can click **"EARN +500 PTS"** inside any quiz round to watch a 5-second sponsored video clip.
- Upon completion, the player automatically earns +500 Bonus Points added directly to their Vault score.
- **Why it works**: Rewarded video ads carry the highest eCPM ($15 - $40+) in web and mobile gaming.

### B. Native Sponsored Banner Placement (`SponsoredAdBanner.tsx` - `variant="banner"`)
- Positioned on the main home screen and dashboard feed.
- Clean, non-intrusive card layout for promoting audio equipment, music tools, or partner products.

### C. Sonic VIP Pass / Monetization Upgrades
- Can be wired to Stripe or Google Pay to offer an ad-free tier, unlimited custom AI quiz generation, or exclusive leaderboard badges.

---

## 4. Master Super-App Merger Blueprint

You mentioned building modular micro-apps and then combining them into one single master platform. Here is the step-by-step roadmap to merge **SONIC IQ LAB** with your other micro-pages:

### Step 1: Central Navigation Router
- Wrap the root component in `react-router-dom` or a top-level tab controller:
  - `/` -> **Sonic IQ Lab** (Timed Trivia & Audio Quizzes)
  - `/lyric-studio` -> **Lyric Pro Studio** (Songwriting & Rhyme Generator)
  - `/beat-lab` -> **Beat Lab** (Interactive Drum Pads & Synth)

### Step 2: Unified User Vault & Global State
- Standardize user state across all micro-apps by sharing `LOCAL_STORAGE_VAULT_KEY` (`sonic_iq_lab_user_stats_vault_2026`).
- Points earned in trivia quizzes can be spent on unlockable sound packs or AI credits in your other micro-apps!

### Step 3: Shared Server Backend (`/server.ts`)
- Combine API routes under `/api/*`:
  - `/api/generate-quiz` (Sonic IQ Lab)
  - `/api/rhyme-helper` (Lyric Studio)
  - `/api/master-audio` (Beat Lab)

### Step 4: Shared UI Component Library
- Reuse `/src/components/Header.tsx`, `/src/components/Footer.tsx`, and `/src/components/SponsoredAdBanner.tsx` across every sub-app for a unified branding experience under `indiebrotherhood`.

---

&copy; 2026 **indiebrotherhood** - All Rights Reserved.
