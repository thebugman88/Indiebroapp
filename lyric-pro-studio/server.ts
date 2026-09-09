import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { LyricGenerateRequest, LyricGenerateResponse } from "./src/types";
import { generateAlgorithmicLyrics } from "./src/data/lyricTemplates";

dotenv.config();

const PORT = 3006;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Server-side Gemini initialization if API Key present
  let aiClient: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      aiAvailable: !!process.env.GEMINI_API_KEY
    });
  });

  // Lyric Generation Endpoint
  app.post("/api/generate-lyrics", async (req, res) => {
    const payload: LyricGenerateRequest = req.body;
    const genre = payload.customGenre && payload.customGenre.trim() ? payload.customGenre.trim().slice(0, 10) : payload.genre;
    const vibe = payload.customVibe && payload.customVibe.trim() ? payload.customVibe.trim().slice(0, 10) : payload.vibe;
    const explicit = payload.explicit;
    const mode = payload.mode;
    const starterType = payload.starterType || 'verse';
    const structure = payload.structure || 'Standard';
    const userLyricsText = payload.userLyrics && payload.userLyrics.trim() ? payload.userLyrics.trim() : '';
    const userOption = payload.userLyricsOption || 'finish_lyrics';

    // If Gemini API Key is available, use Gemini 3.6 Flash for elite lyrical AI generation
    if (aiClient && process.env.GEMINI_API_KEY) {
      try {
        let modeDescription = '';
        if (mode === 'user_lyrics') {
          if (userOption === 'finish_lyrics') {
            modeDescription = `USER DRAFT LYRICS PROVIDED:\n"${userLyricsText}"\nTASK: Seamlessly CONTINUE and FINISH their lyrics by building complete song/verse sections around their provided foundation. Keep their draft lines visible at the top and write high-impact continuation sections matching their flow.`;
          } else if (userOption === 'ideas_from_lyrics') {
            modeDescription = `USER DRAFT LYRICS PROVIDED:\n"${userLyricsText}"\nTASK: Provide 6-8 creative next-line punchlines, internal rhyming schemes, double-entendres, and thematic directions directly inspired by their provided draft.`;
          } else {
            // enhance_pattern
            modeDescription = `USER DRAFT LYRICS PROVIDED:\n"${userLyricsText}"\nTASK: REWRITE and ELEVATE their draft lines into a master-class lyrical pattern with multi-syllabic rhymes, internal cadence, double-entendres, and dynamic rhythm without losing their core artistic meaning.`;
          }
        } else if (mode === 'ideas_6') {
          modeDescription = 'Provide 6 elite, high-impact standalone lyric punchlines and bar ideas per set.';
        } else if (mode === 'starter') {
          modeDescription = `Provide a master-class opening ${starterType} starter (12-16 bars) with dynamic cadence and flow per set.`;
        } else {
          modeDescription = `Write a complete, Grammy-level top-tier full song (Intro, Verses, Chorus, Pre-Chorus, Bridge, Outro) per set following the structure: "${structure}".`;
        }

        const explicitInstruction = explicit
          ? "EXPLICIT MODE IS ACTIVATED FOR ARTISTIC EXPRESSION. You have complete creative freedom to use raw curse words, swearing, aggressive profanity, and unfiltered artist bars where appropriate for the vibe. Do not censor or hold back."
          : "CLEAN MODE IS ACTIVATED. Strictly avoid profanity, explicit curse words, or vulgarity.";

        const randomSeed = Math.floor(Math.random() * 1000000);

        const prompt = `You are a legendary Grammy-winning songwriter, master lyricist, and top-tier ghostwriter ("Lyric Pro Elite Engine").
Generate TWO DISTINCT, COMPLETELY UNIQUE, HIGH-IMPACT sets of lyrics (Set A and Set B) for the following track configuration:
- Genre: ${genre}
- Vibe / Mood: ${vibe}
- Explicit Content: ${explicit ? 'YES (Raw profanity & explicit language allowed for artistic authenticity)' : 'NO (Clean)'}
- Mode: ${mode}
- Song Structure: ${structure}
- Creative Inspiration Seed: ${randomSeed} (Ensure 100% original, non-repeating rhymes, metaphors, and storytelling angles)

Elite Craftsmanship Standards:
1. ${modeDescription}
2. ${explicitInstruction}
3. WRITE AT AN ELITE ARTISTIC LEVEL: Use multi-syllabic rhymes, internal rhyming schemes, clever wordplay, double entendres, vivid atmospheric imagery, and authentic genre rhythm!
4. Set A and Set B MUST be completely different in rhythm, cadence, flow structure, and lyrical theme! Set A could be hard-hitting and punchy, while Set B could be melodic, intricate, or atmospheric.
5. NEVER repeat generic phrases or cliché filler lines. Make every line feel like a classic recording.
6. Format the lyric contents clearly with section tags like [INTRO], [VERSE 1], [PRE-CHORUS], [CHORUS], [VERSE 2], [BRIDGE], [OUTRO], or numbered lists for ideas.
7. Provide an iconic catchy song title and a brief 1-sentence lyricist summary note for each set highlighting its rhythm and cadence style.`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                setA: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    genre: { type: Type.STRING },
                    vibe: { type: Type.STRING },
                    structure: { type: Type.STRING },
                    explicit: { type: Type.BOOLEAN },
                    content: { type: Type.STRING },
                    summaryNote: { type: Type.STRING }
                  },
                  required: ["title", "genre", "vibe", "structure", "explicit", "content"]
                },
                setB: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    genre: { type: Type.STRING },
                    vibe: { type: Type.STRING },
                    structure: { type: Type.STRING },
                    explicit: { type: Type.BOOLEAN },
                    content: { type: Type.STRING },
                    summaryNote: { type: Type.STRING }
                  },
                  required: ["title", "genre", "vibe", "structure", "explicit", "content"]
                }
              },
              required: ["setA", "setB"]
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          const result: LyricGenerateResponse = {
            setA: {
              title: parsed.setA.title || `${vibe} ${genre} Set A`,
              genre,
              vibe,
              structure,
              explicit,
              content: parsed.setA.content,
              summaryNote: parsed.setA.summaryNote
            },
            setB: {
              title: parsed.setB.title || `${vibe} ${genre} Set B`,
              genre,
              vibe,
              structure,
              explicit,
              content: parsed.setB.content,
              summaryNote: parsed.setB.summaryNote
            },
            isAiGenerated: true,
            timestamp: Date.now()
          };
          return res.json(result);
        }
      } catch (err) {
        console.error("Gemini API call failed, falling back to algorithmic lyric generator:", err);
      }
    }

    // Fallback to high-quality algorithmic lyric engine
    const algoResult = generateAlgorithmicLyrics(payload);
    return res.json(algoResult);
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist/client');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lyric Pro Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
