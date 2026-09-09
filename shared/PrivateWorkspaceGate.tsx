import React, { useEffect, useState } from "react";
import { LegacyPrivacyNotice } from "./LegacyPrivacyNotice";
import {
  getCurrentAuthUser,
  retryPrivateUnlock,
  authenticatedFetch,
} from "../src/services/authService";
import { privateStorageStatus, currentPrivateStorage } from "./privateStorage";
export function usePrivateStorage() {
  return useState(() => currentPrivateStorage())[0];
}
export function PrivateWorkspaceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [, refresh] = useState(0);
  useEffect(() => {
    const sync = () => refresh((n) => n + 1);
    const leaving = (e: BeforeUnloadEvent) => {
      const s = privateStorageStatus();
      if (s.pending || s.error) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leaving);
    window.addEventListener("ib_auth_changed", sync);
    window.addEventListener("ib_private_storage_changed", sync);
    return () => {
      window.removeEventListener("beforeunload", leaving);
      window.removeEventListener("ib_auth_changed", sync);
      window.removeEventListener("ib_private_storage_changed", sync);
    };
  }, []);
  const s = privateStorageStatus(),
    user = getCurrentAuthUser();
  if (user.id !== "guest" && (s.status !== "ready" || s.uid !== user.id))
    return (
      <div role="status" className="p-8 text-center text-zinc-200">
        {s.status === "error"
          ? "Encrypted storage is unavailable. Your private workspace stays locked."
          : "Unlocking your encrypted workspace…"}
        <button
          className="block mx-auto mt-3 underline"
          onClick={() => void retryPrivateUnlock()}
        >
          Retry secure unlock
        </button>
        {s.status === "error" && (
          <button
            className="block mx-auto mt-3 underline"
            onClick={() => {
              if (
                !window.confirm(
                  "Request cancellation of your Pro subscription? Active subscriptions end at their current period; delinquent subscriptions are canceled immediately.",
                )
              )
                return;
              void authenticatedFetch("/api/stripe/cancel", { method: "POST" })
                .then(async (response) => {
                  const data = await response.json();
                  window.alert(
                    data.message ||
                      data.error ||
                      "Cancellation was not confirmed.",
                  );
                })
                .catch(() =>
                  window.alert(
                    "Cancellation was not confirmed. Please retry or contact support.",
                  ),
                );
            }}
          >
            Cancel Pro subscription without unlocking storage
          </button>
        )}
      </div>
    );
  return (
    <React.Fragment key={`${user.id}:${s.revision}`}>
      {user.id !== "guest" && <LegacyPrivacyNotice uid={user.id} />}
      {s.error && (
        <div role="alert" className="p-3 bg-red-950 text-red-100">
          {s.error}
        </div>
      )}
      {s.pending > 0 && (
        <div role="status" className="p-2 bg-slate-900 text-slate-200">
          Encrypting and saving changes… Keep this tab open.
        </div>
      )}
      {children}
    </React.Fragment>
  );
}
