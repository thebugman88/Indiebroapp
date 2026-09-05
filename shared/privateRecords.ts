import { openDB } from "idb";
import { encryptBrowserValue, decryptBrowserValue } from "./privateStorage";

export function createPrivateRecords(
  uid: string,
  isCurrent: () => boolean,
  open: typeof openDB = openDB,
) {
  const check = () => {
    if (!isCurrent())
      throw new Error("Account changed. Reopen your workspace.");
    if (!uid || uid === "guest")
      throw new Error("Sign in before saving private files.");
  };
  const db = () => {
    check();
    return open(`ib-encrypted-files-v1:${encodeURIComponent(uid)}`, 1, {
      upgrade(d) {
        d.createObjectStore("records");
      },
    });
  };
  const key = (store: string, id: string) => `${store}:${id}`;
  const decode = async (name: string, value: any) => {
    const bytes = await decryptBrowserValue(uid, name, value);
    check();
    return JSON.parse(new TextDecoder().decode(bytes));
  };
  return {
    async all<T>(store: string): Promise<T[]> {
      const d = await db();
      check();
      const tx = d.transaction("records");
      const range = IDBKeyRange.bound(`${store}:`, `${store}:\uffff`);
      const [keys, values] = await Promise.all([
        tx.store.getAllKeys(range),
        tx.store.getAll(range),
      ]);
      await tx.done;
      return Promise.all(values.map((v, i) => decode(String(keys[i]), v)));
    },
    async get<T>(store: string, id: string): Promise<T | undefined> {
      const d = await db();
      check();
      const name = key(store, id),
        v = await d.get("records", name);
      return v === undefined ? undefined : decode(name, v);
    },
    async batch(
      changes: Array<{
        store: string;
        id: string;
        value?: unknown;
        remove?: boolean;
      }>,
    ) {
      check();
      const prepared = await Promise.all(
        changes.map(async (c) => ({
          ...c,
          key: key(c.store, c.id),
          sealed: c.remove
            ? undefined
            : await encryptBrowserValue(
                uid,
                key(c.store, c.id),
                new TextEncoder().encode(JSON.stringify(c.value)),
              ),
        })),
      );
      const d = await db();
      check();
      const tx = d.transaction("records", "readwrite");
      for (const c of prepared) {
        if (c.remove) tx.store.delete(c.key);
        else tx.store.put(c.sealed, c.key);
      }
      await tx.done;
      check();
    },
    async clear(stores: string[]) {
      const d = await db();
      check();
      const tx = d.transaction("records", "readwrite");
      for (const store of stores)
        tx.store.delete(IDBKeyRange.bound(`${store}:`, `${store}:\uffff`));
      await tx.done;
      check();
    },
  };
}
