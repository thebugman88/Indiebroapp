import express from "express";
import { Type } from "@google/genai";
import { getGeminiClient } from "./aiResilience";
export const extraAiRouter = express.Router();
const app = extraAiRouter;
app.use((req, res, next) => {
  if (JSON.stringify(req.body || {}).length > 8000000) {
    res.status(413).json({ error: "AI request is too large." });
    return;
  }
  next();
});
app.post("/api/ai/ocr-parse", async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = "image/png",
      rawText,
      customApiKey,
      documentType = "general",
    } = req.body;

    if (
      imageBase64 &&
      !["image/png", "image/jpeg", "image/webp"].includes(mimeType)
    ) {
      res
        .status(400)
        .json({
          error:
            "Enhanced OCR accepts one PNG, JPEG or WebP page per request (5 BC). Convert multi-page documents to individual images first.",
        });
      return;
    }

    if (!imageBase64 && !rawText) {
      return res
        .status(400)
        .json({ error: "Either imageBase64 or rawText is required." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          "Gemini API key is required for deep document & screenshot parsing.",
      });
    }

    const prompt = `Analyze this music document/screenshot (which may be a Spotify for Artists dashboard, Apple Music dashboard, royalty distribution statement, split sheet, cue sheet, or metadata export).

Extract all available music metadata accurately. If any field is not visible or indeterminate, leave it as an empty string or null.

Return ONLY a strictly valid JSON object with the following schema:
{
  "songTitle": string,
  "alternativeTitles": string[],
  "primaryArtist": string,
  "featuredArtists": string[],
  "isrc": string,
  "iswc": string,
  "upc": string,
  "releaseDate": string,
  "duration": string,
  "genre": string,
  "labelOrDistributor": string,
  "streamCount": number or null,
  "totalEarnings": number or null,
  "currency": string,
  "platformSource": string (e.g. "Spotify", "Apple Music", "DistroKid", "The MLC", "ASCAP", "BMI", "SoundExchange", "Split Sheet", "Other"),
  "writers": [
    {
      "name": string,
      "role": "Composer" | "Lyricist" | "Producer" | "Author",
      "pro": string,
      "ipi": string,
      "writerSplitPercent": number,
      "publisherName": string,
      "publisherSplitPercent": number
    }
  ],
  "notes": string,
  "detectedTextSummary": string,
  "confidenceScore": number (0 to 100)
}

Be diligent with ISRC code syntax (e.g., standard 12 alphanumeric characters like CC-XXX-YY-NNNNN or CCXXXYYNNNNN).
If split sheets are shown, ensure writer splits total up to 100% where stated.`;

    let parts: any[] = [];

    if (imageBase64) {
      // Strip data prefix if included
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: mimeType || "image/png",
          data: cleanBase64,
        },
      });
    }

    if (rawText) {
      parts.push({
        text: `Extracted OCR Raw Text:\n${rawText}\n\nTask: ${prompt}`,
      });
    } else {
      parts.push({
        text: prompt,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsedData = JSON.parse(response.text || "");
    return res.json({
      success: true,
      data: parsedData,
      rawModelResponse: response.text,
    });
  } catch (err: any) {
    console.error("OCR Parse Error:", err);
    return res.status(500).json({
      error: "Failed to process image/document OCR.",
    });
  }
});
app.post("/api/ai/strategy-plan", async (req, res) => {
  try {
    const {
      releaseType = "Single",
      songTitle,
      releaseDate,
      genre,
      budget = "Indie / $0-$500",
      targetAudience,
      artistProfile,
      customApiKey,
    } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is required for strategy generation.",
      });
    }

    const prompt = `Create an exhaustive, high-impact, step-by-step Release Rollout & Career Strategy Plan for an independent musician.

RELEASE DETAILS:
- Release Type: ${releaseType}
- Title: ${songTitle || "Upcoming Release"}
- Target Release Date: ${releaseDate || "In 6-8 weeks"}
- Genre: ${genre || artistProfile?.genre || "Indie"}
- Budget Level: ${budget}
- Target Audience / Vibe: ${targetAudience || "Modern streaming & social listeners"}
- Artist: ${artistProfile?.artistName || "Independent Artist"}

Return a structured JSON with:
{
  "overview": string,
  "keyTheme": string,
  "timelineWeeks": [
    {
      "weekNumber": number,
      "timeframe": string,
      "focus": string,
      "checklist": [
        {
          "task": string,
          "category": "pitch" | "marketing" | "registration" | "assets" | "social" | "sync",
          "priority": "high" | "medium" | "low",
          "recommendedDaysBefore": number,
          "details": string
        }
      ]
    }
  ],
  "editorialPitchCopy": {
    "genreTags": string[],
    "moodTags": string[],
    "instrumentationTags": string[],
    "shortStoryPitch500Chars": string,
    "marketingDriversPitch": string
  },
  "socialMediaHooks": [
    {
      "hook": string,
      "videoConcept": string,
      "audioClipTiming": string,
      "captionExample": string
    }
  ],
  "syncLicensingAngles": string[],
  "postReleaseMomentumPlan": string[]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, plan: parsed });
  } catch (err: any) {
    console.error("Strategy Generator Error:", err);
    return res.status(500).json({
      error: "Failed to generate release strategy plan.",
    });
  }
});
app.post("/api/ai/logical-correction", async (req, res) => {
  try {
    const {
      originalItem,
      userCorrection,
      type = "metadata",
      customApiKey,
    } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is required to process logic correction.",
      });
    }

    const prompt = `The user is applying a logical correction to their music ${type} data.
