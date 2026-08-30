import express from "express";
import { Type } from "@google/genai";
import { getGeminiClient } from "./aiResilience";
export const semanticRouter = express.Router();
const app = semanticRouter;
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

    if (
      typeof inputText !== "string" ||
      !inputText.trim() ||
      inputText.length > 20000 ||
      !Number.isFinite(Number(bpm)) ||
      Number(bpm) < 30 ||
      Number(bpm) > 300
    )
      return res
        .status(400)
        .json({
          error:
            "Provide lyrics up to 20,000 characters and a tempo from 30 to 300 BPM.",
        });
    const ai = getGeminiClient();

    if (!ai) {
      return res
        .status(503)
        .json({
          error:
            "Semantic analysis is unavailable because GEMINI_API_KEY is not configured.",
        });
    }

    // AI commentary is advisory only. It does not establish ownership, register
    // a work, issue an ISWC, or submit data to a rights organization.
    const prompt = `You are the core intelligence of the "Semantic Lab" (ERA Synthesis Engine) for IndieBrotherhood.
The user provided the following lyrics/cadence input:
"""${inputText || "Digital adrenaline pumping through the city veins / We rewrite the future while breaking all the chains"}"""

Mode: ${engineMode} (CLEAN = tight, radio-ready poetic refinement; UNLEASHED = aggressive, high-voltage multi-syllabic punchlines, underground swagger, heavy cadence drive).
UNLEASHED_DRIVE: ${unleashedDrive ? "ENABLED (+6dB saturation, maximum cadence aggression)" : "OFF (standard dynamics)"}.
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
            peakProbability: {
              type: Type.NUMBER,
              description:
                "Subjective creative score from 0 to 100; not a probability of success",
            },
            sonicSaturation: {
              type: Type.STRING,
              enum: ["LOW", "MEDIUM", "HIGH", "MAX_OVERDRIVE"],
            },
            eraCompatibility: {
              type: Type.STRING,
              enum: ["OPTIMAL", "SUB-OPTIMAL", "BREAKTHROUGH_PIONEER"],
            },
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
                  items: { type: Type.STRING },
                },
              },
              required: [
                "catchiness",
                "emotionalResonance",
                "replayability",
                "earwormFactor",
                "marketVelocity",
                "hookLineHighlight",
                "sonicNotes",
              ],
            },
            flowMatrix: {
              type: Type.OBJECT,
              properties: {
                schemeType: {
                  type: Type.STRING,
                  enum: [
                    "AABB",
                    "ABAB",
                    "AAAA",
                    "ABBA",
                    "COMPLEX_MULTI_SYLLABIC",
                    "FREE_FLOW",
                  ],
                },
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
                      schemeTag: {
                        type: Type.STRING,
                        enum: ["A", "B", "C", "D", "X"],
                      },
                      syllableCount: { type: Type.NUMBER },
                      cadenceSpeedBpm: { type: Type.NUMBER },
                      stressPattern: { type: Type.STRING },
                      rhymingTokens: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: [
                      "barNumber",
                      "originalText",
                      "refactoredText",
                      "schemeTag",
                      "syllableCount",
                      "cadenceSpeedBpm",
                      "stressPattern",
                      "rhymingTokens",
                    ],
                  },
                },
              },
              required: [
                "schemeType",
                "recommendedBpm",
                "bpmFitLabel",
                "pocketDriftMs",
                "cadenceDescription",
                "bars",
              ],
            },
            suggestedChordsOrKey: { type: Type.STRING },
            producerTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "synthesizedText",
            "peakProbability",
            "sonicSaturation",
            "eraCompatibility",
            "metrics",
            "flowMatrix",
            "suggestedChordsOrKey",
            "producerTips",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "");

    if (
      typeof parsed.synthesizedText !== "string" ||
      !parsed.flowMatrix ||
      !parsed.metrics ||
      !Array.isArray(parsed.flowMatrix.bars) ||
      typeof parsed.peakProbability !== "number" ||
      parsed.peakProbability < 0 ||
      parsed.peakProbability > 100
    )
      throw new Error("Incomplete response");
    return res.json({
      success: true,
      source: "gemini-2.5-flash",
      data: parsed,
    });
  } catch (error) {
    console.error("Synthesis error:", error);
    return res
      .status(502)
      .json({
        error:
          "The AI analysis provider could not complete this request. No synthetic result was generated.",
      });
  }
});
