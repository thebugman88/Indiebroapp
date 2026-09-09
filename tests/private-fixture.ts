import {
  lockPrivateStorage,
  unlockPrivateStorage,
  privateStorageStatus,
} from "../shared/privateStorage";
import { browserKeys } from "../server/dataProtection";
export function testEncryptionKeys() {
  process.env.PRIVATE_DATA_KEY_ID = "test";
  process.env.PRIVATE_DATA_KEYS_JSON = JSON.stringify({
    test: Buffer.alloc(32, 71).toString("base64"),
  });
}
export const browserRecords = new Map<string, string>();
export async function testBrowserSession(uid: string) {
  testEncryptionKeys();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => browserRecords.get(k) ?? null,
      setItem: (k: string, v: string) => browserRecords.set(k, v),
      removeItem: (k: string) => browserRecords.delete(k),
      get length() {
        return browserRecords.size;
      },
      key: (i: number) => [...browserRecords.keys()][i] ?? null,
    },
  });
  if (typeof window === "undefined")
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: new EventTarget(),
    });
  lockPrivateStorage();
  if (uid !== "guest")
    await unlockPrivateStorage(
      uid,
      browserKeys(uid),
      privateStorageStatus().revision,
    );
}