Original Data:
${JSON.stringify(originalItem, null, 2)}

User's Correction / Instructions:
"${userCorrection}"

Please analyze the user's correction, resolve all conflicts mathematically (for example, if writer splits were modified, ensure percentages sum to 100% or adjust proportionally), fix formatting (ISRC uppercase hyphen format, proper names, dates), and produce:
1. The updated and corrected object matching the original structure.
2. A clear audit explanation of what was modified and why.

Return ONLY a JSON with:
{
  "correctedData": object,
  "auditExplanation": string,
  "validated": boolean
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    return res.json({ success: true, result });
  } catch (err: any) {
    console.error("Logical Correction Error:", err);
    return res.status(500).json({
      error: "Failed to apply logical correction.",
    });
  }
});
app.post("/api/ai/web-search", async (req, res) => {
  try {
    const { query, customApiKey } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is required for search grounding.",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Perform comprehensive music industry web research on the following topic and provide current, actionable findings, links, and strategies for an indie musician: "${query}"`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const responseText = response.text || "";
    const chunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.map((c: any) => c?.web).filter(Boolean);

    return res.json({
      summary: responseText,
      sources,
    });
  } catch (err: any) {
    console.error("Search Error:", err);
    return res.status(500).json({
      error: "Failed to execute web search.",
    });
  }
});
app.post("/api/gemini/marketing-advisor", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai)
      return res.status(503).json({ error: "AI service is not configured." });
    const { trackTitle, genre, vibe, goals } = req.body;

    const prompt = `You are the Lead Music Marketer for "Hang Out by indiebrotherhood".
An indie artist is releasing:
Track Title: "${trackTitle}"
Genre: "${genre}"
Vibe/Description: "${vibe}"
Target Goal: "${goals || "Get Spotify playlisting, TikTok viral traction, and indie blog coverage"}"

Provide a detailed, actionable marketing strategy in JSON format:
1. playlistPitching: 3 specific pitch angles to submit to Spotify for Artists editors & curating channels.
2. tikTokHooks: 4 creative short-form video concept ideas (TikTok/Reels/Shorts) tied to the song's energy.
3. rolloutTimeline: 4-week rollout schedule (Week -2, Week -1, Release Day, Week +1).
4. epkTips: 2-3 key sentences for their Electronic Press Kit bio.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playlistPitching: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            tikTokHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
            rolloutTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  week: { type: Type.STRING },
                  tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["week", "tasks"],
              },
            },
            epkTips: { type: Type.STRING },
          },
          required: [
            "playlistPitching",
            "tikTokHooks",
            "rolloutTimeline",
            "epkTips",
          ],
        },
      },
    });

    const strategy = JSON.parse(response.text || "{}");
    return res.json({ success: true, strategy });
  } catch (error: any) {
    console.error("Marketing advisor error:", error);
    return res.status(500).json({ error: "Failed to generate marketing plan" });
  }
});
