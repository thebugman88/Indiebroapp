// Remove only this named Firebase app's older remembered credentials. Creative
// records and other Firebase apps' sign-ins must not be deleted here.
export async function clearLegacyAuthStorage(apiKey: string, appName: string) {
  if (typeof window === "undefined") return;
  const keys = [
    "authUser",
    "redirectUser",
    "persistence",
    "pendingRedirect",
  ].map((kind) => `firebase:${kind}:${apiKey}:${appName}`);
  for (const storage of [window.localStorage, window.sessionStorage])
    for (const key of keys) storage?.removeItem(key);
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve, reject) => {
    let missing = false;
    const request = indexedDB.open("firebaseLocalStorageDb");
    request.onupgradeneeded = () => {
      missing = true;
      request.transaction?.abort();
    };
    request.onerror = () =>
      missing
        ? resolve()
        : reject(new Error("Older sign-in storage could not be cleared."));
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("firebaseLocalStorage")) {
        db.close();
        resolve();
        return;
      }
      const tx = db.transaction("firebaseLocalStorage", "readwrite");
      for (const key of keys)
        tx.objectStore("firebaseLocalStorage").delete(key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onabort = tx.onerror = () => {
        db.close();
        reject(new Error("Older sign-in storage could not be cleared."));
      };
    };
  });
}
