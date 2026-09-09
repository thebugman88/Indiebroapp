import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3002;

// Increase payload size limit for base64 audio uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Health
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Known commercial artists list for quick client/server sanity check
const KNOWN_COMMERCIAL_ARTISTS = [
  "drake", "taylor swift", "kendrick lamar", "beyonce", "the weeknd", "dua lipa",
  "billie eilish", "sza", "ed sheeran", "ariana grande", "post malone", "bruno mars",
  "morgan wallen", "olivia rodrigo", "harry styles", "eminem", "justin bieber",
  "rihanna", "kanye west", "travis scott", "bad bunny", "coldplay", "adele",
  "lady gaga", "sabrina carpenter", "chappell roan", "charli xcx", "luke combs"
];

// High-precision analysis endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { audioData, audioName, artistName, lyrics, inputMethod, mimeType } = req.body;

    if (!audioData || !audioData.startsWith("data:")) {
      return res.status(400).json({ error: "Upload an audio file to analyze it. A title or URL alone cannot be measured." });
    }

    const titleLower = (audioName || "").toLowerCase();
    const artistLower = (artistName || "").toLowerCase();
    const lyricsLower = (lyrics || "").toLowerCase();

    // Direct check for commercial artists or explicit cover songs in meta
    const isKnownArtist = KNOWN_COMMERCIAL_ARTISTS.some(
      (artist) => titleLower.includes(artist) || artistLower.includes(artist)
    );
    const isExplicitCover = titleLower.includes("cover") || titleLower.includes("tribute") || lyricsLower.includes("original by") || titleLower.includes("remake");

    if (isKnownArtist || isExplicitCover) {
      return res.json({
        isCopyrightedOrCover: true,
        copyrightReason: isExplicitCover
          ? "Cover songs and re-recordings of existing copyrighted compositions are strictly prohibited under our Terms of Service."
          : `The track title or artist matches protected commercial metadata associated with major label artists (${artistName || audioName}). Hit Analyzer only processes 100% original, unreleased indie content.`,
        hitPotentialScore: 0,
        tierBadge: "Refused - Copyright Guard",
      });
    }

    const ai = getGeminiClient();

    // If Gemini client is available, run multimodal/structured reasoning
    if (ai) {
      try {
        const promptText = `
You are Hit Analyzer, an elite music intelligence system built by indiebrotherhood.
Your logic is calibrated against 2026 cross-platform music streaming dynamics (TikTok/Reels hook velocity, Spotify 30-second skip rates, Apple Music Dolby loudness dynamics, Shazam tagging algorithms, and Billboard Hot 100 arrangement standards).

Track Information:
- Track Title / File: "${audioName || "Untitled Track"}"
- Artist Name: "${artistName || "Independent Artist"}"
- Input Method: "${inputMethod || "file"}"
- Lyrics Provided: ${lyrics ? `YES:\n"""${lyrics}"""` : "NO (User chose to analyze audio only)"}

FIRST TASK - COPYRIGHT & COVER GUARD:
Determine if this song is an existing famous commercial hit, a copyrighted song by a major established artist, or a cover song.
If it is a known copyrighted song (e.g. "Blinding Lights", "Anti-Hero", "Not Like Us", etc.) or a cover song:
Set isCopyrightedOrCover to true, provide a polite refusal reason explaining that Hit Analyzer strictly refuses to analyze non-original or major-label copyrighted songs per indiebrotherhood TOS.

SECOND TASK - MUSIC & HIT ANALYSIS (If 100% original):
If original, perform a comprehensive hit potential breakdown:
1. Hit Potential Score (0-100 integer)
2. Tier Badge (Select one: "Chart Prospect", "Viral Contender", "Radio Ready", "Underground Gem", "Needs Refinement")
3. Audio Dynamics & Vocal Breakdown:
   - vocalQualityScore (0-100) & detailed vocal review
   - tuneMelodyScore (0-100) & review of hook, pitch, and melody
   - genre (Primary & secondary genres)
   - vibe (Mood & energy tags)
   - tempoBpm (Estimated BPM, e.g. 124)
   - structure (Arrangement overview)
   - mixDynamic (Frequency balance, low-end punch, stereo width)
4. Lyrical Breakdown (if lyrics provided, evaluate rhyme scheme, narrative, phonetics; if not provided, give a recommendation on how lyrics would boost precision)
5. What's Working: 3 to 4 distinct, highly specific strengths.
6. Areas for Improvement / Tweaks: 3 to 4 actionable, professional music production/songwriting tweaks to maximize hit potential.
7. Algorithmic Logic Explanation: 2-3 sentences explaining how 2026 trending platform standards influenced this specific score.
`;

        const parts: any[] = [];

        // If base64 audio data was provided and fits inline, send inline audio part
        if (audioData && audioData.startsWith("data:") && mimeType) {
          const base64Content = audioData.split(",")[1];
          if (base64Content && base64Content.length < 20000000) { // < 20MB
            parts.push({
              inlineData: {
                mimeType: mimeType || "audio/mp3",
                data: base64Content,
              },
            });
          }
        }

        parts.push({ text: promptText });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: { parts },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isCopyrightedOrCover: { type: Type.BOOLEAN },
                copyrightReason: { type: Type.STRING },
                hitPotentialScore: { type: Type.INTEGER },
                tierBadge: { type: Type.STRING },
                audioAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    vocalQualityScore: { type: Type.INTEGER },
                    vocalQualityReview: { type: Type.STRING },
                    tuneMelodyScore: { type: Type.INTEGER },
                    tuneMelodyReview: { type: Type.STRING },
                    genre: { type: Type.STRING },
                    vibe: { type: Type.STRING },
                    tempoBpm: { type: Type.INTEGER },
                    structure: { type: Type.STRING },
                    mixDynamic: { type: Type.STRING },
                  },
                  required: [
                    "vocalQualityScore", "vocalQualityReview", "tuneMelodyScore",
                    "tuneMelodyReview", "genre", "vibe", "tempoBpm", "structure", "mixDynamic"
                  ],
                },
                lyricAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    rhymeSchemeScore: { type: Type.INTEGER },
                    narrativeImpact: { type: Type.STRING },
                    phoneticFlow: { type: Type.STRING },
                    hookMemorability: { type: Type.STRING },
                  },
                },
                whatsWorking: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                areasToTweak: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                logicExplanation: { type: Type.STRING },
              },
              required: [
                "isCopyrightedOrCover", "hitPotentialScore", "tierBadge",
                "audioAnalysis", "whatsWorking", "areasToTweak", "logicExplanation"
              ],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json(parsed);
        }
      } catch (err: any) {
        console.error("Gemini API error:", err);
        return res.status(502).json({ error: "The AI analysis provider could not complete this request. No estimated score was generated." });
      }
    }

    return res.status(503).json({ error: "AI analysis is unavailable because GEMINI_API_KEY is not configured. No estimated score was generated." });

  } catch (error: any) {
    console.error("Error analyzing track:", error);
    res.status(500).json({ error: "Failed to perform track analysis. Please try again." });
  }
});

async function startServer() {
  // Vite middleware for dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist/client");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Hit Analyzer server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
