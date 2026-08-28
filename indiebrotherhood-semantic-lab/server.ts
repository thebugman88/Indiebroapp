import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3004;

app.use(express.json());

// Initialize Gemini Client
const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    return new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error("Gemini initialization error:", err);
    return null;
  }
};

// Fallback algorithmic synthesis generator for offline / default mode
function generateAlgorithmicSynthesis(
  inputText: string,
  engineMode: 'CLEAN' | 'UNLEASHED',
  unleashedDrive: boolean,
  inputMode: 'LYRIC_REFACTOR' | 'CADENCE_GENERATOR',
  eraPreset: string,
  bpm: number
) {
  const lines = inputText.split('\n').filter(l => l.trim().length > 0);
  const sampleLines = lines.length > 0 ? lines : [
    "Stepping out the shadows with the frequency locked",
    "Digital adrenaline, the system never stopped",
    "Writing in the matrix where the algorithms bleed",
    "Sonic independence is the only law we need"
  ];

  const schemePatterns = ['AABB', 'ABAB', 'COMPLEX_MULTI_SYLLABIC'] as const;
  const chosenScheme = schemePatterns[Math.floor(Math.random() * schemePatterns.length)];

  const driveBoost = unleashedDrive ? 4.5 : 0;
  const modeBoost = engineMode === 'UNLEASHED' ? 3.2 : 0;
  const basePeak = 88.5 + Math.random() * 8.0 + driveBoost + modeBoost;
  const peakProbability = Number(Math.min(99.8, basePeak).toFixed(1));

  const catchiness = Math.min(99, Math.round(84 + Math.random() * 12 + (unleashedDrive ? 3 : 0)));
  const emotionalResonance = Math.min(98, Math.round(82 + Math.random() * 14));
  const replayability = Math.min(99, Math.round(86 + Math.random() * 11));
  const earwormFactor = Math.min(99, Math.round(88 + Math.random() * 10));
  const marketVelocity = Math.min(99, Math.round(85 + Math.random() * 13));

  const schemeTags: Array<'A' | 'B' | 'C' | 'D' | 'X'> = ['A', 'A', 'B', 'B'];

  const bars = sampleLines.slice(0, 4).map((line, idx) => {
    let refactored = line;
    if (inputMode === 'LYRIC_REFACTOR') {
      if (engineMode === 'UNLEASHED') {
        refactored = line
          .replace(/the/gi, 'that raw')
          .replace(/with/gi, 'hyper-locked in')
          .replace(/never/gi, 'zero-lag never');
      } else {
        refactored = line.trim();
      }
    } else {
      refactored = `[${bpm} BPM CADENCE] >> ${line.trim()} // 16th POCKET`;
    }

    const words = refactored.split(/\s+/);
    const lastWord = words[words.length - 1] || 'pulse';
    const syllables = Math.max(8, words.length * 2);

    return {
      barNumber: idx + 1,
      originalText: line,
      refactoredText: refactored,
      schemeTag: schemeTags[idx % schemeTags.length],
      syllableCount: syllables,
      cadenceSpeedBpm: bpm,
      stressPattern: "· — · — — · — ·",
      rhymingTokens: [lastWord, words[Math.max(0, words.length - 2)] || 'flow'],
    };
  });

  const nowHex = Date.now().toString(16).toUpperCase();
  const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
  const eraHash = `0x${nowHex.slice(-6)}_${randomHex}`;
  const iswcCode = `T-${Math.floor(100000000 + Math.random() * 900000000)}-${Math.floor(1 + Math.random() * 9)}`;

  return {
    synthesizedText: bars.map(b => b.refactoredText).join('\n'),
    peakProbability,
    sonicSaturation: unleashedDrive ? 'HIGH' : (engineMode === 'UNLEASHED' ? 'MEDIUM' : 'LOW'),
    eraCompatibility: peakProbability > 95 ? 'BREAKTHROUGH_PIONEER' : 'OPTIMAL',
    metrics: {
      catchiness,
      emotionalResonance,
      replayability,
      earwormFactor,
      marketVelocity,
      hookLineHighlight: bars[0]?.refactoredText || "Sonic independence is the only law we need",
      sonicNotes: [
        `Harmonically tuned to ${eraPreset.replace(/_/g, ' ')} frequency grid.`,
        `${engineMode} processing mode with ${unleashedDrive ? '+6dB Harmonic Drive active' : 'natural vocal dynamics'}.`,
        `Cadence lock stable at ${bpm} BPM with sub-millisecond pocket alignment.`
      ]
    },
    flowMatrix: {
      schemeType: chosenScheme,
      recommendedBpm: bpm,
      bpmFitLabel: `${bpm} BPM (${bpm >= 130 ? 'Double-Time Kinetic' : 'Deep Pocket Groove'})`,
      pocketDriftMs: Number((Math.random() * 2.2 - 1.1).toFixed(2)),
      cadenceDescription: `Multi-syllabic pocket sync with dynamic stress accents on downbeats 2 & 4.`,
      bars
    },
    ipRegistry: {
      isRegistered: true,
      registrationId: `IB-ERA-${Date.now().toString().slice(-6)}`,
      eraHash,
      timestamp: new Date().toISOString(),
      workTitle: `ERA SYNTHESIS: ${sampleLines[0]?.slice(0, 24) || 'UNTITLED REFLECTION'}`,
      artistName: "IndieBrotherhood Artist",
      lyricistShare: 100,
      publisherShare: 100,
      iswcCode,
      ascapStatus: "SECURED" as const,
      mlcStatus: "READY_FOR_BULK_EXPORT" as const
    },
    suggestedChordsOrKey: "F# Minor / D Harmonic Minor (140 BPM)",
    producerTips: [
      "Layer a sub-harmonic 808 sidechained to the 2nd beat syllable for maximum punch.",
      "Add a 1/8d stereo slapback delay on the rhyme anchors in Bar 2 & 4.",
      "EQ dip at 450Hz to carve out sonic headroom for the vocal transients."
    ]
  };
}

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Synthesis Endpoint
app.post("/api/synthesize", async (req, res) => {
  try {
    const {
      inputText = "",
      engineMode = "CLEAN",
      unleashedDrive = false,
      inputMode = "LYRIC_REFACTOR",
      eraPreset = "NEO_CYBER_2026",
      bpm = 140,
    } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      return res.status(503).json({ error: "Semantic analysis is unavailable because GEMINI_API_KEY is not configured." });
    }

    // AI commentary is advisory only. It does not establish ownership, register
    // a work, issue an ISWC, or submit data to a rights organization.
    const prompt = `You are the core intelligence of the "Semantic Lab" (ERA Synthesis Engine) for IndieBrotherhood.
The user provided the following lyrics/cadence input:
"""${inputText || "Digital adrenaline pumping through the city veins / We rewrite the future while breaking all the chains"}"""

Mode: ${engineMode} (CLEAN = tight, radio-ready poetic refinement; UNLEASHED = aggressive, high-voltage multi-syllabic punchlines, underground swagger, heavy cadence drive).
UNLEASHED_DRIVE: ${unleashedDrive ? 'ENABLED (+6dB saturation, maximum cadence aggression)' : 'OFF (standard dynamics)'}.
Input Mode: ${inputMode} (LYRIC_REFACTOR = refactor lines for maximum phonetic bounce; CADENCE_GENERATOR = create rhythmic flow patterns with syllable breakdown).
Target Era: ${eraPreset}.
Target BPM: ${bpm}.

Provide a deep synthesis of the bars with refactored lyrics, estimated syllable counts, rhyme scheme pattern (AABB/ABAB/COMPLEX_MULTI_SYLLABIC), and clearly-labelled creative advisory scores. Do not claim to register works, issue ISWCs, verify ownership, or report platform data.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            synthesizedText: { type: Type.STRING },
            peakProbability: { type: Type.NUMBER, description: "Peak probability 80-99.9" },
            sonicSaturation: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "MAX_OVERDRIVE"] },
            eraCompatibility: { type: Type.STRING, enum: ["OPTIMAL", "SUB-OPTIMAL", "BREAKTHROUGH_PIONEER"] },
            metrics: {
              type: Type.OBJECT,
              properties: {
                catchiness: { type: Type.NUMBER },
                emotionalResonance: { type: Type.NUMBER },
                replayability: { type: Type.NUMBER },
                earwormFactor: { type: Type.NUMBER },
                marketVelocity: { type: Type.NUMBER },
                hookLineHighlight: { type: Type.STRING },
                sonicNotes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["catchiness", "emotionalResonance", "replayability", "earwormFactor", "marketVelocity", "hookLineHighlight", "sonicNotes"]
            },
            flowMatrix: {
              type: Type.OBJECT,
              properties: {
                schemeType: { type: Type.STRING, enum: ["AABB", "ABAB", "AAAA", "ABBA", "COMPLEX_MULTI_SYLLABIC", "FREE_FLOW"] },
                recommendedBpm: { type: Type.NUMBER },
                bpmFitLabel: { type: Type.STRING },
                pocketDriftMs: { type: Type.NUMBER },
                cadenceDescription: { type: Type.STRING },
                bars: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      barNumber: { type: Type.INTEGER },
                      originalText: { type: Type.STRING },
                      refactoredText: { type: Type.STRING },
                      schemeTag: { type: Type.STRING, enum: ["A", "B", "C", "D", "X"] },
                      syllableCount: { type: Type.NUMBER },
                      cadenceSpeedBpm: { type: Type.NUMBER },
                      stressPattern: { type: Type.STRING },
                      rhymingTokens: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      }
                    },
                    required: ["barNumber", "originalText", "refactoredText", "schemeTag", "syllableCount", "cadenceSpeedBpm", "stressPattern", "rhymingTokens"]
                  }
                }
              },
              required: ["schemeType", "recommendedBpm", "bpmFitLabel", "pocketDriftMs", "cadenceDescription", "bars"]
            },
            suggestedChordsOrKey: { type: Type.STRING },
            producerTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["synthesizedText", "peakProbability", "sonicSaturation", "eraCompatibility", "metrics", "flowMatrix", "suggestedChordsOrKey", "producerTips"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");

    return res.json({
      success: true,
      source: "gemini-2.5-flash",
      data: parsed
    });

  } catch (error) {
    console.error("Synthesis error:", error);
    return res.status(502).json({ error: "The AI analysis provider could not complete this request. No synthetic result was generated." });
  }
});

// Vite middleware & Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Semantic Lab ERA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
