/**
 * MusicBrainz & Deezer Open Music Metadata Service
 * 100% Free, Public APIs requiring no paid subscriptions or API keys.
 * Provides authoritative ISRC, ISWC, recording, release date, and album artwork verification.
 */

export interface VerifiedIsrcMetadata {
  isrc: string;
  found: boolean;
  title?: string;
  artist?: string;
  releaseTitle?: string;
  releaseDate?: string;
  duration?: string;
  label?: string;
  upc?: string;
  iswc?: string;
  coverArtUrl?: string;
  source?: 'MusicBrainz' | 'Deezer' | 'MusicBrainz & Deezer';
  rawDetails?: any;
}

/**
 * Clean and format ISRC code into standard CC-XXX-YY-NNNNN or raw 12-char
 */
export function formatIsrc(rawIsrc: string): string {
  const cleaned = rawIsrc.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 7)}-${cleaned.slice(7, 12)}`;
  }
  return rawIsrc.trim().toUpperCase();
}

/**
 * Query MusicBrainz open database for a given ISRC
 */
export async function lookupMusicBrainzIsrc(isrc: string): Promise<Partial<VerifiedIsrcMetadata> | null> {
  const cleanIsrc = isrc.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleanIsrc.length !== 12) return null;

  try {
    const url = `https://musicbrainz.org/ws/2/isrc/${cleanIsrc}?fmt=json&inc=artists+releases+labels+works+artist-credits`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RoyaltyOps/2.0.1 (https://github.com/indiebrotherhood/royalty-isrc-extractor)',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`MusicBrainz HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const recordings = data.recordings || [];
    if (recordings.length === 0) return null;

    const firstRec = recordings[0];
    const title = firstRec.title || '';
    const artist = firstRec['artist-credit']?.[0]?.name || firstRec['artist-credit']?.[0]?.artist?.name || '';
    
    // Duration in milliseconds to MM:SS
    let durationStr: string | undefined;
    if (firstRec.length && typeof firstRec.length === 'number') {
      const totalSec = Math.floor(firstRec.length / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      durationStr = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    // Release details
    let releaseTitle: string | undefined;
    let releaseDate: string | undefined;
    let label: string | undefined;
    let upc: string | undefined;

    if (firstRec.releases && firstRec.releases.length > 0) {
      const rel = firstRec.releases[0];
      releaseTitle = rel.title;
      releaseDate = rel.date;
      upc = rel.barcode;
      if (rel['label-info'] && rel['label-info'].length > 0) {
        label = rel['label-info'][0]?.label?.name;
      }
    }

    // ISWC from linked works
    let iswc: string | undefined;
    if (firstRec.relations && Array.isArray(firstRec.relations)) {
      for (const rel of firstRec.relations) {
        if (rel.work && rel.work.iswcs && rel.work.iswcs.length > 0) {
          iswc = rel.work.iswcs[0];
          break;
        }
      }
    }

    return {
      found: true,
      title,
      artist,
      releaseTitle,
      releaseDate,
      duration: durationStr,
      label: label || 'Independent',
      upc,
      iswc,
      source: 'MusicBrainz',
      rawDetails: firstRec,
    };
  } catch (err) {
    console.warn('MusicBrainz ISRC lookup error:', err);
    return null;
  }
}

/**
 * Query Deezer open API for track info and high-res cover art by ISRC
 * Deezer API has no rate-limiting for basic lookups and returns instant JSON.
 */
export async function lookupDeezerIsrc(isrc: string): Promise<Partial<VerifiedIsrcMetadata> | null> {
  const cleanIsrc = isrc.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleanIsrc.length !== 12) return null;

  try {
    const url = `https://api.deezer.com/track/isrc:${cleanIsrc}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.error) return null;

    let durationStr: string | undefined;
    if (data.duration && typeof data.duration === 'number') {
      const min = Math.floor(data.duration / 60);
      const sec = data.duration % 60;
      durationStr = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    return {
      found: true,
      title: data.title || data.title_short,
      artist: data.artist?.name,
      releaseTitle: data.album?.title,
      releaseDate: data.release_date,
      duration: durationStr,
      coverArtUrl: data.album?.cover_medium || data.album?.cover_big,
      source: 'Deezer',
      rawDetails: data,
    };
  } catch (err) {
    console.warn('Deezer ISRC lookup error:', err);
    return null;
  }
}

/**
 * Unified ISRC Metadata Resolver
 * Simultaneously queries MusicBrainz and Deezer in parallel to assemble complete metadata.
 */
export async function resolveIsrcMetadata(rawIsrc: string): Promise<VerifiedIsrcMetadata> {
  const standardIsrc = formatIsrc(rawIsrc);
  const cleanIsrc = standardIsrc.replace(/[^a-zA-Z0-9]/g, '');

  if (cleanIsrc.length !== 12) {
    return {
      isrc: standardIsrc,
      found: false,
    };
  }

  // Execute lookups in parallel
  const [mbResult, deezerResult] = await Promise.all([
    lookupMusicBrainzIsrc(cleanIsrc),
    lookupDeezerIsrc(cleanIsrc),
  ]);

  if (!mbResult && !deezerResult) {
    return {
      isrc: standardIsrc,
      found: false,
    };
  }

  let sourceStr: VerifiedIsrcMetadata['source'] = 'MusicBrainz';
  if (mbResult && deezerResult) {
    sourceStr = 'MusicBrainz & Deezer';
  } else if (deezerResult) {
    sourceStr = 'Deezer';
  }

  return {
    isrc: standardIsrc,
    found: true,
    title: mbResult?.title || deezerResult?.title,
    artist: mbResult?.artist || deezerResult?.artist,
    releaseTitle: mbResult?.releaseTitle || deezerResult?.releaseTitle,
    releaseDate: mbResult?.releaseDate || deezerResult?.releaseDate,
    duration: mbResult?.duration || deezerResult?.duration,
    label: mbResult?.label || 'Independent',
    upc: mbResult?.upc,
    iswc: mbResult?.iswc,
    coverArtUrl: deezerResult?.coverArtUrl,
    source: sourceStr,
  };
}
