import { TrackMetadata } from '../types';
import { isValidIsrc } from './audioInput';

export const METADATA_LIMITS: Record<Exclude<keyof TrackMetadata, 'explicit' | 'coverArtUrl' | 'coverArtBlob'>, number> = {
  title: 120,
  artist: 120,
  featuredArtists: 160,
  album: 120,
  trackNumber: 4,
  totalTracks: 4,
  discNumber: 4,
  year: 4,
  genre: 64,
  isrc: 17,
  upc: 14,
  composer: 160,
  producer: 120,
  label: 120,
  copyright: 200,
  phonographicCopyright: 200,
  masteringEngineer: 120,
  notes: 500,
};

export function validateMetadataForExport(metadata: TrackMetadata): void {
  for (const [field, limit] of Object.entries(METADATA_LIMITS)) {
    const value = metadata[field as keyof typeof METADATA_LIMITS];
    if (value.length > limit) throw new Error(`${field} exceeds the ${limit}-character export limit.`);
  }
  if (metadata.isrc && !isValidIsrc(metadata.isrc)) throw new Error('Enter a valid assigned ISRC or leave the field blank.');
}

const cleanFilenamePart = (value: string, fallback: string) => {
  const cleaned = value.replace(/[\u0000-\u001f<>:"/\\|?*]/g, '').replace(/[. ]+$/g, '').trim();
  return (cleaned || fallback).slice(0, 48).trim() || fallback;
};

export function buildSafeWavFilename(artist: string, title: string): string {
  const base = `${cleanFilenamePart(artist, 'Master')} - ${cleanFilenamePart(title, 'Track')}`.slice(0, 104).trim();
  return `${base || 'Master - Track'} [Mastered].wav`;
}
