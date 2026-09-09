import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";

export interface SealedData {
  v: 1;
  kid: string;
  iv: string;
  data: string;
  tag: string;
  expiresAt: number | null;
}
function keyring() {
  const id = process.env.PRIVATE_DATA_KEY_ID;
  const raw = process.env.PRIVATE_DATA_KEYS_JSON;
  if (!id || !raw)
    throw new Error("Private storage encryption is not configured.");
  let keys: Record<string, string>;
  try {
    keys = JSON.parse(raw);
  } catch {
    throw new Error("Invalid private storage keyring.");
  }
  if (
    !keys ||
    Array.isArray(keys) ||
    typeof keys !== "object" ||
    Object.keys(keys).length > 16
  )
    throw new Error("Invalid private storage keyring.");
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(id) || !keys[id])
    throw new Error("Invalid private storage key ID.");
  for (const [kid, value] of Object.entries(keys)) {
    if (
      !/^[a-zA-Z0-9_-]{1,40}$/.test(kid) ||
      typeof value !== "string" ||
      Buffer.from(value, "base64").length !== 32 ||
      Buffer.from(value, "base64").toString("base64") !== value
    )
      throw new Error("Private storage keys must contain 32 random bytes.");
  }
  return { id, keys };
}
function derive(key: string, context: string) {
  return Buffer.from(
    hkdfSync(
      "sha256",
      Buffer.from(key, "base64"),
      Buffer.from("IndieBrotherhood/private-data/v1"),
      Buffer.from(context),
      32,
    ),
  );
}
export function assertEncryptionConfigured() {
  keyring();
}
export function browserKeys(uid: string) {
  if (!uid || uid === "guest")
    throw new Error("A registered account is required.");
  const { id, keys } = keyring();
  return {
    currentId: id,
    keys: Object.fromEntries(
      Object.entries(keys).map(([kid, key]) => [
        kid,
        derive(key, `browser:${uid}`).toString("base64"),
      ]),
    ),
  };
}
export function sealBytes(
  bytes: Buffer,
  context: string,
  expiresAt: number | null = null,
): SealedData {
  const { id, keys } = keyring();
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    derive(keys[id], `server:${context}`),
    iv,
  );
  cipher.setAAD(Buffer.from(JSON.stringify([1, id, context, expiresAt])));
  const data = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return {
    v: 1,
    kid: id,
    iv: iv.toString("base64"),
    data: data.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    expiresAt,
  };
}
export function openBytes(record: SealedData, context: string): Buffer {
  const { keys } = keyring();
  if (
    record?.v !== 1 ||
    !keys[record.kid] ||
    (record.expiresAt !== null &&
      (!Number.isFinite(record.expiresAt) || record.expiresAt <= Date.now()))
  )
    throw new Error("Private record unavailable or expired.");
  const iv = Buffer.from(record.iv, "base64"),
    tag = Buffer.from(record.tag, "base64");
  if (iv.length !== 12 || tag.length !== 16)
    throw new Error("Invalid encrypted record.");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    derive(keys[record.kid], `server:${context}`),
    iv,
  );
  cipher.setAAD(
    Buffer.from(JSON.stringify([1, record.kid, context, record.expiresAt])),
  );
  cipher.setAuthTag(tag);
  return Buffer.concat([
    cipher.update(Buffer.from(record.data, "base64")),
    cipher.final(),
  ]);
}
export const sealPrivate = (
  value: unknown,
  context: string,
  expiresAt: number | null = null,
) => sealBytes(Buffer.from(JSON.stringify(value)), context, expiresAt);
export const openPrivate = <T = any>(record: SealedData, context: string): T =>
  JSON.parse(openBytes(record, context).toString("utf8"));
