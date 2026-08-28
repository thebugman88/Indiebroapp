import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3003;

  // Middlewares
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Helper to initialize Gemini client safely
  const getGeminiClient = (customKey?: string) => {
    const apiKey = customKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
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

  // --- API Endpoints ---

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      hasServerKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Assistant Chat with Search Grounding & Artist Context
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const {
        message,
        history = [],
        artistProfile,
        useWebSearch = false,
        customApiKey,
        model = "gemini-3.7-flash",
      } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      const ai = getGeminiClient(customApiKey);
      if (!ai) {
        return res.status(400).json({
          error:
            "Gemini API key is not configured. Please supply a key in Settings or ensure GEMINI_API_KEY is active.",
        });
      }

      const systemInstruction = `You are the elite IndieArtist Career OS & Assistant, created by IndieBrotherhood in 2026.
You are a master music career strategist, music industry legal & royalty expert, release coordinator, and digital marketing specialist dedicated entirely to independent musicians, songwriters, and producers.

CURRENT ARTIST PROFILE:
- Artist Name: ${artistProfile?.artistName || "Independent Artist"}
- Primary Genre: ${artistProfile?.genre || "Indie / Multi-Genre"}
- Career Stage: ${artistProfile?.stage || "Emerging / Active"}
- PRO Affiliation: ${artistProfile?.pro || "ASCAP / BMI / Not specified"}
- IPI/CAE: ${artistProfile?.ipi || "Not provided"}
- Distributor: ${artistProfile?.distributor || "DistroKid / TuneCore / CD Baby / Independent"}
- Publisher: ${artistProfile?.publisher || "Self-Published"}

CORE PRINCIPLES & GUIDELINES:
1. Provide top-tier, razor-sharp, actionable, and mathematically accurate music industry guidance.
2. When discussing royalties, clearly differentiate between:
   - Performance Royalties (ASCAP, BMI, SESAC, PRS, SOCAN) -> Composition/Publishing
   - Mechanical Royalties (The MLC in the US, MCPS in UK, CMRRA in Canada) -> Composition/Publishing
   - Non-interactive Digital Performance Royalties (SoundExchange) -> Sound Recording / Master (Featured Artist 45%, Label/Rights Holder 50%, Non-Featured Musicians/AFM 5%)
   - Master Royalties from Streaming / Distribution (Spotify, Apple Music via Distributor).
3. If the user provides a logical correction (e.g. "Actually, my co-writer has 40% and I have 60%" or "My ISRC is US-XXX..."), immediately accept, validate, acknowledge the update, and adjust all calculations accordingly.
4. Format all responses clearly with bold section headings, bullet points, checklists, and precise timelines when requested.
5. Offer high-impact marketing strategies tailored to current (2026) algorithms: short-form video hooks, Spotify for Artists editorial pitching frameworks, sync licensing pitching standards, press email pitches, pre-save momentum, and direct-to-fan monetization.
6. When web search is enabled, leverage current indie music trends, playlist curator blogs, and industry updates.`;

      // Build contents array
      const contents: any[] = [];

      // Add recent history if provided
      if (Array.isArray(history) && history.length > 0) {
        // Take last 10 messages for context
        const recent = history.slice(-10);
        for (const h of recent) {
          if (h.sender === "user") {
            contents.push({ role: "user", parts: [{ text: h.text }] });
          } else if (h.sender === "assistant") {
            contents.push({ role: "model", parts: [{ text: h.text }] });
          }
        }
      }

      // Add current message
      contents.push({ role: "user", parts: [{ text: message }] });

      const config: any = {
        systemInstruction,
      };

      if (useWebSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const chosenModel = model || "gemini-3.7-flash";
      const response = await ai.models.generateContent({
        model: chosenModel,
        contents,
        config,
      });

      const responseText = response.text || "No response generated.";
      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((chunk: any) => chunk?.web)
        .filter(Boolean);

      return res.json({
        reply: responseText,
        sources,
        model: chosenModel,
      });
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      return res.status(500).json({
        error: err.message || "Failed to process AI chat request.",
      });
    }
  });

  // OCR & Document / Screenshot Parsing Engine via Multimodal Gemini
  app.post("/api/ai/ocr-parse", async (req, res) => {
    try {
      const {
        imageBase64,
        mimeType = "image/png",
        rawText,
        customApiKey,
        documentType = "general",
      } = req.body;

      if (!imageBase64 && !rawText) {
        return res
          .status(400)
          .json({ error: "Either imageBase64 or rawText is required." });
      }

      const ai = getGeminiClient(customApiKey);
      if (!ai) {
        return res.status(400).json({
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

      let parsedData: any = {};
      try {
        const text = (response.text || "").trim();
        parsedData = JSON.parse(text);
      } catch (jsonErr) {
        console.error("JSON parse error from OCR response:", response.text);
        parsedData = {
          songTitle: "Extracted Track",
          notes: response.text || "Raw output generated",
          confidenceScore: 70,
        };
      }

      return res.json({
        success: true,
        data: parsedData,
        rawModelResponse: response.text,
      });
    } catch (err: any) {
      console.error("OCR Parse Error:", err);
      return res.status(500).json({
        error: err.message || "Failed to process image/document OCR.",
      });
    }
  });

  // Strategy & Rollout Plan Generator
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

      const ai = getGeminiClient(customApiKey);
      if (!ai) {
        return res.status(400).json({
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
        error: err.message || "Failed to generate release strategy plan.",
      });
    }
  });

  // Logical Feedback & Correction Endpoint
  app.post("/api/ai/logical-correction", async (req, res) => {
    try {
      const { originalItem, userCorrection, type = "metadata", customApiKey } =
        req.body;

      const ai = getGeminiClient(customApiKey);
      if (!ai) {
        return res.status(400).json({
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
        error: err.message || "Failed to apply logical correction.",
      });
    }
  });

  // Web search research endpoint
  app.post("/api/ai/web-search", async (req, res) => {
    try {
      const { query, customApiKey } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const ai = getGeminiClient(customApiKey);
      if (!ai) {
        return res.status(400).json({
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
        error: err.message || "Failed to execute web search.",
      });
    }
  });

  // --- Vite & Static Asset Handling ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IndieArtist OS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
