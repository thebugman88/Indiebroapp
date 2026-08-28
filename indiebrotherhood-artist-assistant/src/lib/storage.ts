import {
  ArtistProfile,
  ChatMessage,
  FolderItem,
  ScheduledEvent,
  SettingsState,
  SongMetadata,
  UploadedDocument,
} from "../types";

const DB_NAME = "IndieArtistCareerOS_DB";
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: SettingsState = {
  customApiKey: "",
  preferredModel: "gemini-3.7-flash",
  enableWebSearch: true,
  enableSoundAlerts: true,
  storageMode: "local_indexeddb",
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

// Open IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;

      const stores = [
        "songs",
        "folders",
        "documents",
        "events",
        "chat_history",
        "kv_store",
      ];

      for (const storeName of stores) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Synchronous and mirrored LocalStorage helpers for instant render
export function getStoredProfile(): ArtistProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem("indie_artist_profile");
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Failed to read stored profile:", e);
  }
  return DEFAULT_PROFILE;
}

export function saveStoredProfile(profile: ArtistProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("indie_artist_profile", JSON.stringify(profile));
    openDB().then((db) => {
      const tx = db.transaction("kv_store", "readwrite");
      tx.objectStore("kv_store").put({ id: "artist_profile", value: profile });
    }).catch(() => {});
  } catch (e) {
    console.error("Failed to save profile:", e);
  }
}

export function getStoredSettings(): SettingsState {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem("indie_app_settings");
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Failed to read stored settings:", e);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: SettingsState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("indie_app_settings", JSON.stringify(settings));
    openDB().then((db) => {
      const tx = db.transaction("kv_store", "readwrite");
      tx.objectStore("kv_store").put({ id: "app_settings", value: settings });
    }).catch(() => {});
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

export function getStoredSongs(): SongMetadata[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("indie_songs");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read songs:", e);
  }
  return [];
}

export function saveStoredSongs(songs: SongMetadata[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("indie_songs", JSON.stringify(songs));
    openDB().then((db) => {
      const tx = db.transaction("songs", "readwrite");
      const store = tx.objectStore("songs");
      store.clear();
      for (const song of songs) {
        store.put(song);
      }
    }).catch(() => {});
  } catch (e) {
    console.error("Failed to save songs:", e);
  }
}

export function getStoredFolders(): FolderItem[] {
  if (typeof window === "undefined") return DEFAULT_FOLDERS;
  try {
    const raw = localStorage.getItem("indie_folders");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to read folders:", e);
  }
  return DEFAULT_FOLDERS;
}

export function saveStoredFolders(folders: FolderItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("indie_folders", JSON.stringify(folders));
    openDB().then((db) => {
      const tx = db.transaction("folders", "readwrite");
      const store = tx.objectStore("folders");
      store.clear();
      for (const f of folders) {
        store.put(f);
      }
    }).catch(() => {});
  } catch (e) {
    console.error("Failed to save folders:", e);
  }
}

export function getStoredDocuments(): UploadedDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("indie_documents");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read documents:", e);
  }
  return [];
}

export function saveStoredDocuments(docs: UploadedDocument[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("indie_documents", JSON.stringify(docs));
    openDB().then((db) => {
      const tx = db.transaction("documents", "readwrite");
      const store = tx.objectStore("documents");
      store.clear();
      for (const doc of docs) {
        store.put(doc);
      }
    }).catch(() => {});
  } catch (e) {
    console.error("Failed to save documents:", e);
  }
}

export function getStoredEvents(): ScheduledEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("indie_events");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read events:", e);
  }
  return [];
}

export function saveStoredEvents(events: ScheduledEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("indie_events", JSON.stringify(events));
    openDB().then((db) => {
      const tx = db.transaction("events", "readwrite");
      const store = tx.objectStore("events");
      store.clear();
      for (const evt of events) {
        store.put(evt);
      }
    }).catch(() => {});
  } catch (e) {
    console.error("Failed to save events:", e);
  }
}

export function getStoredChatHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("indie_chat_history");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read chat history:", e);
  }
  return [];
}

export function saveStoredChatHistory(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("indie_chat_history", JSON.stringify(messages));
  } catch (e) {
    console.error("Failed to save chat history:", e);
  }
}

// Reset / Clear all data
export function clearAllVaultData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("indie_songs");
  localStorage.removeItem("indie_documents");
  localStorage.removeItem("indie_events");
  localStorage.removeItem("indie_chat_history");
  localStorage.setItem("indie_folders", JSON.stringify(DEFAULT_FOLDERS));

  openDB().then((db) => {
    const stores = ["songs", "documents", "events", "chat_history"];
    for (const s of stores) {
      try {
        const tx = db.transaction(s, "readwrite");
        tx.objectStore(s).clear();
      } catch {}
    }
  }).catch(() => {});
}

// Export Full Career Archive JSON
export async function exportFullCareerArchiveJSON(): Promise<string> {
  const songs = getStoredSongs();
  const folders = getStoredFolders();
  const documents = getStoredDocuments();
  const events = getStoredEvents();
  const profile = getStoredProfile();
  const settings = getStoredSettings();

  const archive = {
    app: "IndieBrotherhood Career OS",
    version: "2026.1",
    exportedAt: new Date().toISOString(),
    profile,
    settings: {
      ...settings,
      customApiKey: settings.customApiKey ? "REDACTED" : "",
    },
    catalogue: songs,
    folders,
    documents: documents.map((d) => ({
      id: d.id,
      name: d.name,
      folderId: d.folderId,
      size: d.size,
      status: d.status,
      ocrRawText: d.ocrRawText,
      parsedSongMetadata: d.parsedSongMetadata,
      uploadedAt: d.uploadedAt,
    })),
    events,
  };

  return JSON.stringify(archive, null, 2);
}
