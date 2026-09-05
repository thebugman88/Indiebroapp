import React, { useEffect, useState } from "react";
import {
  legacyPrivacyStatus,
  migrateOwnedBrowserData,
  deleteUnownedBrowserData,
} from "./legacyPrivacy";
export function LegacyPrivacyNotice({ uid }: { uid: string }) {
  const [found, setFound] = useState({ owned: 0, unowned: 0 }),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    void legacyPrivacyStatus(uid)
      .then((s) => {
        if (active) setFound(s);
      })
      .catch(() => {
        if (active) setMessage("Older browser storage could not be checked.");
      });
    return () => {
      active = false;
    };
  }, [uid]);
  const run = async (migrate: boolean) => {
    const question = migrate
      ? "Encrypt older data labelled for this account? Expired lyric history will be removed under the 24-hour policy. Download work you want to keep through the previous version first."
      : "Permanently delete older shared drafts and files from this device for ALL its users? They have no reliable owner label and cannot safely be imported. This cannot be undone.";
    if (!window.confirm(question)) return;
    setBusy(true);
    try {
      if (migrate) await migrateOwnedBrowserData(uid);
      else await deleteUnownedBrowserData();
      setFound(await legacyPrivacyStatus(uid));
      setMessage(
        migrate
          ? "Migration finished. Sign out and sign back in to reload the encrypted workspace."
          : "Older shared data was removed.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Migration stopped.");
    } finally {
      setBusy(false);
    }
  };
  if (!found.owned && !found.unowned && !message) return null;
  return (
    <aside
      role="status"
      className="p-4 bg-amber-950 text-amber-100 text-sm space-y-2"
    >
      {(found.owned > 0 || found.unowned > 0) && (
        <p>
          Older, unencrypted browser data exists. It is not opened
          automatically. Encryption of new saves does not protect those older
          copies.
        </p>
      )}
      {found.owned > 0 && (
        <button
          disabled={busy}
          className="underline mr-4"
          onClick={() => void run(true)}
        >
          Encrypt older data labelled for my account
        </button>
      )}
      {found.unowned > 0 && (
        <button
          disabled={busy}
          className="underline"
          onClick={() => void run(false)}
        >
          Delete unowned shared browser data…
        </button>
      )}
      {message && <p>{message}</p>}
    </aside>
  );
}
