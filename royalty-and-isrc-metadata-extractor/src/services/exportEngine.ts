import Papa from 'papaparse';
import { ParsedTrack, ExportPlatform } from '../types';

export interface ExportColumnMapping {
  key: string;
  header: string;
  getter: (track: ParsedTrack) => string | number;
}

export const PLATFORM_SPECS: Record<ExportPlatform, { name: string; filenamePrefix: string; description: string; columns: ExportColumnMapping[] }> = {
  ASCAP: {
    name: 'ASCAP Title Registration',
    filenamePrefix: 'ASCAP_Repertoire_Registration',
    description: 'Compliant with ASCAP Song & Performance Royalty registration format.',
    columns: [
      { key: 'workTitle', header: 'Work Title', getter: (t) => t.title },
      { key: 'isrc', header: 'ISRC', getter: (t) => t.isrc || '' },
      { key: 'iswc', header: 'ISWC', getter: (t) => t.iswc || '' },
      { key: 'writer1', header: 'Writer 1 Name', getter: (t) => t.writers[0]?.name || t.artist || '' },
      { key: 'writer1Role', header: 'Writer 1 Role', getter: (t) => t.writers[0]?.role || 'Writer' },
      { key: 'writer1Share', header: 'Writer 1 Share (%)', getter: (t) => t.writers[0]?.percentage ?? 100 },
      { key: 'writer1Ipi', header: 'Writer 1 IPI', getter: (t) => t.writers[0]?.ipi || '' },
      { key: 'publisher1', header: 'Publisher 1 Name', getter: (t) => t.publishers[0]?.name || 'Direct / Self-Published' },
      { key: 'publisher1Share', header: 'Publisher 1 Share (%)', getter: (t) => t.publishers[0]?.percentage ?? 100 },
      { key: 'publisher1Ipi', header: 'Publisher 1 IPI', getter: (t) => t.publishers[0]?.ipi || '' },
      { key: 'duration', header: 'Duration', getter: (t) => t.duration || '03:30' },
      { key: 'perfType', header: 'Performance Type', getter: () => 'Digital Audio Transmission' },
      { key: 'releaseDate', header: 'Release Date', getter: (t) => t.releaseDate || '' },
    ],
  },
  MLC: {
    name: 'The MLC (Mechanical Licensing Collective)',
    filenamePrefix: 'TheMLC_Bulk_Claim_Registration',
    description: 'Bulk Mechanical Royalty and Sound Recording Matching format for The MLC Portal.',
    columns: [
      { key: 'songTitle', header: 'Song Title', getter: (t) => t.title },
      { key: 'workTitle', header: 'Work Title', getter: (t) => t.title },
      { key: 'isrc', header: 'ISRC', getter: (t) => t.isrc || '' },
      { key: 'iswc', header: 'ISWC', getter: (t) => t.iswc || '' },
      { key: 'primaryArtist', header: 'Primary Recording Artist', getter: (t) => t.artist },
      { key: 'releaseTitle', header: 'Release Title', getter: (t) => t.releaseTitle || t.title },
      { key: 'duration', header: 'Sound Recording Duration', getter: (t) => t.duration || '03:30' },
      { key: 'writer1', header: 'Writer 1 Full Name', getter: (t) => t.writers[0]?.name || t.artist || '' },
      { key: 'writer1Ipi', header: 'Writer 1 IPI Number', getter: (t) => t.writers[0]?.ipi || '' },
      { key: 'writer1Role', header: 'Writer 1 Role Code', getter: (t) => t.writers[0]?.role === 'Composer' ? 'CA' : 'A' },
      { key: 'publisher1', header: 'Publisher 1 Name', getter: (t) => t.publishers[0]?.name || 'Direct / Self-Published' },
      { key: 'publisher1Ipi', header: 'Publisher 1 IPI Number', getter: (t) => t.publishers[0]?.ipi || '' },
      { key: 'mechShare', header: 'Mechanical Share %', getter: (t) => t.writers[0]?.percentage ?? 100 },
      { key: 'upc', header: 'UPC / Catalog Number', getter: (t) => t.upc || '' },
      { key: 'releaseDate', header: 'Commercial Release Date', getter: (t) => t.releaseDate || '' },
    ],
  },
  SOUNDEXCHANGE: {
    name: 'SoundExchange ISRC Ingestion',
    filenamePrefix: 'SoundExchange_ISRC_Ingestion',
    description: 'Compliant with SoundExchange digital performance recording metadata intake.',
    columns: [
      { key: 'soundTitle', header: 'Sound Recording Title', getter: (t) => t.title },
      { key: 'featuredArtist', header: 'Featured Artist', getter: (t) => t.artist },
      { key: 'nonFeaturedArtist', header: 'Non-Featured Artist', getter: () => '' },
      { key: 'isrc', header: 'ISRC', getter: (t) => t.isrc || '' },
      { key: 'albumTitle', header: 'Album Title', getter: (t) => t.releaseTitle || t.title },
      { key: 'recordLabel', header: 'Record Label', getter: (t) => t.label || 'Independent' },
      { key: 'releaseYear', header: 'Release Year', getter: (t) => t.releaseDate ? t.releaseDate.substring(0, 4) : new Date().getFullYear().toString() },
      { key: 'pLine', header: 'P-Line (Copyright Notice)', getter: (t) => t.pLine || `${new Date().getFullYear()} ${t.artist}` },
      { key: 'duration', header: 'Track Duration (HH:MM:SS)', getter: (t) => {
        const d = t.duration || '03:30';
        return d.split(':').length === 2 ? `00:${d}` : d;
      }},
      { key: 'country', header: 'Country of Recording', getter: () => 'US' },
    ],
  },
  BMI: {
    name: 'BMI Work Registration',
    filenamePrefix: 'BMI_Work_Registration',
    description: 'Broadcast Music, Inc. official song clearance & repertoire standard.',
    columns: [
      { key: 'workTitle', header: 'Work Title', getter: (t) => t.title },
      { key: 'isrc', header: 'ISRC', getter: (t) => t.isrc || '' },
      { key: 'iswc', header: 'ISWC', getter: (t) => t.iswc || '' },
      { key: 'artist', header: 'Performing Artist', getter: (t) => t.artist },
      { key: 'composer1', header: 'Songwriter / Composer 1', getter: (t) => t.writers[0]?.name || t.artist || '' },
      { key: 'composer1Ipi', header: 'Writer 1 CAE / IPI', getter: (t) => t.writers[0]?.ipi || '' },
      { key: 'composer1Share', header: 'Writer 1 Share (%)', getter: (t) => t.writers[0]?.percentage ?? 100 },
      { key: 'publisher1', header: 'Publisher 1', getter: (t) => t.publishers[0]?.name || 'Direct' },
      { key: 'publisher1Share', header: 'Publisher 1 Share (%)', getter: (t) => t.publishers[0]?.percentage ?? 100 },
      { key: 'duration', header: 'Duration', getter: (t) => t.duration || '03:30' },
      { key: 'releaseDate', header: 'Release Date', getter: (t) => t.releaseDate || '' },
    ],
  },
  UNIVERSAL_MASTER: {
    name: 'Universal Master Royalty Report',
    filenamePrefix: 'Master_Royalty_Metadata_Report',
    description: 'Comprehensive tabular data export with all streams, payouts, and metadata.',
    columns: [
      { key: 'title', header: 'Song Title', getter: (t) => t.title },
      { key: 'artist', header: 'Artist', getter: (t) => t.artist },
      { key: 'isrc', header: 'ISRC', getter: (t) => t.isrc || '' },
      { key: 'iswc', header: 'ISWC', getter: (t) => t.iswc || '' },
      { key: 'streams', header: 'Total Streams', getter: (t) => t.streams ?? '' },
      { key: 'revenue', header: 'Gross Revenue', getter: (t) => t.revenue !== undefined ? t.revenue.toFixed(2) : '' },
      { key: 'currency', header: 'Currency', getter: (t) => t.currency || 'USD' },
      { key: 'platform', header: 'Platform / DSP', getter: (t) => t.platform || '' },
      { key: 'releaseTitle', header: 'Release Title', getter: (t) => t.releaseTitle || '' },
      { key: 'releaseDate', header: 'Release Date', getter: (t) => t.releaseDate || '' },
      { key: 'duration', header: 'Duration', getter: (t) => t.duration || '' },
      { key: 'label', header: 'Record Label', getter: (t) => t.label || '' },
      { key: 'upc', header: 'UPC', getter: (t) => t.upc || '' },
      { key: 'pLine', header: 'P-Line', getter: (t) => t.pLine || '' },
      { key: 'writers', header: 'Writers', getter: (t) => t.writers.map(w => `${w.name} (${w.percentage}%)`).join('; ') },
      { key: 'publishers', header: 'Publishers', getter: (t) => t.publishers.map(p => `${p.name} (${p.percentage}%)`).join('; ') },
      { key: 'confidence', header: 'OCR Confidence (%)', getter: (t) => t.confidence },
      { key: 'validated', header: 'Validated Status', getter: (t) => t.validated ? 'Verified' : 'Unverified' },
      { key: 'createdAt', header: 'Added Timestamp', getter: (t) => new Date(t.createdAt).toISOString() },
    ],
  },
  JSON: {
    name: 'Raw JSON Data Package',
    filenamePrefix: 'Royalty_Metadata_Export',
    description: 'Raw structured JSON objects for API and developer integration.',
    columns: [],
  },
};

