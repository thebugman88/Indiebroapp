import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sealPrivate,
  openPrivate,
  browserKeys,
} from "../server/dataProtection";
import {
  privateStorageFor,
  flushPrivateStorage,
  lockPrivateStorage,
  unlockPrivateStorage,
  privateStorageStatus,
} from "../shared/privateStorage";
import {
  testEncryptionKeys,
  testBrowserSession,
  browserRecords,
} from "./private-fixture";
import { retainLyricPairs } from "../shared/lyricRetention";
import {
  cancellableAttempt,
  CancellationUnconfirmed,
} from "../server/aiCancellation";
import { validateDualLyrics, lyricInput } from "../server/lyricQuality";
import {
  legacyPrivacyStatus,
  migrateOwnedBrowserData,
} from "../shared/legacyPrivacy";
import { createRoyaltyStorage } from "../royalty-and-isrc-metadata-extractor/src/services/storage";
import { openDB } from "idb";
import { structuralThreat } from "../server/securityGuard";
import { bindRequestSession } from "../shared/requestSession";
import { clearLegacyAuthStorage } from "../shared/legacyAuthStorage";

test("server encryption authenticates owner/context, content, expiry and rotation", () => {
  testEncryptionKeys();
  const sealed = sealPrivate({ lyrics: "PRIVATE TEST CONTENT" }, "owner:a");
  assert(!JSON.stringify(sealed).includes("PRIVATE TEST CONTENT"));
  assert.deepEqual(openPrivate(sealed, "owner:a"), {
    lyrics: "PRIVATE TEST CONTENT",
  });
  assert.throws(() => openPrivate(sealed, "owner:b"));
  assert.throws(() =>
    openPrivate(
      { ...sealed, data: Buffer.from("tamper").toString("base64") },
      "owner:a",
    ),
  );
  assert.throws(() =>
    openPrivate({ ...sealed, expiresAt: Date.now() + 10000 }, "owner:a"),
  );
  assert.throws(() =>
    openPrivate(sealPrivate({}, "owner:a", Date.now() - 1), "owner:a"),
  );
  const old = process.env.PRIVATE_DATA_KEYS_JSON;
  process.env.PRIVATE_DATA_KEYS_JSON = JSON.stringify({
    ...JSON.parse(old!),
    next: Buffer.alloc(32, 99).toString("base64"),
  });
  process.env.PRIVATE_DATA_KEY_ID = "next";
  assert.deepEqual(openPrivate(sealed, "owner:a"), {
    lyrics: "PRIVATE TEST CONTENT",
  });
  assert.equal(sealPrivate({}, "owner:a").kid, "next");
  testEncryptionKeys();
});
test("browser disk gets ciphertext only; different and stale sessions cannot read/write another account", async () => {
  await testBrowserSession("browser-a");
  const a = privateStorageFor("browser-a");
  a.setItem("lyrics", "PRIVATE BROWSER SONG");
  await flushPrivateStorage();
  assert(!JSON.stringify([...browserRecords]).includes("PRIVATE BROWSER SONG"));
  assert(
    !JSON.stringify([...browserRecords]).includes(
      browserKeys("browser-a").keys.test,
    ),
  );
  await testBrowserSession("browser-b");
  assert.equal(privateStorageFor("browser-b").getItem("lyrics"), null);
  assert.throws(() => a.getItem("lyrics"));
  assert.throws(() => a.setItem("lyrics", "stale"));
  await testBrowserSession("browser-a");
  assert.equal(
    privateStorageFor("browser-a").getItem("lyrics"),
    "PRIVATE BROWSER SONG",
  );
  assert.throws(() => a.getItem("lyrics"));
  lockPrivateStorage();
  assert.throws(() => privateStorageFor("browser-a").getItem("lyrics"));
});
test("lyric history holds no more than five pairs and never extends generation expiry", () => {
  const now = Date.now(),
    entries = Array.from({ length: 8 }, (_, i) => ({
      id: String(i),
      timestamp: now - i * 1000,
    }));
  assert.equal(retainLyricPairs(entries, now).length, 5);
  assert.equal(retainLyricPairs(entries, now + 86400000).length, 0);
  assert.equal(
    retainLyricPairs([{ id: "future", timestamp: now + 1 }], now).length,
    0,
  );
});
test("timeouts abort and settle before fallback; an abort-ignoring transport stops the chain", async () => {
  let running = 0;
  await assert.rejects(
    () =>
      cancellableAttempt(
        (signal) =>
          new Promise((_resolve, reject) => {
            running++;
            signal.addEventListener("abort", () => {
              running--;
              reject(new Error("aborted"));
            });
          }),
        5,
      ),
    /timeout|aborted/i,
  );
  assert.equal(running, 0);
  await assert.rejects(
    () => cancellableAttempt(() => new Promise(() => {}), 5, undefined, 5),
    CancellationUnconfirmed,
  );
});
test("two-set validation rejects absent, identical and overlapping songs", () => {
  const sections = (prefix: string) => [
    {
      section_name: "Verse",
      lines: Array.from({ length: 24 }, (_, i) => ({
        text: `${prefix}${i} ${prefix}scene ${prefix}detail ${prefix}rhythm ${prefix}image ${prefix}ending`,
      })),
    },
  ];
  const data = {
    song_metadata: { title: "First" },
    lyrics: sections("alpha"),
    alternate_take: { title: "Second", lyrics: sections("bravo") },
  };
  assert.equal(validateDualLyrics(data).length, 2);
  assert.throws(() =>
    validateDualLyrics({ ...data, alternate_take: undefined }),
  );
  assert.throws(() =>
    validateDualLyrics({
      ...data,
      alternate_take: { ...data.alternate_take, lyrics: data.lyrics },
    }),
  );
});
test("security distinguishes attack object keys from harmless lyrics about code", () => {
  assert.equal(
    structuralThreat({
      lyrics: "select your road from the crowd; <script> is just a word here",
    }),
    false,
  );
  assert.equal(
    structuralThreat(JSON.parse('{"nested":{"__proto__":{"admin":true}}}')),
    true,
  );
});
test("a successful unrelated save cannot conceal an earlier failed encrypted write", async () => {
  await testBrowserSession("quota-user");
  const storage = privateStorageFor("quota-user");
  const original = localStorage.setItem;
  localStorage.setItem = (key, value) => {
    if (key.endsWith(":lost")) throw new Error("Quota");
    original(key, value);
  };
  storage.setItem("lost", "work");
  await assert.rejects(flushPrivateStorage);
  storage.setItem("other", "saved");
  await assert.rejects(flushPrivateStorage);
  localStorage.setItem = original;
  storage.setItem("lost", "work");
  await flushPrivateStorage();
  assert.equal(privateStorageStatus().error, "");
});
test("legacy recovery encrypts only labelled account records and never imports shared drafts", async () => {
  const uid = "migration-owner";
  await testBrowserSession(uid);
  localStorage.setItem("indie_scratchpad_lyrics", "UNOWNED OTHER ARTIST");
  localStorage.setItem(
    `ib_profile_details_v3:${uid}`,
    JSON.stringify({ bio: "PRIVATE LEGACY BIO" }),
  );
  const legacy = await openDB(`royalty_isrc_extractor_v2:${uid}`, 1, {
    upgrade(db) {
      db.createObjectStore("files", { keyPath: "id" });
    },
  });
  await legacy.put("files", { id: "file-1", dataUrl: "PRIVATE FILE BYTES" });
  legacy.close();
  await migrateOwnedBrowserData(uid);
  assert.equal(localStorage.getItem(`ib_profile_details_v3:${uid}`), null);
  assert.equal(privateStorageFor(uid).getItem("indie_scratchpad_lyrics"), null);
  assert.equal(
    localStorage.getItem("indie_scratchpad_lyrics"),
    "UNOWNED OTHER ARTIST",
  );
  assert(!JSON.stringify([...browserRecords]).includes("PRIVATE LEGACY BIO"));
  assert.equal(
    (await createRoyaltyStorage(uid, () => true).getAllFiles())[0].dataUrl,
    "PRIVATE FILE BYTES",
  );
  const disk = await openDB(`ib-encrypted-files-v1:${uid}`);
  assert(
    !JSON.stringify(await disk.getAll("records")).includes(
      "PRIVATE FILE BYTES",
    ),
  );
  disk.close();
  assert.equal((await legacyPrivacyStatus(uid)).owned, 0);
});
test("lyric inputs enforce bounded strings and known modes before provider work", () => {
  assert.throws(() => lyricInput({ userLyrics: "x".repeat(20001) }));
  assert.throws(() => lyricInput({ customGenre: { text: "not text" } }));
  assert.throws(() => lyricInput({ mode: "bypass" }));
  assert.throws(() => lyricInput({ explicit: "false" }));
  assert.equal(lyricInput({ genre: "Rock", explicit: false }).genre, "Rock");
});
test("late network responses are rejected after account switch and after returning to the same account", async () => {
  const alice = { uid: "alice" };
  let user = alice,
    revision = 1;
  const bound = bindRequestSession(
    () => user,
    () => revision,
  );
  let resolve!: (v: string) => void;
  const pending = bound(
    () =>
      new Promise<string>((r) => {
        resolve = r;
      }),
  );
  user = { uid: "bob" };
  revision++;
  resolve("PRIVATE ALICE RESPONSE");
  await assert.rejects(() => pending, /Account changed/);
  user = alice;
  revision++;
  let called = false;
  await assert.rejects(() =>
    bound(async () => {
      called = true;
      return "private";
    }),
  );
  assert.equal(called, false);
});
test("credential cleanup removes only this Firebase app and preserves creative data and other apps", async () => {
  await testBrowserSession("auth-cleanup");
  const own = "firebase:authUser:test-api:suite-auth",
    other = "firebase:authUser:other-api:other-app";
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: localStorage,
  });
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: localStorage,
  });
  localStorage.setItem(own, "old credential");
  localStorage.setItem(other, "other credential");
  localStorage.setItem("creative-draft", "work");
  const db = await openDB("firebaseLocalStorageDb", 1, {
    upgrade(d) {
      d.createObjectStore("firebaseLocalStorage", { keyPath: "fbase_key" });
    },
  });
  await db.put("firebaseLocalStorage", {
    fbase_key: own,
    value: "old credential",
  });
  await db.put("firebaseLocalStorage", {
    fbase_key: other,
    value: "other credential",
  });
  await clearLegacyAuthStorage("test-api", "suite-auth");
  assert.equal(localStorage.getItem(own), null);
  assert.equal(localStorage.getItem(other), "other credential");
  assert.equal(localStorage.getItem("creative-draft"), "work");
  assert.equal(await db.get("firebaseLocalStorage", own), undefined);
  assert.equal(
    (await db.get("firebaseLocalStorage", other)).value,
    "other credential",
  );
  db.close();
});
