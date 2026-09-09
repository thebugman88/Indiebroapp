import type { CatalogTrack, VerifiedArtistInfo } from './authService';
type Snapshot = { version: 1; ownerUid: string; artist: VerifiedArtistInfo | null; tracks: CatalogTrack[] };
export function createArtistCatalog(uid: string, isCurrent: () => boolean, storage: () => Pick<Storage, 'getItem' | 'setItem'>) {
  const key = `ib_artist_catalog_v3:${encodeURIComponent(uid)}`;
  const check = () => { if (!isCurrent()) throw new Error('Account changed. Reopen your artist profile.'); };
  function load(): Snapshot {
    check();
    if (!uid || uid === 'guest') return { version: 1, ownerUid: uid, artist: null, tracks: [] };
    const raw = storage().getItem(key);
    if (!raw) return { version: 1, ownerUid: uid, artist: null, tracks: [] };
    const data = JSON.parse(raw);
    if (data?.version !== 1 || data.ownerUid !== uid || !Array.isArray(data.tracks) ||
      !(data.artist === null || (typeof data.artist === 'object' && typeof data.artist.artistName === 'string'))) {
      throw new Error('Saved catalog is invalid. It has not been overwritten.');
    }
    return data;
  }
  function save(artist: VerifiedArtistInfo, tracks: CatalogTrack[]) {
    check();
    if (!uid || uid === 'guest') throw new Error('Sign in before saving your catalog.');
    load(); // Preserve malformed or foreign snapshots for explicit recovery.
    storage().setItem(key, JSON.stringify({ version: 1, ownerUid: uid, artist, tracks }));
  }
  return {
    load, save,
    add(track: CatalogTrack) {
      const old = load();
      const tracks = [track, ...old.tracks];
      const artist = { ...(old.artist || { artistId: 'custom_artist', artistName: track.artistName,
        primaryGenreName: track.primaryGenreName, artworkUrl: track.artworkUrl, claimedAt: Date.now() }), totalCatalogTracks: tracks.length };
      save(artist, tracks); return tracks;
    },
  };
}
