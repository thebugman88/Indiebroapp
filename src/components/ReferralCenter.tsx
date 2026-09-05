import React, { useEffect, useRef, useState } from "react";
import {
  authenticatedFetch,
  getCurrentAuthUser,
  saveCurrentAuthUser,
} from "../services/authService";
import { privateStorageStatus } from "../../shared/privateStorage";
import {
  COMMUNITY_ROLES,
  EMPTY_COMMUNITY_PROFILE,
  REFERRAL_MILESTONES,
  REFERRAL_RULES,
  REFERRAL_RULES_VERSION,
  profileChecklist,
  type CommunityProfile,
} from "../../shared/referrals";
import {
  pendingReferralInvite,
  clearReferralInvite,
} from "../../shared/referralInvite";
const button =
  "rounded-xl bg-amber-400 px-4 py-2 font-bold text-zinc-950 disabled:opacity-40";
const field =
  "w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white";
export function CommunityProgressPrompt({ onOpen }: { onOpen: () => void }) {
  const [count, setCount] = useState<number | null>(null),
    uid = getCurrentAuthUser().id;
  useEffect(() => {
    let active = true;
    const read = () => {
      void authenticatedFetch("/api/community/profile")
        .then(async (r) => {
          if (!r.ok) return;
          const d = await r.json();
          if (active && getCurrentAuthUser().id === uid)
            setCount(Object.values(d.checklist).filter(Boolean).length);
        })
        .catch(() => {});
    };
    read();
    window.addEventListener("ib_community_changed", read);
    return () => {
      active = false;
      window.removeEventListener("ib_community_changed", read);
    };
  }, [uid]);
  if (uid === "guest") return null;
  return (
    <button
      onClick={onOpen}
      className="mx-auto block w-full max-w-7xl rounded-xl border border-amber-500/30 bg-zinc-900 px-5 py-3 text-left text-sm text-zinc-200"
    >
      <strong className="text-amber-300">
        {count === 6 ? "Invite & Earn" : "Complete your community profile"}
      </strong>{" "}
      ·{" "}
      {count === null
        ? "Verify your email to get started."
        : `${count}/6 profile steps complete. Earn rewards by welcoming active artists.`}
    </button>
  );
}
export function ReferralCenter({ onClose }: { onClose: () => void }) {
  const uid = getCurrentAuthUser().id,
    version = useRef(privateStorageStatus().revision),
    alive = useRef(true);
  const [data, setData] = useState<any>(null),
    [profile, setProfile] = useState<CommunityProfile>({
      ...EMPTY_COMMUNITY_PROFILE,
    });
  const [code, setCode] = useState(() => pendingReferralInvite(uid)),
    [accepted, setAccepted] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [reviews, setReviews] = useState<any[]>([]);
  const current = () =>
    alive.current &&
    uid === getCurrentAuthUser().id &&
    version.current === privateStorageStatus().revision;
  async function request(url: string, method = "GET", body?: any) {
    if (!current()) throw new Error("Account changed.");
    const r = await authenticatedFetch(url, {
      method,
      ...(body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
    const d = await r.json();
    if (!current()) throw new Error("Account changed.");
    if (!r.ok) throw new Error(d.error || "Request unavailable.");
    return d;
  }
  async function load() {
    const d = await request("/api/referrals/status");
    if (current()) {
      setData(d);
      setProfile(d.profile);
    }
  }
  useEffect(() => {
    alive.current = true;
    void load().catch((e) => {
      if (current()) setMessage(e.message);
    });
    return () => {
      alive.current = false;
    };
  }, []);
  async function action(fn: () => Promise<any>) {
    if (!current()) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await fn();
      if (!current()) return;
      setMessage(
        result?.message ||
          (
            {
              qualified:
                "Referral verified! Your welcome badge and Coins are recorded.",
              awaiting_review:
                "Activity complete. Rewards are awaiting anti-abuse review.",
              pending: "Keep going: your checklist shows what remains.",
              daily_limit:
                "The daily reward limit was reached. Check again tomorrow (UTC).",
              rejected: "This referral was not approved.",
              capped: "This inviter has reached the ten-referral reward limit.",
            } as any
          )[result?.status] ||
          "Saved.",
      );
      await load();
      if (current()) window.dispatchEvent(new Event("ib_community_changed"));
    } catch (e) {
      if (current()) setMessage((e as Error).message);
    } finally {
      if (current()) setBusy(false);
    }
  }
  const checks = profileChecklist(profile),
    complete = Object.values(checks).filter(Boolean).length;
  const url = data?.code
    ? `${window.location.origin}/?ref=${encodeURIComponent(data.code)}#hub`
    : "";
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 p-3">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="referral-title"
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-amber-500/30 bg-zinc-950 p-5 text-zinc-200 sm:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="referral-title" className="text-2xl font-bold text-amber-300">
            Your community · Invite & Earn
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-3 py-2"
            aria-label="Close referral center"
          >
            Close
          </button>
        </div>
        <p className="my-3 text-sm text-zinc-400">
          All tools stay available. Completing this profile and referral
          checklist earns community rewards; it does not unlock basic access.
        </p>
        <form
          className="space-y-4 rounded-2xl border border-zinc-800 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void action(async () => {
              await request("/api/community/profile", "PUT", profile);
              if (current())
                saveCurrentAuthUser({
                  ...getCurrentAuthUser(),
                  displayName: profile.displayName,
                  artistHandle: profile.handle,
                  bio: profile.bio,
                });
              return { message: "Private community profile saved." };
            });
          }}
        >
          <h3 className="font-bold">Profile completion · {complete}/6</h3>
          <progress
            aria-label="Profile completion"
            value={complete}
            max={6}
            className="w-full accent-amber-400"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {(["displayName", "handle", "genre"] as const).map((k) => (
              <label key={k} className="text-sm">
                {
                  {
                    displayName: "Artist / display name",
                    handle: "Display handle (3–24 letters, numbers or _)",
                    genre: "Your main genre",
                  }[k]
                }
                <input
                  className={field}
                  value={profile[k]}
                  maxLength={k === "handle" ? 24 : 80}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      [k]:
                        k === "handle"
                          ? e.target.value.toLowerCase()
                          : e.target.value,
                    }))
                  }
                />
              </label>
            ))}
            <label className="text-sm">
              Your role
              <select
                className={field}
                value={profile.role}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, role: e.target.value }))
                }
              >
                {COMMUNITY_ROLES.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            Tell us about your music (20–1,000 characters)
            <textarea
              className={field}
              value={profile.bio}
              maxLength={1000}
              onChange={(e) =>
                setProfile((p) => ({ ...p, bio: e.target.value }))
              }
            />
          </label>
          <label className="block text-sm">
            What would you like to accomplish? (10–300 characters)
            <textarea
              className={field}
              value={profile.goal}
              maxLength={300}
              onChange={(e) =>
                setProfile((p) => ({ ...p, goal: e.target.value }))
              }
            />
          </label>
          <p className="text-xs text-zinc-400">
            Saved encrypted and private to your account. No legal name, address,
            photo or social-media account required. A display handle is not
            proof of identity; your unique referral code identifies invitations.
          </p>
          <button disabled={busy || uid === "guest"} className={button}>
            Save profile
          </button>
        </form>
        {data && !data.enabled && (
          <p className="my-4 rounded-xl border border-amber-500/40 p-4 text-amber-200">
            Referral rewards are not enabled yet. Your profile can be completed
            now; no reward is promised until the program opens.
          </p>
        )}
        <div className="my-5 space-y-3 rounded-2xl border border-zinc-800 p-4">
          <h3 className="font-bold">How a new member qualifies</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>
              Join using an existing invitation and attach its code within seven
              days of creating the account.
            </li>
            <li>Verify email and complete the private profile above.</li>
            <li>
              Use two different cloud tools successfully across two UTC calendar
              days, spending at least 10 BC in total. For example: Lyric Pro (10
              BC) and Sonic IQ (0 BC). Included Coins count—no purchase needed.
            </li>
            <li>
              Reach 48 hours of account age, then check qualification below.
              Failed/refunded jobs, old activity and browser clicks do not
              count.
            </li>
          </ol>
          <p className="text-sm">
            Each qualifying new member gets{" "}
            <strong>20 BC and a welcome badge</strong>. Your first ten qualified
            referrals earn the milestones below. No self-referrals, duplicate
            reward identities or account farming.
          </p>
          <p className="text-xs text-zinc-400">
            Joining uses Google reCAPTCHA Enterprise/App Check and a 90-day
            first-party device cookie to help detect abuse. We retain keyed
            email/device identifiers and reward records; we do not expose your
            profile, lyrics or task details to your inviter. Shared devices go
            to review, not an automatic permanent ban. These checks cannot prove
            every account is a different human.
          </p>
          {!data?.code && (
            <>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                I accept these referral rules and the anti-abuse checks.
              </label>
              <button
                disabled={busy || !accepted || !data?.enabled || complete !== 6}
                className={button}
                onClick={() =>
                  void action(() =>
                    request("/api/referrals/enroll", "POST", {
                      accepted: true,
                      rulesVersion: REFERRAL_RULES_VERSION,
                    }),
                  )
                }
              >
                Create my unique referral code
              </button>
            </>
          )}
          {data?.code && (
            <>
              <p>
                Your code:{" "}
                <strong className="break-all font-mono text-amber-300">
                  {data.code}
                </strong>
              </p>
              <input
                aria-label="Your invitation link"
                className={field}
                value={url}
                readOnly
                onFocus={(e) => e.target.select()}
              />
              <button
                className={button}
                onClick={() => {
                  void navigator.clipboard
                    .writeText(url)
                    .then(() => {
                      if (current()) setMessage("Invitation link copied.");
                    })
                    .catch(() => {
                      if (current())
                        setMessage(
                          "Select and copy the invitation link above.",
                        );
                    });
                }}
              >
                Copy invitation link
              </button>
            </>
          )}
        </div>
        {data?.code && !data.claim && (
          <div className="space-y-3 rounded-xl border border-zinc-800 p-4">
            <label className="block">
              Were you invited? Enter their code
              <input
                className={field}
                value={code}
                maxLength={24}
                autoComplete="off"
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </label>
            <button
              disabled={busy || !data.enabled || !/^[A-F0-9]{24}$/.test(code)}
              className={button}
              onClick={() =>
                void action(async () => {
                  const d = await request("/api/referrals/claim", "POST", {
                    code,
                  });
                  clearReferralInvite(uid);
                  return d;
                })
              }
            >
              Attach this invitation permanently
            </button>
            <p className="text-xs text-zinc-400">
              The invitation must predate your account. One inviter per new
              account; it cannot be changed afterward. Activity begins counting
              once attached.
            </p>
          </div>
        )}
        {data?.claim && (
          <div className="my-4 space-y-2 rounded-xl border border-zinc-800 p-4">
            <h3 className="font-bold">
              Your welcome reward · {data.claim.status.replaceAll("_", " ")}
            </h3>
            <p className="text-sm">
              Profile{" "}
              {data.progress.profileComplete ? "complete" : "incomplete"} ·{" "}
              {Math.min(2, data.progress.tools)}/2 tools ·{" "}
              {Math.min(2, data.progress.activeDays)}/2 days ·{" "}
              {data.progress.spent}/10 BC ·{" "}
              {data.progress.ageReady
                ? "48-hour wait complete"
                : `Account eligible after ${new Date(data.progress.eligibleAt).toLocaleString()}`}
            </p>
            {!["qualified", "rejected", "capped"].includes(
              data.claim.status,
            ) && (
              <button
                className={button}
                disabled={busy || !data.enabled}
                onClick={() =>
                  void action(() =>
                    request("/api/referrals/qualify", "POST", {}),
                  )
                }
              >
                Check activity & claim reward
              </button>
            )}
            <p className="text-xs text-zinc-400">
              {data.automaticRewards
                ? "Eligible low-risk referrals can be rewarded automatically; flagged claims need review."
                : "Reward payouts require an administrator’s review during the initial rollout."}{" "}
              Limits: two rewards per inviter/day, 25 across the program/day;
              reaching a daily limit delays payout, not account access.
            </p>
          </div>
        )}
        <div className="my-5 space-y-3">
          <h3 className="text-xl font-bold">
            {data?.qualified || 0}/10 qualified referrals · {data?.points || 0}{" "}
            verified community points
          </h3>
          <p className="text-sm">
            {data?.pending || 0} pending · {data?.coins || 0} referral BC
            awarded. Points are a community score, not spendable Coins or local
            XP.
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(data?.badges || {}).map((name) => (
              <span
                key={name}
                className="rounded-full border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-sm text-amber-200"
              >
                ★ {name}
              </span>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="p-2">Qualified referrals</th>
                  <th>BC</th>
                  <th>Points</th>
                  <th>Free Pro</th>
                  <th>Badge</th>
                </tr>
              </thead>
              <tbody>
                {REFERRAL_MILESTONES.map((m) => (
                  <tr key={m.count} className="border-b border-zinc-800">
                    <td className="p-2">
                      {m.count}
                      {data?.qualified >= m.count ? " ✓" : ""}
                    </td>
                    <td>{m.coins}</td>
                    <td>{m.points}</td>
                    <td>{m.proDays ? `${m.proDays} days` : "—"}</td>
                    <td>{m.badge || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-400">
            Rewards are added once at each milestone, not recalculated on every
            visit. Ten qualified referrals is the lifetime reward cap for this
            program version.
          </p>
          <div className="rounded-xl border border-amber-400/30 p-4">
            <h4 className="font-bold">
              {data?.proDaysAvailable || 0} earned Pro days ready to activate
            </h4>
            <p className="my-2 text-sm">
              No card, billing changes or automatic renewal. Save these days
              while a subscription or other Pro access is active. Activation
              adds 45 BC per awarded day (315 for a week, 630 for two weeks,
              1,350 for 30 days), plus 10 GB base storage and Pro purchase
              bonuses for that period. Your regular free monthly allowance
              continues; short rewards do not each grant another 1,500-BC
              refill. Files are not deleted when Pro ends.
            </p>
            <button
              disabled={busy || !data?.enabled || !data?.proDaysAvailable}
              className={button}
              onClick={() => {
                if (
                  window.confirm(
                    `Activate all ${data.proDaysAvailable} earned Pro days now? No charge or subscription will be created.`,
                  )
                )
                  void action(() =>
                    request("/api/referrals/activate-pro", "POST", {}),
                  );
              }}
            >
              Activate earned Pro time
            </button>
          </div>
        </div>
        {getCurrentAuthUser().isAdmin && (
          <div className="space-y-3 border-t border-zinc-700 pt-4">
            <h3 className="font-bold">Administrator · Referral review queue</h3>
            <button
              className={button}
              disabled={busy}
              onClick={() =>
                void action(async () => {
                  const d = await request("/api/referrals/admin/reviews");
                  setReviews(d.reviews);
                  return {
                    message:
                      "Review queue loaded. Verify legitimacy before approval.",
                  };
                })
              }
            >
              Load pending reviews
            </button>
            {reviews.map((r) => (
              <div
                key={r.uid}
                className="rounded-lg border border-zinc-700 p-3 text-sm"
              >
                <p className="break-all">
                  New member: {r.uid} · Inviter: {r.referrer}
                </p>
                <div className="mt-2 flex gap-3">
                  {["approve", "reject"].map((decision) => (
                    <button
                      key={decision}
                      className={button}
                      disabled={busy}
                      onClick={() => {
                        const reason = window.prompt(
                          "Record the evidence for this referral decision (at least 10 characters). Do not enter private lyrics or personal documents.",
                        );
                        if (reason)
                          void action(async () => {
                            const d = await request(
                              `/api/referrals/admin/${encodeURIComponent(r.uid)}/review`,
                              "POST",
                              { decision, reason },
                            );
                            if (
                              ["qualified", "rejected", "capped"].includes(
                                d.status,
                              )
                            )
                              setReviews((v) =>
                                v.filter((x) => x.uid !== r.uid),
                              );
                            return d;
                          });
                      }}
                    >
                      {decision === "approve"
                        ? "Approve after verification"
                        : "Reject"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <p
          role="status"
          className="mt-5 whitespace-pre-wrap text-sm text-amber-200"
        >
          {busy ? "Checking securely…" : message}
        </p>
      </section>
    </div>
  );
}
