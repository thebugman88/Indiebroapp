import { createWorker, Worker } from 'tesseract.js';
import { OCRBoundingBox, ParsedTrack, AppSettings } from '../types';
import { preprocessImage } from './imagePreprocessor';
import { parseOcrTextToTracks } from './parser';
import { parseStatementWithGemini } from './geminiVision';
import { resolveIsrcMetadata } from './musicBrainz';

let cachedWorker: Worker | null = null;
let currentLanguage = 'eng';

export async function getOcrWorker(
  lang = 'eng',
  onProgress?: (progress: number, status: string) => void
): Promise<Worker> {
  if (cachedWorker && currentLanguage === lang) {
    return cachedWorker;
  }

  if (cachedWorker) {
    try {
      await cachedWorker.terminate();
    } catch (e) {
      console.warn('Worker termination warning:', e);
    }
    cachedWorker = null;
  }

  const worker = await createWorker(lang, 1, {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100), m.status);
      }
    },
  });

  cachedWorker = worker;
  currentLanguage = lang;
  return worker;
}

export interface OCRProcessResult {
  rawText: string;
  confidence: number;
  boundingBoxes: OCRBoundingBox[];
  parsedTracks: ParsedTrack[];
  engineUsed: 'tesseract' | 'gemini';
}

export async function processImageWithOCR(
  imageDataUrl: string,
  fileId: string | null,
  folderId: string | null,
  settings: AppSettings,
  onProgress?: (progress: number, status: string) => void
): Promise<OCRProcessResult> {
  // Option A: If user has configured Gemini Vision and provided an API key
  if (settings.ocrEngine === 'gemini' && settings.geminiApiKey) {
    try {
      onProgress?.(20, 'Sending statement to Google Gemini 2.5 Flash Vision...');
      const geminiResult = await parseStatementWithGemini(
        imageDataUrl,
        settings.geminiApiKey,
        fileId,
        folderId,
        settings.defaultCurrency
      );

      onProgress?.(80, 'Enriching extracted ISRCs with MusicBrainz...');
      let finalTracks = geminiResult.tracks;

      if (settings.autoLookupIsrcOnline) {
        finalTracks = await Promise.all(
          geminiResult.tracks.map(async (t) => {
            if (t.isrc) {
              try {
                const onlineMeta = await resolveIsrcMetadata(t.isrc);
                if (onlineMeta.found) {
                  return {
                    ...t,
                    isrcVerifiedOnline: true,
                    externalSource: onlineMeta.source,
                    releaseTitle: onlineMeta.releaseTitle || t.releaseTitle,
                    releaseDate: onlineMeta.releaseDate || t.releaseDate,
                    coverArtUrl: onlineMeta.coverArtUrl,
                    upc: onlineMeta.upc || t.upc,
                    iswc: onlineMeta.iswc || t.iswc,
                    validated: true,
                  };
                }
              } catch (e) {
                console.warn('Online ISRC lookup failed:', e);
              }
            }
            return t;
          })
        );
      }

      onProgress?.(100, 'AI Vision Extraction Complete');

      return {
        rawText: geminiResult.rawSummary,
        confidence: 98,
        boundingBoxes: [],
        parsedTracks: finalTracks,
        engineUsed: 'gemini',
      };
    } catch (err: any) {
      console.warn('Gemini Vision extraction failed, falling back to Tesseract OCR:', err);
      // Fallback seamlessly to Tesseract
    }
  }

  // Option B: Local Client-Side Tesseract.js (Offline / Free)
  // Step 1: Preprocessing image
  onProgress?.(10, 'Preprocessing image...');
  let processedImageUrl = imageDataUrl;

  if (settings.autoPreprocessImage) {
    processedImageUrl = await preprocessImage(imageDataUrl, {
      grayscale: true,
      enhanceContrast: settings.enhanceContrast,
      contrastFactor: 1.4,
      binarize: settings.binarizeThreshold,
    });
  }

  onProgress?.(25, 'Initializing OCR engine...');

  // Step 2: Run Tesseract.js
  const worker = await getOcrWorker(settings.ocrLanguage || 'eng', (pct) => {
    const mapped = 25 + Math.round(pct * 0.60);
    onProgress?.(mapped, `Reading screenshot (${pct}%)...`);
  });

  const result = await worker.recognize(processedImageUrl);
  const rawText = result.data.text || '';
  const overallConfidence = result.data.confidence || 0;

  onProgress?.(88, 'Extracting ISRC, titles & royalty metadata...');

  // Extract bounding boxes
  const boundingBoxes: OCRBoundingBox[] = [];
  const pageData = result.data as any;
  if (pageData.words && Array.isArray(pageData.words)) {
    for (const word of pageData.words) {
      if (word.text && word.text.trim()) {
        boundingBoxes.push({
          text: word.text,
          confidence: word.confidence || 0,
          bbox: {
            x0: word.bbox?.x0 || 0,
            y0: word.bbox?.y0 || 0,
            x1: word.bbox?.x1 || 0,
            y1: word.bbox?.y1 || 0,
          },
        });
      }
    }
  }

  // Step 3: Parse extracted text into structured tracks
  let parsedTracks = parseOcrTextToTracks(
    rawText,
    fileId,
    folderId,
    settings.defaultCurrency || 'USD'
  );

  // Step 4: Auto lookup ISRCs online if enabled
  if (settings.autoLookupIsrcOnline && parsedTracks.length > 0) {
    onProgress?.(94, 'Verifying ISRCs with MusicBrainz...');
    parsedTracks = await Promise.all(
      parsedTracks.map(async (t) => {
        if (t.isrc) {
          try {
            const onlineMeta = await resolveIsrcMetadata(t.isrc);
            if (onlineMeta.found) {
              return {
                ...t,
                isrcVerifiedOnline: true,
                externalSource: onlineMeta.source,
                title: onlineMeta.title || t.title,
                artist: onlineMeta.artist || t.artist,
                releaseTitle: onlineMeta.releaseTitle || t.releaseTitle,
                releaseDate: onlineMeta.releaseDate || t.releaseDate,
                duration: onlineMeta.duration || t.duration,
                coverArtUrl: onlineMeta.coverArtUrl,
                upc: onlineMeta.upc || t.upc,
                iswc: onlineMeta.iswc || t.iswc,
                validated: true,
              };
            }
          } catch (e) {
            console.warn('Online ISRC lookup failed:', e);
          }
        }
        return t;
      })
    );
  }

  onProgress?.(100, 'Processing complete');

  return {
    rawText,
    confidence: overallConfidence,
    boundingBoxes,
    parsedTracks,
    engineUsed: 'tesseract',
  };
}
