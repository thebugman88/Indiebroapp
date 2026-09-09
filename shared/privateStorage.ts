// Keys arrive over authenticated HTTPS and are imported as non-extractable
// CryptoKeys. Neither keys nor plaintext are written to browser persistence.
type Material = { currentId: string; keys: Record<string, string> };
type Envelope = {
  v: 1;
  kid: string;
  iv: string;
  data: string;
  expiresAt: number | null;
};
type Session = {
  uid: string;
  revision: number;
  currentId: string;
  keys: Map<string, CryptoKey>;
  values: Map<string, string>;
  queue: Promise<void>;
  errors: Map<string, string>;
  pending: number;
};
let revision = 0;
let session: Session | null = null;
let status: "locked" | "loading" | "ready" | "error" = "locked";
const prefix = "ib_encrypted_v1:";
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const b64 = (bytes: Uint8Array) => {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
};
const unb64 = (text: string) =>
  Uint8Array.from(atob(text), (x) => x.charCodeAt(0));
const changed = () => {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("ib_private_storage_changed"));
};
export const privateStorageStatus = () => ({
  uid: session?.uid || "guest",
  revision,
  status,
  error: session?.errors.values().next().value || "",
  pending: session?.pending || 0,
});
export function lockPrivateStorage() {
  revision++;
  session = null;
  status = "locked";
  changed();
}
export function failPrivateStorage() {
  status = "error";
  changed();
}
function assertSession(s: Session) {
  if (session !== s || status !== "ready")
    throw new Error("Private storage is locked or the account changed.");
}
const recordKey = (uid: string, key: string) =>
  `${prefix}${encodeURIComponent(uid)}:${encodeURIComponent(key)}`;
const aad = (
  uid: string,
  key: string,
  e: Pick<Envelope, "kid" | "expiresAt">,
) => encoder.encode(JSON.stringify([1, uid, key, e.kid, e.expiresAt]));
export async function unlockPrivateStorage(
  uid: string,
  material: Material,
  expectedRevision: number,
) {
  if (revision !== expectedRevision) return;
  status = "loading";
  changed();
  const s: Session = {
    uid,
    revision,
    currentId: material.currentId,
    keys: new Map(),
    values: new Map(),
    queue: Promise.resolve(),
    errors: new Map(),
    pending: 0,
  };
  for (const [id, raw] of Object.entries(material.keys))
    s.keys.set(
      id,
      await crypto.subtle.importKey("raw", unb64(raw), "AES-GCM", false, [
        "encrypt",
        "decrypt",
      ]),
    );
  if (!s.keys.has(s.currentId))
    throw new Error("Private storage key unavailable.");
  const partition = `${prefix}${encodeURIComponent(uid)}:`;
  for (let i = 0; i < localStorage.length; i++) {
    const name = localStorage.key(i)!;
    if (!name.startsWith(partition)) continue;
    const key = decodeURIComponent(name.slice(partition.length));
    const e: Envelope = JSON.parse(localStorage.getItem(name)!);
    if (e.expiresAt !== null && e.expiresAt <= Date.now()) continue;
    if (e.v !== 1 || !s.keys.has(e.kid))
      throw new Error("Encrypted storage could not be unlocked.");
    const value = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: unb64(e.iv), additionalData: aad(uid, key, e) },
      s.keys.get(e.kid)!,
      unb64(e.data),
    );
    s.values.set(key, decoder.decode(value));
  }
  if (revision !== expectedRevision) return;
  session = s;
  status = "ready";
  changed();
  // Expired ciphertext is removed on the next active session; it is never read.
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const name = localStorage.key(i)!;
    if (name.startsWith(partition)) {
      const e: Envelope = JSON.parse(localStorage.getItem(name)!);
      if (e.expiresAt !== null && e.expiresAt <= Date.now())
        localStorage.removeItem(name);
    }
  }
}
export function privateStorageFor(uid: string) {
  const s = session;
  if (!uid || uid === "guest")
    return {
      getItem: (_key: string) => null,
      setItem: () => {
        throw new Error("Sign in before saving private data.");
      },
      removeItem: () => {
        throw new Error("Sign in before changing private data.");
      },
    };
  const check = () => {
    if (!s || s.uid !== uid) throw new Error("Private storage is locked.");
    assertSession(s);
    return s;
  };
  return {
    getItem(key: string) {
      return check().values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      const owner = check();
      // Reject oversized browser snapshots instead of unbounded memory growth.
      if (encoder.encode(value).byteLength > 8_000_000)
        throw new Error(
          "Private browser storage limit exceeded. Download this file instead.",
        );
      owner.values.set(key, String(value));
      owner.pending++;
      changed();
      owner.queue = owner.queue
        .then(async () => {
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const e: Envelope = {
            v: 1,
            kid: owner.currentId,
            iv: b64(iv),
            data: "",
            expiresAt:
              key.startsWith("lyric_pro_vault_") &&
              !key.includes(":guidelines") &&
              !key.includes(":notice")
                ? Date.now() + 86400000
                : null,
          };
          const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv, additionalData: aad(uid, key, e) },
            owner.keys.get(e.kid)!,
            encoder.encode(String(value)),
          );
          e.data = b64(new Uint8Array(encrypted));
          localStorage.setItem(recordKey(uid, key), JSON.stringify(e));
          owner.errors.delete(key);
        })
        .catch(() => {
          owner.errors.set(
            key,
            "Private data could not be saved. Download your work before leaving.",
          );
        })
        .finally(() => {
          owner.pending--;
          changed();
        });
    },
    removeItem(key: string) {
      const owner = check();
      owner.values.delete(key);
      owner.pending++;
      changed();
      owner.queue = owner.queue
        .then(() => {
          localStorage.removeItem(recordKey(uid, key));
          owner.errors.delete(key);
        })
        .catch(() => {
          owner.errors.set(key, "Private data could not be deleted.");
        })
        .finally(() => {
          owner.pending--;
          changed();
        });
    },
  };
}
export async function flushPrivateStorage() {
  const s = session;
  if (s) {
    while (s.pending) await s.queue;
    const error = s.errors.values().next().value;
    if (error) throw new Error(error);
  }
}
export function currentPrivateStorage() {
  return privateStorageFor(session?.uid || "guest");
}
export async function encryptBrowserValue(
  uid: string,
  key: string,
  bytes: Uint8Array,
): Promise<Envelope> {
  const s = session;
  if (!s || s.uid !== uid) throw new Error("Private storage locked.");
  assertSession(s);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const e: Envelope = {
    v: 1,
    kid: s.currentId,
    iv: b64(iv),
    data: "",
    expiresAt: null,
  };
  e.data = b64(
    new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: aad(uid, key, e) },
        s.keys.get(e.kid)!,
        bytes,
      ),
    ),
  );
  assertSession(s);
  return e;
}
export async function decryptBrowserValue(
  uid: string,
  key: string,
  e: Envelope,
): Promise<Uint8Array> {
  const s = session;
  if (!s || s.uid !== uid) throw new Error("Private storage locked.");
  assertSession(s);
  if (e.v !== 1 || !s.keys.has(e.kid))
    throw new Error("Private record unavailable.");
  const result = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(e.iv), additionalData: aad(uid, key, e) },
    s.keys.get(e.kid)!,
    unb64(e.data),
  );
  assertSession(s);
  return new Uint8Array(result);
}
