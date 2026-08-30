import { withoutProviderCredentials } from '../../../shared/browserSettings';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Folder, MediaFile, ParsedTrack, AppSettings } from '../types';

interface RoyaltyDB extends DBSchema {
  folders: {
    key: string;
    value: Folder;
    indexes: { 'by-parent': string | null };
  };
  files: {
    key: string;
    value: MediaFile;
    indexes: { 'by-folder': string | null; 'by-status': string };
  };
  tracks: {
    key: string;
    value: ParsedTrack;
    indexes: { 'by-file': string | null; 'by-folder': string | null; 'by-isrc': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_VERSION = 1;

// ----------------- DEFAULT SETTINGS -----------------
export const DEFAULT_SETTINGS: AppSettings = {
  ocrEngine: 'tesseract',
  geminiApiKey: '',
  ocrLanguage: 'eng',
  autoPreprocessImage: true,
  enhanceContrast: true,
  binarizeThreshold: false,
  isrcPrefix: '',
  defaultCurrency: 'USD',
  defaultPlatform: 'Spotify',
  autoLookupIsrcOnline: true,
  byokKeys: {
    spotifyClientId: '',
    spotifyClientSecret: '',
    discogsToken: '',
    acoustidApiKey: '',
    auddApiKey: '',
    musoAiApiKey: '',
  },
};



// Each mounted workspace owns a fixed database and session guard. Never adopt
// the legacy unowned database or retarget an in-flight operation to a new UID.
export function createRoyaltyStorage(uid: string, isCurrent: () => boolean, open: typeof openDB = openDB) {
  const DB_NAME = `royalty_isrc_extractor_v2:${encodeURIComponent(uid)}`;
  const check = () => {
    if (!isCurrent()) throw new Error('Account changed. Reopen RoyaltyOps.');
    if (!uid || uid === 'guest') throw new Error('Sign in to use your saved RoyaltyOps workspace.');
  };
  let dbPromise: Promise<IDBPDatabase<RoyaltyDB>> | null = null;

  async function getDB(): Promise<IDBPDatabase<RoyaltyDB>> {
    check();
    if (!dbPromise) {
      dbPromise = open<RoyaltyDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Folders store
          if (!db.objectStoreNames.contains('folders')) {
            const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
            folderStore.createIndex('by-parent', 'parentId');
          }

          // Files store
          if (!db.objectStoreNames.contains('files')) {
            const fileStore = db.createObjectStore('files', { keyPath: 'id' });
            fileStore.createIndex('by-folder', 'folderId');
            fileStore.createIndex('by-status', 'status');
          }

          // Tracks store
          if (!db.objectStoreNames.contains('tracks')) {
            const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
            trackStore.createIndex('by-file', 'fileId');
            trackStore.createIndex('by-folder', 'folderId');
            trackStore.createIndex('by-isrc', 'isrc');
          }

          // Settings store
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings');
          }
        },
      });
    }
    const db = await dbPromise;
    check();
    return db;
  }

  // ----------------- FOLDERS CRUD -----------------
  async function getAllFolders(): Promise<Folder[]> {
    const db = await getDB();
    return db.getAll('folders');
  }

  async function saveFolder(folder: Folder): Promise<void> {
    const db = await getDB();
    await db.put('folders', folder);
  }

  async function deleteFolder(id: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['folders', 'files', 'tracks'], 'readwrite');

    // Unassign files and tracks in this folder
    const files = await tx.objectStore('files').index('by-folder').getAll(id);
    for (const file of files) {
      file.folderId = null;
      await tx.objectStore('files').put(file);
    }

    const tracks = await tx.objectStore('tracks').index('by-folder').getAll(id);
    for (const track of tracks) {
      track.folderId = null;
      await tx.objectStore('tracks').put(track);
    }

    await tx.objectStore('folders').delete(id);
    await tx.done;
  }

  // ----------------- FILES CRUD -----------------
  async function getAllFiles(): Promise<MediaFile[]> {
    const db = await getDB();
    return db.getAll('files');
  }

  async function getFileById(id: string): Promise<MediaFile | undefined> {
    const db = await getDB();
    return db.get('files', id);
  }

  async function saveFile(file: MediaFile): Promise<void> {
    const db = await getDB();
    await db.put('files', file);
  }

  async function deleteFile(id: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['files', 'tracks'], 'readwrite');

    // Delete associated tracks
    const tracks = await tx.objectStore('tracks').index('by-file').getAll(id);
    for (const track of tracks) {
      await tx.objectStore('tracks').delete(track.id);
    }

    await tx.objectStore('files').delete(id);
    await tx.done;
  }

  async function updateFileStatus(
    id: string,
    status: MediaFile['status'],
    progress: number,
    rawText?: string,
    errorMessage?: string,
    trackCount?: number
  ): Promise<void> {
    const db = await getDB();
    const file = await db.get('files', id);
    if (file) {
      file.status = status;
      file.ocrProgress = progress;
      file.updatedAt = Date.now();
      if (rawText !== undefined) file.rawOcrText = rawText;
      if (errorMessage !== undefined) file.errorMessage = errorMessage;
      if (trackCount !== undefined) file.trackCount = trackCount;
      await db.put('files', file);
    }
  }

  // ----------------- TRACKS CRUD -----------------
  async function getAllTracks(): Promise<ParsedTrack[]> {
    const db = await getDB();
    return db.getAll('tracks');
  }

  async function getTracksByFileId(fileId: string): Promise<ParsedTrack[]> {
    const db = await getDB();
    return db.getAllFromIndex('tracks', 'by-file', fileId);
  }

  async function saveTrack(track: ParsedTrack): Promise<void> {
    const db = await getDB();
    await db.put('tracks', track);
  }

  async function saveTracks(tracks: ParsedTrack[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('tracks', 'readwrite');
    for (const track of tracks) {
      await tx.store.put(track);
    }
    await tx.done;
  }

  async function deleteTrack(id: string): Promise<void> {
    const db = await getDB();
    const track = await db.get('tracks', id);
    if (track && track.fileId) {
      const file = await db.get('files', track.fileId);
      if (file) {
        file.trackCount = Math.max(0, (file.trackCount || 1) - 1);
        await db.put('files', file);
      }
    }
    await db.delete('tracks', id);
  }

  async function clearAllData(): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['folders', 'files', 'tracks'], 'readwrite');
    await tx.objectStore('folders').clear();
    await tx.objectStore('files').clear();
    await tx.objectStore('tracks').clear();
    await tx.done;
  }

  // ----------------- SETTINGS CRUD -----------------
  async function getSettings(): Promise<AppSettings> {
    const db = await getDB();
    const settings = await db.get('settings', 'app_config');
    const safe = withoutProviderCredentials(settings || DEFAULT_SETTINGS);
    if (settings) await db.put('settings', safe, 'app_config');
    return safe;
  }

  async function saveSettings(settings: AppSettings): Promise<void> {
    const db = await getDB();
    await db.put('settings', withoutProviderCredentials(settings), 'app_config');
  }

  return { getAllFolders, saveFolder, deleteFolder, getAllFiles, getFileById, saveFile, deleteFile, updateFileStatus, getAllTracks, getTracksByFileId, saveTrack, saveTracks, deleteTrack, clearAllData, getSettings, saveSettings };
}
