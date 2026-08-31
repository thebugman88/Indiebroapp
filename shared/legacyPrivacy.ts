import { openDB } from "idb";
import {
  privateStorageFor,
  privateStorageStatus,
  flushPrivateStorage,
} from "./privateStorage";
import { createPrivateRecords } from "./privateRecords";
import { retainLyricPairs } from "./lyricRetention";
import { withoutProviderCredentials } from "./browserSettings";

const unownedKeys = [
  "indie_scratchpad_lyrics",
  "indie_split_sheet_meta",
  "indie_split_sheet_collabs",
  "indie_track_metadata",
  "indie_smart_link_data",
  "sonic_iq_lab_user_stats_vault_2026",
  "lyric_pro_user_stats_vault_2026",
  "lyric_pro_saved_history",
  "lyric_pro_vault",
  "ib_admin_activity_logs_v2",
  "ib_admin_user_overrides_v2",
  "ib_gamification_profile_v2",
  "ib_notifications_feed_v2",
  "lyric_pro_projects",
  "indie_lyric_scratchpad",
  "ib_artist_verified_catalog_v2",
  "royalty_extractor_history",
  "indie_split_sheets",
  "hit_analyzer_history",
  "hangout_battles_history",
  "judgement_zone_user_reviews",
  "soniciq_quiz_history",
  "meeting_room_minutes_history",
  "semantic_lab_history",
];
const ownedKeys = (uid: string) =>
  [
    "ib_artist_catalog_v3",
    "ib_career_v2",
    "lyric_pro_vault_v2",
    "ib_profile_details_v3",
  ].map((k) => `${k}:${encodeURIComponent(uid)}`);
const legacyDb = (uid: string) =>
  `royalty_isrc_extractor_v2:${encodeURIComponent(uid)}`;
export async function legacyPrivacyStatus(uid: string) {
  if (!uid || uid === "guest") return { owned: 0, unowned: 0 };
  const databases =
    typeof indexedDB.databases === "function"
      ? await indexedDB.databases()
      : [];
  let hasLegacyFiles = false;
  if (databases.some((d) => d.name === legacyDb(uid))) {
    const db = await openDB(legacyDb(uid));
    try {
      for (const store of Array.from(db.objectStoreNames))
        if (await db.count(store)) hasLegacyFiles = true;
    } finally {
      db.close();
    }
  }
  return {
    owned:
      ownedKeys(uid).filter((k) => localStorage.getItem(k) !== null).length +
      (hasLegacyFiles ? 1 : 0),
    unowned:
      unownedKeys.filter((k) => localStorage.getItem(k) !== null).length +
      (databases.some((d) => d.name === "royalty_isrc_extractor_db") ? 1 : 0),
  };
}
// Explicit user action only. Never infer an owner for unlabelled shared data.
export async function migrateOwnedBrowserData(uid: string) {
  const revision = privateStorageStatus().revision;
  const current = () => {
    const s = privateStorageStatus();
    return s.uid === uid && s.revision === revision && s.status === "ready";
  };
  const check = () => {
    if (!current()) throw new Error("Account changed. Migration stopped.");
  };
  check();
  const destination = privateStorageFor(uid);
  for (const key of ownedKeys(uid)) {
    check();
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    let value = JSON.parse(raw);
    if (value?.ownerUid && value.ownerUid !== uid)
      throw new Error("Legacy ownership mismatch. No import allowed.");
    if (key.startsWith("lyric_pro_vault_")) value = retainLyricPairs(value);
    if (key.startsWith("ib_career_"))
      value = {
        ...value,
        snapshot: {
          ...value.snapshot,
          settings: withoutProviderCredentials(value.snapshot.settings),
        },
      };
    const serialized = JSON.stringify(value),
      existing = destination.getItem(key);
    if (existing !== null && existing !== serialized)
      throw new Error(
        "New and old saved work conflict. Nothing was overwritten; recover this account manually.",
      );
    destination.setItem(key, serialized);
    await flushPrivateStorage();
    check();
    if (localStorage.getItem(key) !== raw)
      throw new Error(
        "Older data changed during migration. Its plaintext copy was retained.",
      );
    localStorage.removeItem(key);
  }
  const databases =
    typeof indexedDB.databases === "function"
      ? await indexedDB.databases()
      : [];
  if (!databases.some((d) => d.name === legacyDb(uid))) return;
  const legacy = await openDB(legacyDb(uid));
  check();
  const records = createPrivateRecords(uid, current);
  try {
    for (const store of ["folders", "files", "tracks", "settings"]) {
      if (!legacy.objectStoreNames.contains(store)) continue;
      for (const id of await legacy.getAllKeys(store)) {
        check();
        const original = await legacy.get(store, id);
        if (original === undefined) continue;
        const value =
          store === "settings"
            ? withoutProviderCredentials(original)
            : original;
        const existing = await records.get(store, String(id));
        if (
          existing !== undefined &&
          JSON.stringify(existing) !== JSON.stringify(value)
        )
          throw new Error(
            "New and old private files conflict. Nothing was overwritten.",
          );
        await records.batch([{ store, id: String(id), value }]);
        if (
          JSON.stringify(await records.get(store, String(id))) !==
          JSON.stringify(value)
        )
          throw new Error("Encrypted file verification failed.");
        check();
        const tx = legacy.transaction(store, "readwrite");
        if (
          JSON.stringify(await tx.store.get(id)) !== JSON.stringify(original)
        ) {
          tx.abort();
          await tx.done.catch(() => {});
          throw new Error("Older file changed during migration.");
        }
        await tx.store.delete(id);
        await tx.done;
      }
    }
  } finally {
    legacy.close();
  }
}
export async function deleteUnownedBrowserData() {
  // The calling UI must obtain explicit destructive confirmation first.
  for (const key of unownedKeys) localStorage.removeItem(key);
  if (
    typeof indexedDB.databases === "function" &&
    (await indexedDB.databases()).some(
      (d) => d.name === "royalty_isrc_extractor_db",
    )
  ) {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("royalty_isrc_extractor_db");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Could not remove old files."));
      request.onblocked = () =>
        reject(new Error("Close older app tabs before removing old files."));
    });
  }
}
