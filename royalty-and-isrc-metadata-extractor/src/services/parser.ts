import { ParsedTrack, SplitShare } from '../types';

// Regex patterns for music metadata
const ISRC_REGEX = /\b([A-Z]{2})[-.\s]?([A-Z0-9]{3})[-.\s]?([0-9]{2})[-.\s]?([0-9]{5})\b/gi;
const ISWC_REGEX = /\b(T[-.\s]?[0-9]{3}[-.\s]?[0-9]{3}[-.\s]?[0-9]{3}[-.\s]?[0-9]|T[-.\s]?[0-9]{9}[-.\s]?[0-9])\b/gi;
const UPC_REGEX = /\b(?:UPC|EAN|Barcode)?[:\s#]*([0-9]{12,14})\b/gi;
const REVENUE_REGEX = /([$€£¥])\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/g;
const STREAMS_REGEX = /\b([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+(?:\.[0-9]+)?\s*[kmbKMB])\s*(?:streams?|plays?|views?|listens?)?\b/g;
const DURATION_REGEX = /\b([0-5]?[0-9]:[0-5][0-9](?::[0-5][0-9])?)\b/g;
const YEAR_REGEX = /\b(19\d{2}|20\d{2})\b/g;

export interface ExtractedEntities {
  isrcs: string[];
  iswcs: string[];
  upcs: string[];
  revenues: { currency: string; amount: number }[];
  streamCounts: number[];
  durations: string[];
  platforms: string[];
  years: string[];
  rawLines: string[];
}

export function extractEntitiesFromText(rawText: string): ExtractedEntities {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Extract ISRCs
  const isrcs: string[] = [];
  let isrcMatch;
  const isrcRe = new RegExp(ISRC_REGEX);
  while ((isrcMatch = isrcRe.exec(rawText)) !== null) {
    const formatted = `${isrcMatch[1].toUpperCase()}-${isrcMatch[2].toUpperCase()}-${isrcMatch[3]}-${isrcMatch[4]}`;
    if (!isrcs.includes(formatted)) {
      isrcs.push(formatted);
    }
  }

  // Extract ISWCs
  const iswcs: string[] = [];
  let iswcMatch;
  const iswcRe = new RegExp(ISWC_REGEX);
  while ((iswcMatch = iswcRe.exec(rawText)) !== null) {
    const clean = iswcMatch[1].replace(/[\s.-]/g, '');
    const formatted = `T-${clean.substring(1, 10)}-${clean.substring(10) || '0'}`;
    if (!iswcs.includes(formatted)) {
      iswcs.push(formatted);
    }
  }

  // Extract UPCs
  const upcs: string[] = [];
  let upcMatch;
  const upcRe = new RegExp(UPC_REGEX);
  while ((upcMatch = upcRe.exec(rawText)) !== null) {
    if (!upcs.includes(upcMatch[1])) {
      upcs.push(upcMatch[1]);
    }
  }

  // Extract Revenues
  const revenues: { currency: string; amount: number }[] = [];
  let revMatch;
  const revRe = new RegExp(REVENUE_REGEX);
  while ((revMatch = revRe.exec(rawText)) !== null) {
    const symbol = revMatch[1];
    const numStr = revMatch[2].replace(/,/g, '');
    const num = parseFloat(numStr);
    if (!isNaN(num) && num > 0) {
      let cur = 'USD';
      if (symbol === '€') cur = 'EUR';
      if (symbol === '£') cur = 'GBP';
      if (symbol === '¥') cur = 'JPY';
      revenues.push({ currency: cur, amount: num });
    }
  }

  // Extract Streams
  const streamCounts: number[] = [];
  let stMatch;
  const stRe = new RegExp(STREAMS_REGEX);
  while ((stMatch = stRe.exec(rawText)) !== null) {
    const text = stMatch[1].trim().toLowerCase();
    let num = 0;
    if (text.endsWith('m')) {
      num = parseFloat(text.slice(0, -1)) * 1000000;
    } else if (text.endsWith('k')) {
      num = parseFloat(text.slice(0, -1)) * 1000;
    } else if (text.endsWith('b')) {
      num = parseFloat(text.slice(0, -1)) * 1000000000;
    } else {
      num = parseInt(text.replace(/,/g, ''), 10);
    }
    if (!isNaN(num) && num > 0 && !streamCounts.includes(num)) {
      streamCounts.push(num);
    }
  }

  // Extract Durations
  const durations: string[] = [];
  let durMatch;
  const durRe = new RegExp(DURATION_REGEX);
  while ((durMatch = durRe.exec(rawText)) !== null) {
    if (!durations.includes(durMatch[1])) {
      durations.push(durMatch[1]);
    }
  }

  // Extract Platform
  const platforms: string[] = [];
  const lower = rawText.toLowerCase();
  if (lower.includes('spotify')) platforms.push('Spotify');
  if (lower.includes('apple music') || lower.includes('itunes')) platforms.push('Apple Music');
  if (lower.includes('youtube')) platforms.push('YouTube');
  if (lower.includes('amazon')) platforms.push('Amazon Music');
  if (lower.includes('distrokid')) platforms.push('DistroKid');
  if (lower.includes('soundexchange')) platforms.push('SoundExchange');
  if (lower.includes('tunecore')) platforms.push('TuneCore');
  if (lower.includes('cd baby') || lower.includes('cdbaby')) platforms.push('CD Baby');
  if (lower.includes('tidal')) platforms.push('Tidal');
  if (lower.includes('deezer')) platforms.push('Deezer');
  if (lower.includes('pandora')) platforms.push('Pandora');
  if (lower.includes('tiktok')) platforms.push('TikTok');

  // Extract Years
  const years: string[] = [];
  let yrMatch;
  const yrRe = new RegExp(YEAR_REGEX);
  while ((yrMatch = yrRe.exec(rawText)) !== null) {
    if (!years.includes(yrMatch[1])) {
      years.push(yrMatch[1]);
    }
  }

  return {
    isrcs,
    iswcs,
    upcs,
    revenues,
    streamCounts,
    durations,
    platforms,
    years,
    rawLines: lines,
  };
}

/**
 * Intelligent line parser that parses OCR blocks into structured tracks.
 * Handles table structures, DSP screenshot outputs, and key-value royalty dashboards.
 */
export function parseOcrTextToTracks(
  rawText: string,
  fileId: string | null,
  folderId: string | null,
  defaultCurrency = 'USD'
): ParsedTrack[] {
  if (!rawText || !rawText.trim()) return [];

  const entities = extractEntitiesFromText(rawText);
  const lines = entities.rawLines;
  const detectedPlatform = entities.platforms[0] || 'Spotify';

  // Strategy 1: If ISRCs are found, create a track entry for each ISRC
  if (entities.isrcs.length > 0) {
    return entities.isrcs.map((isrc, index) => {
      // Look around lines near where the ISRC appears to find title, artist, streams
      let matchedTitle = '';
      let matchedArtist = '';
      let matchedStreams = entities.streamCounts[index] || undefined;
      let matchedRevenue = entities.revenues[index]?.amount || undefined;
      let matchedDuration = entities.durations[index] || undefined;

      // Find the line index with this ISRC
      const isrcRaw = isrc.replace(/-/g, '');
      const lineIdx = lines.findIndex(l => l.replace(/[\s-]/g, '').toUpperCase().includes(isrcRaw));

      if (lineIdx !== -1) {
        // Inspect surrounding lines (-3 to +3)
        const windowLines = lines.slice(Math.max(0, lineIdx - 3), Math.min(lines.length, lineIdx + 4));
        
        for (const line of windowLines) {
          if (line.includes(isrc) || line.replace(/[\s-]/g, '').toUpperCase().includes(isrcRaw)) continue;

          // Check if line looks like a title or artist
          // Clean out numbers, symbols
          const cleanLine = line.replace(/[0-9$,.€£]/g, '').trim();
          if (cleanLine.length > 2 && !cleanLine.toLowerCase().includes('isrc') && !cleanLine.toLowerCase().includes('streams')) {
            if (!matchedTitle) {
              // Check for "Title by Artist" or "Title - Artist"
              if (line.includes(' - ')) {
                const parts = line.split(' - ');
                matchedTitle = parts[0].trim();
                matchedArtist = parts[1].trim();
              } else if (line.toLowerCase().includes(' by ')) {
                const parts = line.split(/ by /i);
                matchedTitle = parts[0].trim();
                matchedArtist = parts[1].trim();
              } else {
                matchedTitle = cleanLine;
              }
            } else if (!matchedArtist) {
              matchedArtist = cleanLine;
            }
          }
        }
      }

      // If no title found from line context, derive from non-ISRC lines
      if (!matchedTitle) {
        const candidateLine = lines.find(l => 
          !l.includes(isrc) && 
          !/^\d+$/.test(l) && 
          !l.startsWith('$') && 
          l.length > 3 && 
          !l.toLowerCase().includes('isrc') &&
          !l.toLowerCase().includes('dashboard')
        );
        matchedTitle = candidateLine || `Track ${index + 1}`;
      }

      if (!matchedArtist) {
        matchedArtist = 'Primary Artist';
      }

      // Generate default 100% split
      const writers: SplitShare[] = [
        {
          id: `w-${Date.now()}-${index}`,
          name: matchedArtist !== 'Primary Artist' ? matchedArtist : 'Songwriter 1',
          role: 'Writer',
          percentage: 100,
        }
      ];

      const publishers: SplitShare[] = [
        {
          id: `p-${Date.now()}-${index}`,
          name: 'Self-Published / Direct',
          role: 'Publisher',
          percentage: 100,
        }
      ];

      // Confidence score calculation based on extracted fields
      let score = 50;
      if (isrc) score += 25;
      if (matchedTitle && matchedTitle !== `Track ${index + 1}`) score += 15;
      if (matchedStreams || matchedRevenue) score += 10;

      return {
        id: `trk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${index}`,
        fileId,
        folderId,
        title: matchedTitle.replace(/^[0-9]+[.)]\s*/, ''), // remove leading index numbers
        artist: matchedArtist,
        isrc: isrc,
        iswc: entities.iswcs[index] || undefined,
        streams: matchedStreams,
        revenue: matchedRevenue,
        currency: entities.revenues[index]?.currency || defaultCurrency,
        platform: detectedPlatform,
        releaseTitle: matchedTitle,
        releaseDate: entities.years[0] ? `${entities.years[0]}-01-01` : undefined,
        duration: matchedDuration || '03:30',
        label: 'Independent',
        upc: entities.upcs[index] || undefined,
        pLine: `${entities.years[0] || new Date().getFullYear()} ${matchedArtist}`,
        writers,
        publishers,
        confidence: Math.min(100, score),
        // OCR is an extraction aid, not an authoritative metadata verifier.
        validated: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    });
  }

  // Strategy 2: If no explicit ISRCs were found, but text contains song title / streams / revenue lines
  // Create structured items from lines
  const parsedItems: ParsedTrack[] = [];
  let currentTitle = '';
  let currentArtist = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip headers or common UI labels
    if (/^(title|track|song|streams|revenue|payout|earnings|dashboard|overview|artist|album|all time|last 28 days)$/i.test(line)) {
      continue;
    }

    if (line.includes(' - ') && !line.startsWith('$')) {
      const parts = line.split(' - ');
      currentTitle = parts[0].trim();
      currentArtist = parts[1].trim();
    } else if (line.length > 3 && !/^\d+$/.test(line) && !line.startsWith('$') && !currentTitle) {
      currentTitle = line;
    } else if (currentTitle && !currentArtist && line.length > 2 && !/^\d+$/.test(line) && !line.startsWith('$')) {
      currentArtist = line;
    }

    if (currentTitle && (currentArtist || i === lines.length - 1)) {
      // Build track
      const writers: SplitShare[] = [
        {
          id: `w-${Date.now()}-${parsedItems.length}`,
          name: currentArtist || 'Songwriter 1',
          role: 'Writer',
          percentage: 100,
        }
      ];

      parsedItems.push({
        id: `trk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${parsedItems.length}`,
        fileId,
        folderId,
        title: currentTitle.replace(/^[0-9]+[.)]\s*/, ''),
        artist: currentArtist || 'Primary Artist',
        isrc: '',
        streams: entities.streamCounts[parsedItems.length] || undefined,
        revenue: entities.revenues[parsedItems.length]?.amount || undefined,
        currency: entities.revenues[parsedItems.length]?.currency || defaultCurrency,
        platform: detectedPlatform,
        releaseDate: entities.years[0] ? `${entities.years[0]}-01-01` : undefined,
        duration: entities.durations[parsedItems.length] || '03:30',
        label: 'Independent',
        pLine: `${entities.years[0] || new Date().getFullYear()} ${currentArtist || 'Artist'}`,
        writers,
        publishers: [
          {
            id: `p-${Date.now()}-${parsedItems.length}`,
            name: 'Direct Publishing',
            role: 'Publisher',
            percentage: 100,
          }
        ],
        confidence: 60,
        validated: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      currentTitle = '';
      currentArtist = '';
    }
  }

  return parsedItems;
}
