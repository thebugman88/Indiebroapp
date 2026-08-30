import { withoutProviderCredentials } from '../../../shared/browserSettings';
import {
  ArtistProfile,
  ChatMessage,
  FolderItem,
  ScheduledEvent,
  SettingsState,
  SongMetadata,
  UploadedDocument,
} from "../types";

export const DEFAULT_SETTINGS: SettingsState = {
  customApiKey: "",
  preferredModel: "gemini-3.7-flash",
  enableWebSearch: true,
  enableSoundAlerts: true,
  storageMode: "localStorage_only",
  desktopNotificationsEnabled: true,
};

export const DEFAULT_PROFILE: ArtistProfile = {
  artistName: "",
  genre: "Indie / Alternative",
  stage: "Actively Releasing",
  pro: "ASCAP",
  ipi: "",
  publisher: "Self-Published",
  distributor: "DistroKid",
  bio: "",
  careerGoals: [
    "Reach 50,000 monthly Spotify listeners",
    "Secure 2 sync placements on indie films/streaming series",
    "Register 100% of song splits on The MLC and ASCAP",
  ],
};

export const DEFAULT_FOLDERS: FolderItem[] = [
  {
    id: "folder_rollout",
    name: "2026 Release Rollout",
    color: "#6366f1",
    description: "Artwork, deliverables, master WAVs, and rollout schedules",
    createdAt: new Date().toISOString(),
  },
  {
    id: "folder_statements",
    name: "Royalty & Stream Statements",
    color: "#10b981",
    description: "DistroKid, Spotify for Artists, and DSP royalty screenshots",
    createdAt: new Date().toISOString(),
  },
  {
    id: "folder_splits",
    name: "Split Sheets & Legal",
    color: "#f59e0b",
    description: "Co-writer agreements, signed split sheets, and producer contracts",
    createdAt: new Date().toISOString(),
  },
  {
    id: "folder_press",
    name: "Press & EPK Assets",
    color: "#ec4899",
    description: "Biographies, curator pitch decks, and promo clips",
    createdAt: new Date().toISOString(),
  },
];

export interface CareerSnapshot {
  profile: ArtistProfile;
  settings: SettingsState;
  songs: SongMetadata[];
  folders: FolderItem[];
  documents: UploadedDocument[];
  events: ScheduledEvent[];
  chatMessages: ChatMessage[];
}

export function emptyCareerSnapshot(): CareerSnapshot {
  return structuredClone({ profile: DEFAULT_PROFILE, settings: DEFAULT_SETTINGS,
    songs: [], folders: DEFAULT_FOLDERS, documents: [], events: [], chatMessages: [] });
}

export function createCareerVault(
  uid: string,
  isCurrent: () => boolean,
  storage: () => Pick<Storage, 'getItem' | 'setItem'>,
) {
  const key = `ib_career_v2:${encodeURIComponent(uid)}`;
  const guest = !uid || uid === 'guest';
  const check = () => {
    if (!isCurrent()) throw new Error('Account changed. Reopen Artist Assistant.');
  };
  const sanitize = (snapshot: CareerSnapshot): CareerSnapshot => ({ ...snapshot,
    settings: { ...withoutProviderCredentials(snapshot.settings), storageMode: 'localStorage_only' },
  });
  const validate = (snapshot: any): snapshot is CareerSnapshot => {
    if (!snapshot || typeof snapshot.profile !== 'object' || !snapshot.profile ||
        typeof snapshot.settings !== 'object' || !snapshot.settings) return false;
    return ['songs', 'folders', 'documents', 'events', 'chatMessages'].every(field =>
      Array.isArray(snapshot[field]) && snapshot[field].every((item: any) => item && typeof item.id === 'string'));
  };
  return {
    load(): CareerSnapshot {
      check();
      if (guest) return emptyCareerSnapshot();
      const raw = storage().getItem(key);
      if (raw === null) return emptyCareerSnapshot();
      const record = JSON.parse(raw);
      if (!record || record.schemaVersion !== 2 || record.ownerUid !== uid || !validate(record.snapshot)) {
        throw new Error('This account’s saved workspace is invalid. Existing data was not changed.');
      }
      return sanitize(record.snapshot);
    },
    save(snapshot: CareerSnapshot): boolean {
      check();
      if (!validate(snapshot)) throw new Error('Invalid workspace. Existing data was not changed.');
      if (guest) return false;
      const now = new Date().toISOString();
      const raw = storage().getItem(key);
      const old = raw === null ? null : JSON.parse(raw);
      if (raw !== null && (!old || old.ownerUid !== uid || old.schemaVersion !== 2 || !validate(old.snapshot))) {
        throw new Error('Saved workspace is invalid. Export your current work before recovery.');
      }
      storage().setItem(key, JSON.stringify({ schemaVersion: 2, ownerUid: uid,
        createdAt: old?.createdAt || now, updatedAt: now, snapshot: sanitize(snapshot) }));
      return true;
    },
    reset(snapshot: CareerSnapshot): CareerSnapshot {
      check();
      const cleared = { ...snapshot, songs: [], folders: structuredClone(DEFAULT_FOLDERS),
        documents: [], events: [], chatMessages: [] };
      this.save(cleared);
      return cleared;
    },
    export(snapshot: CareerSnapshot): string {
      check();
      if (!validate(snapshot)) throw new Error('Cannot export an invalid workspace.');
      const safe = sanitize(snapshot);
      return JSON.stringify({ app: 'IndieBrotherhood Career OS', schemaVersion: 2,
        ownerUid: uid, exportedAt: new Date().toISOString(), ...safe,
        documents: safe.documents.map(({ id, name, folderId, size, status, ocrRawText, parsedSongMetadata, uploadedAt }) =>
          ({ id, name, folderId, size, status, ocrRawText, parsedSongMetadata, uploadedAt })),
      }, null, 2);
    },
  };
}