/**
 * Generate formatted CSV string using PapaParse
 */
export function generatePlatformCSV(tracks: ParsedTrack[], platform: ExportPlatform): string {
  if (platform === 'JSON') {
    return JSON.stringify(tracks, null, 2);
  }

  const spec = PLATFORM_SPECS[platform];
  const columns = spec.columns;

  const rows = tracks.map((track) => {
    const rowObj: Record<string, string | number> = {};
    for (const col of columns) {
      rowObj[col.header] = col.getter(track);
    }
    return rowObj;
  });

  return Papa.unparse(rows, {
    quotes: true,
    header: true,
  });
}

/**
 * Download generated file directly via Blob and anchor trigger
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger platform export with formatted filename and timestamp
 */
export function exportTracks(tracks: ParsedTrack[], platform: ExportPlatform, customName?: string): void {
  if (tracks.length === 0) {
    throw new Error('No tracks selected for export');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const spec = PLATFORM_SPECS[platform];
  const baseName = customName || `${spec.filenamePrefix}_${dateStr}`;

  if (platform === 'JSON') {
    const jsonStr = JSON.stringify(tracks, null, 2);
    downloadFile(jsonStr, `${baseName}.json`, 'application/json');
  } else {
    const csvContent = generatePlatformCSV(tracks, platform);
    downloadFile(csvContent, `${baseName}.csv`, 'text/csv');
  }
}
