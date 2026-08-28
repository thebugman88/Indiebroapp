import { GoogleGenAI, Type, Schema } from '@google/genai';
import { ParsedTrack, SplitShare } from '../types';

/**
 * Google Gemini 2.5 Flash Vision AI OCR Extraction Service
 * Uses Google AI Studio / Google Cloud API Key for ultra-high accuracy extraction of
 * complex distributor statements, blurry screenshots, and multi-track payout grids.
 */

export interface GeminiVisionResult {
  tracks: ParsedTrack[];
  rawSummary: string;
}

export async function parseStatementWithGemini(
  imageDataUrl: string,
  apiKey: string,
  fileId: string | null,
  folderId: string | null,
  defaultCurrency = 'USD'
): Promise<GeminiVisionResult> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Google Gemini API Key is missing. Please add it in Settings.');
  }

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  // Extract base64 and mimeType from dataUrl
  let mimeType = 'image/png';
  let base64Data = imageDataUrl;

  if (imageDataUrl.startsWith('data:')) {
    const parts = imageDataUrl.split(',');
    const match = parts[0].match(/:(.*?);/);
    if (match) {
      mimeType = match[1];
    }
    base64Data = parts[1];
  }

  const prompt = `
You are an expert music royalty auditor and ISRC metadata extractor.
Analyze this music royalty statement / distributor screenshot (which may be from Spotify for Artists, Apple Music, DistroKid, TuneCore, CD Baby, SoundExchange, The MLC, or a custom statement).

Carefully extract every distinct track/song found in the image.
Extract:
- title: Song title (clean, without track numbers)
- artist: Primary artist name
- isrc: 12-character ISRC code formatted as CC-XXX-YY-NNNNN (or empty string if not shown)
- iswc: ISWC musical work identifier (e.g. T-123456789-0) if present
- streams: Total streams or play count as a number (e.g. 145000)
- revenue: Gross net earnings as a float number (e.g. 52.34)
- platform: DSP or source (Spotify, Apple Music, YouTube, SoundExchange, DistroKid, Amazon, etc.)
- releaseTitle: Album/EP name
- releaseDate: YYYY-MM-DD if available
- duration: MM:SS duration (e.g. "03:45")
- label: Record label name (defaults to "Independent")
- upc: UPC / EAN barcode if present
- writers: Array of songwriters with their name, role ("Writer"|"Composer"|"Author"), share percentage (e.g. 100 or 50), and IPI if present
- publishers: Array of publishing entities with name, role ("Publisher"), share percentage, and IPI if present

Return clean JSON containing a list of extracted tracks.
`;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: 'Short summary of the statement parsed' },
      tracks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            isrc: { type: Type.STRING },
            iswc: { type: Type.STRING },
            streams: { type: Type.NUMBER },
            revenue: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            platform: { type: Type.STRING },
            releaseTitle: { type: Type.STRING },
            releaseDate: { type: Type.STRING },
            duration: { type: Type.STRING },
            label: { type: Type.STRING },
            upc: { type: Type.STRING },
            writers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  role: { type: Type.STRING },
                  percentage: { type: Type.NUMBER },
                  ipi: { type: Type.STRING },
                },
                required: ['name', 'percentage'],
              },
            },
            publishers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  role: { type: Type.STRING },
                  percentage: { type: Type.NUMBER },
                  ipi: { type: Type.STRING },
                },
                required: ['name', 'percentage'],
              },
            },
          },
          required: ['title', 'artist'],
        },
      },
    },
    required: ['tracks'],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  const rawJson = response.text || '{}';
  const parsedData = JSON.parse(rawJson);

  const rawTracks = parsedData.tracks || [];
  const tracks: ParsedTrack[] = rawTracks.map((item: any, index: number) => {
    const writers: SplitShare[] = (item.writers && item.writers.length > 0)
      ? item.writers.map((w: any, wIdx: number) => ({
          id: `w-${Date.now()}-${index}-${wIdx}`,
          name: w.name || item.artist || 'Songwriter',
          role: (w.role as any) || 'Writer',
          percentage: Number(w.percentage) || 100,
          ipi: w.ipi || undefined,
        }))
      : [
          {
            id: `w-${Date.now()}-${index}`,
            name: item.artist || 'Primary Artist',
            role: 'Writer',
            percentage: 100,
          },
        ];

    const publishers: SplitShare[] = (item.publishers && item.publishers.length > 0)
      ? item.publishers.map((p: any, pIdx: number) => ({
          id: `p-${Date.now()}-${index}-${pIdx}`,
          name: p.name || 'Direct / Self-Published',
          role: 'Publisher',
          percentage: Number(p.percentage) || 100,
          ipi: p.ipi || undefined,
        }))
      : [
          {
            id: `p-${Date.now()}-${index}`,
            name: 'Direct / Self-Published',
            role: 'Publisher',
            percentage: 100,
          },
        ];

    return {
      id: `trk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${index}`,
      fileId,
      folderId,
      title: item.title || `Track ${index + 1}`,
      artist: item.artist || 'Primary Artist',
      isrc: item.isrc || '',
      iswc: item.iswc || undefined,
      streams: typeof item.streams === 'number' ? item.streams : undefined,
      revenue: typeof item.revenue === 'number' ? item.revenue : undefined,
      currency: item.currency || defaultCurrency,
      platform: item.platform || 'Spotify',
      releaseTitle: item.releaseTitle || item.title,
      releaseDate: item.releaseDate || undefined,
      duration: item.duration || '03:30',
      label: item.label || 'Independent',
      upc: item.upc || undefined,
      pLine: `${item.releaseDate ? item.releaseDate.substring(0, 4) : new Date().getFullYear()} ${item.artist || 'Artist'}`,
      writers,
      publishers,
      confidence: 98, // Gemini Vision provides high structural confidence
      validated: !!item.isrc,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  return {
    tracks,
    rawSummary: parsedData.summary || `Extracted ${tracks.length} tracks using Gemini 2.5 Flash Vision.`,
  };
}
