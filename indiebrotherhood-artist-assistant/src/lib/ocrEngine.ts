import { authenticatedFetch } from '../../../src/services/authService';
import { createWorker } from "tesseract.js";
import { SongMetadata } from "../types";

export interface OCRResult {
  rawText: string;
  confidence: number;
  parsedMetadata?: Partial<SongMetadata>;
  platformDetected?: string;
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Client-side Tesseract.js fallback / pre-scanner
export async function performClientTesseractOCR(
  imageSource: File | string,
  onProgress?: (progress: number, statusText: string) => void
): Promise<{ text: string; confidence: number }> {
  try {
    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          onProgress(Math.round((m.progress || 0) * 100), m.status);
        }
      },
    });

    const ret = await worker.recognize(imageSource);
    const text = ret.data.text;
    const confidence = ret.data.confidence || 80;
    await worker.terminate();

    return { text, confidence };
  } catch (err) {
    console.error("Tesseract.js OCR Error:", err);
    throw err;
  }
}

// Server-side Multimodal Gemini AI OCR + Parser
export async function performDeepServerOCR(
  imageBase64: string,
  mimeType: string,
  rawText?: string,
  customApiKey?: string
): Promise<{
  success: boolean;
  data: Partial<SongMetadata> & {
    confidenceScore?: number;
    platformSource?: string;
    detectedTextSummary?: string;
  };
  error?: string;
}> {
  try {
    const response = await authenticatedFetch("/api/ai/ocr-parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        rawText,
        customApiKey,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server OCR request failed with status ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (err: any) {
    console.error("Deep Server OCR Error:", err);
    return {
      success: false,
      data: {},
      error: err.message || "Failed to parse document via Server OCR.",
    };
  }
}

// Full Hybrid Pipeline: Runs Deep Server OCR (with Gemini) and fallback to Tesseract
export async function analyzeDocumentOrScreenshot(
  file: File,
  customApiKey?: string,
  onProgress?: (step: string, percent: number) => void
): Promise<OCRResult> {
  onProgress?.("Reading document...", 10);
  const base64 = await fileToBase64(file);

  onProgress?.("Extracting text and identifying metadata...", 35);

  let rawTesseractText = "";
  let tesseractConfidence = 80;

  // Run Tesseract extraction
  try {
    const tessResult = await performClientTesseractOCR(file, (pct, status) => {
      onProgress?.(`OCR Processing (${status}): ${pct}%`, 35 + Math.round(pct * 0.25));
    });
    rawTesseractText = tessResult.text;
    tesseractConfidence = tessResult.confidence;
  } catch (tessErr) {
    console.warn("Client Tesseract pass failed or skipped, relying on Server Multimodal:", tessErr);
  }

  onProgress?.("Running AI multimodal parsing & ISRC extraction...", 65);

  // Run Server Multimodal Parse
  const serverResult = await performDeepServerOCR(
    base64,
    file.type || "image/png",
    rawTesseractText,
    customApiKey
  );

  onProgress?.("Finalizing structured metadata...", 95);

  if (serverResult.success && serverResult.data) {
    const d = serverResult.data;
    return {
      rawText: rawTesseractText || d.detectedTextSummary || "",
      confidence: d.confidenceScore || tesseractConfidence,
      platformDetected: d.platformSource || "General Music Document",
      parsedMetadata: {
        title: d.title || (d as any).songTitle || file.name.replace(/\.[^/.]+$/, ""),
        alternativeTitles: d.alternativeTitles || [],
        primaryArtist: d.primaryArtist || "",
        featuredArtists: d.featuredArtists || [],
        isrc: d.isrc || "",
        iswc: d.iswc || "",
        upc: d.upc || "",
        releaseDate: d.releaseDate || "",
        duration: d.duration || "",
        genre: d.genre || "",
        labelOrDistributor: d.labelOrDistributor || "",
        writers: d.writers || [],
        totalEarnings: (d as any).totalEarnings || 0,
        notes: `Extracted via OCR from ${file.name}. ${d.notes || ""}`,
        tags: ["OCR_Extracted", d.platformSource || "Statement"].filter(Boolean),
      },
    };
  }

  // Fallback if server parse had issue
  return {
    rawText: rawTesseractText,
    confidence: tesseractConfidence,
    parsedMetadata: {
      title: file.name.replace(/\.[^/.]+$/, ""),
      notes: `Raw OCR Text Extracted:\n${rawTesseractText.slice(0, 500)}`,
      tags: ["Raw_OCR"],
    },
  };
}
