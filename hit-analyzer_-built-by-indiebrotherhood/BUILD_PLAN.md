# Hit Analyzer - Build Plan & Setup Guide
*Built by indiebrotherhood*

## Overview
Hit Analyzer is an elite audio intelligence platform built for independent artists and music producers. It provides cross-platform hit potential analysis based on current 2026 trending music metrics across TikTok, Spotify, Apple Music, Shazam, and YouTube.

---

## Key Modules & Specifications

### 1. Branding & Hierarchy
- **Title**: Hit Analyzer
- **Subtitle**: built by indiebrotherhood
- **Footer**: "© 2026 indiebrotherhood. All rights reserved."
- **Feature Icons (Footer)**:
  1. **Cross-Platform Trend Benchmark**: Calibrated against 2026 viral streaming dynamics.
  2. **Copyright Protection Guard**: Automatic artist track verification and cover song rejection.
  3. **Acoustic & Vocal Diagnostics**: Deep breakdown of tune, vocal placement, vibe, and mix balance.
  4. **Hit Potential Engine**: Actionable scoring and strategic production tweak guide.

### 2. Audio & Data Inputs
- **File Upload**: Native audio file handling (`.mp3`, `.wav`, `.m4a`, `.aac`, `.flac`) with drag-and-drop & file picker.
- **URL Input**: Support for SoundCloud, YouTube, direct MP3 links, or custom streaming URLs.
- **Interactive Sample Tracks**: Pre-loaded indie artist audio demos for instant 1-click testing.
- **Lyrics Input**: Optional text box for verse/chorus lyrics analysis.
- **Smart Lyric Reminder Modal**:
  - Triggers if user clicks "Analyze" without entering lyrics.
  - Explains why lyrics improve phonetics and narrative scoring.
  - Features a persistent "Don't show me this again" checkbox (`localStorage`).

### 3. Copyright Guard & Terms of Service
- **Copyright Check Protocol**: Server-side & client-side screening for commercial mainstream tracks (e.g., Drake, Taylor Swift, Kendrick Lamar, Dua Lipa, Billie Eilish, etc.) or standard cover songs.
- **Refusal Engine**: Rejects non-original work with clear explanation, citing terms of service.
- **Terms & Legal Drawer**: Full Terms of Service covering original content ownership, fair use, copyright warnings, and zero cover-song policy.

### 4. Analysis Engine & Scoring Output
- **Overall Hit Potential Score**: 0 - 100 Scale with dynamic status badges (*Chart Prospect*, *Viral Contender*, *Radio Ready*, *Underground Gem*, *Needs Refinement*).
- **Core Diagnostics**:
  - Audio & Mix Dynamics (Frequency balance, loudness, dynamic range)
  - Vocal Placement & Clarity (Tune, tone, emotion, pitch precision)
  - Melody & Hook Power (Catchiness, earworm index, intro hook velocity)
  - Genre & Vibe Signature (Primary/Secondary genre, mood tags, tempo BPM estimation)
- **Actionable Report**:
  - **What's Working**: Detailed highlights of the song's strongest assets.
  - **Areas for Tweak & Improvement**: Specific, high-impact suggestions for arrangement, mixing, vocal performance, and song structure.
  - **Logic & Methodology Breakdown**: Explanation of how the AI benchmarks audio features against top-charting algorithms.

---

## Server Architecture (Express + Vite)
- **`server.ts`**:
  - Handlers for `/api/analyze` (Gemini 3.6 Flash / audio base64 or metadata processing)
  - Handlers for `/api/health`
  - Integration with `@google/genai` using `process.env.GEMINI_API_KEY` with `User-Agent: 'aistudio-build'`
  - Full fallback/mock audio feature synthesis for custom local audio files or demo tracks when Gemini returns structured results.

---

## Execution Checklist
1. Update `metadata.json` & `package.json` with build scripts (`dev`, `build`, `start`).
2. Implement Express server (`server.ts`) with Gemini integration & fallback music intelligence.
3. Build UI components in `/src/components/`:
   - `Header.tsx` (Logo, Title, Subtitle, Help/TOS Modal trigger)
   - `AudioInputSection.tsx` (File upload, Audio URL, Sample demo track selector)
   - `LyricSection.tsx` (Lyrics input area with reminder trigger)
   - `LyricReminderModal.tsx` ("Best results with lyrics" popup with persistent opt-out)
   - `CopyrightGuardNotice.tsx` (TOS notice & copyright refusal alerts)
   - `AnalysisResults.tsx` (Hit score meter, audio breakdown tabs, Strengths, Tweaks, Logic guide)
   - `HelpTermsModal.tsx` (Full explanation of AI logic, Terms of Service, anti-copyright policy)
   - `Footer.tsx` (4 feature badges, legal notice, copyright statement)
4. Verify with `compile_applet` and test server restart.
