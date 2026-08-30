# Audit remediation — root unified suite

Baseline: `214e1be`. Branch: `fix/security-foundation`. Draft PR: #3.

The first commit addressed only the security foundation. This checklist tracks the complete eleven-finding audit follow-up; it does not certify the older, repository-wide production roadmap as finished. Changes are prepared in code, not deployed to live services.

| Finding | Remediation in this branch | Verification / live dependency |
|---|---|---|
| Default Master Admin and email/password bypass | Guest by default; Firebase sign-in; verified boolean admin claim | Authentication regression tests; staging login/admin claim check still required |
| Unauthenticated admin/security APIs | Root API authentication and admin authorization; request bodies parsed after authorization | Unit and production rejection tests |
| Invented checkout sessions / offline Pro | Real Stripe checkout, verified ownership/payment/product/status, persisted entitlement | Regression tests; actual Stripe lifecycle still required |
| Unsigned webhooks | Raw-body signature verification, durable event deduplication, retry on write failure | Signature/persistence-failure tests; staging Firestore/Stripe check |
| Local passwords/passkeys/security answers | Removed credential registry and recovery bypass; legacy keys discarded | Source review; browser Firebase session credentials managed by SDK |
| Raw cross-room WebSocket relay / incompatible protocols | Authenticated `/ws/meeting` and `/ws/hangout`, server identities, scoped room state, role-gated moderation, one vote per UID, bounds and token rechecks | Real WebSocket tests for spoofing, isolation, role escalation and duplicate votes; persistent single-process host required |
| Fabricated Hit Analyzer results | Removed server/browser keyless score generation; require uploaded audio; honest provider errors and advisory labels | Audio validation tests and source review; real provider result checks still required |
| Seeded DMs and automatic replies | Private Firestore conversations, server sender/recipient scope, real text/voice uploads, no canned responses or local-only success | API access/failure tests; Firestore index, microphone and two-account staging checks |
| Judgment Zone permissive track writes | Deny browser database access; validated server operations, owner checks, immutable reviews, transactional quotas/XP/aggregates, private audio uploads | Mutation regression tests; deploy rules/index and test concurrent Firestore transactions in staging |
| Public transaction audit | Verified-admin authorization on audit endpoints | Production smoke and admin-boundary tests |
| Missing Semantic Lab root API | Mounted authenticated synthesis route; no synthetic result on errors | Missing-provider integration test; configured provider success check |

## Additional corrections in the affected flows

- Assistant OCR, strategy, correction, search, and Hang Out marketing routes now exist in the root API. Roadmaps use the returned tasks instead of silently ignoring them and displaying fixed milestones.
- Removed fabricated artist search matches, starter catalog tracks, generated ISRCs, and Semantic Lab historical market charts. Empty results remain empty; provider failures remain errors.
- Judgment Zone no longer signs in anonymously, bulk-writes other artists' tracks, or falls back to local “saved” results. Artist dossiers are filtered by owner.
- The new judge dataset uses `judgeTracksV2` and `judgeProfilesV2`. Untrusted legacy XP/reviews/ownership are not imported automatically. No old records were deleted.
- Review XP is a fixed server award of 50. A server timestamp enforces a minimum elapsed review period, but does not prove actual listening. Full-listen bonuses and verified-listen claims are not awarded from browser assertions.
- Media requests accept bounded inline files, never arbitrary server-fetched URLs. DM voice notes are capped at 500 KB; Judgment Zone uploads at 15 MB. Cover-art persistence is not yet supported.
- Shared proxy IPs no longer let one authenticated account quarantine every other account. Request tracking and quarantine use the verified account subject.

## Validation

Local result: TypeScript check and production build passed; 11 security tests, 7 Firebase emulator integration tests and 1 production smoke test passed. Vite still reports existing large-chunk warnings.

Run `npm run lint`, `npm run test:security`, `npm run build`, then `npm run test:production` from the root. Security tests exercise actual HTTP and WebSocket servers with injected identities/provider/storage doubles, plus pure review validation. The additional `npm run test:firebase` exercises the repository rules and real Auth/Firestore emulator behavior, including competing writes. These checks do not prove deployed IAM/rules/indexes, production transaction behavior, actual Stripe fulfillment, microphone behavior, or live Gemini output quality.

## Remaining operational gates

Follow `SECURITY-ROLLOUT.md`. Provision and validate Firebase Authentication, private Storage, Firestore rules/indexes and least-privilege server credentials. Exercise two verified accounts plus one admin in staging, including concurrent duplicate review submission, cross-account DM access, upload failure, subscription cancellation, and session revocation. Do not merge/deploy as a substitute for these checks.

Room chat, meeting state, and battle state are in memory and reset when a room becomes empty or the process restarts. They are public rooms for registered users, not invitation-only rooms. Room chat and battle verses currently accept text; unsupported media requests return an error rather than silently dropping their attachments. Private DMs support voice notes. A single persistent Node process is required; distributed durable realtime state is a separate platform task. DMs and Judgment Zone records are durable server storage.

Server-owned coins/feature quotas and billing management are implemented in `ECONOMY-ROLLOUT.md`. Other older platform-roadmap items remain: account-scoped migration of all creative drafts, a global admin directory/ban management, durable multi-instance rooms, and separate standalone-app deployment audits. Disabled global ban/free-access controls remain explicitly unavailable; no fake success is returned. These are not silently marked fixed by this checklist.

## Follow-up: Lyric Pro vault isolation

Lyric Pro now keys its local vault and startup-guideline acceptance by the signed-in Firebase UID. Account transitions remount the editor and discard late cloud/native generation responses. Guests have transient drafts only. Save/delete failures are surfaced before the UI claims success. The previous browser-wide vault remains untouched and is never silently assigned to a new account; manual recovery/import with explicit ownership is still pending. This is browser account separation, not encrypted storage or cloud backup. Other tools’ local drafts/catalogues still require their own migration.

Validation: 18 unit/security tests (including four vault regression tests), typecheck, build and production smoke test pass. A real browser two-account switch check remains a staging gate; Firebase integration tests were not rerun for this browser-only change.

## Follow-up: Artist Assistant workspace isolation

Artist Assistant uses one schema-v2 browser snapshot with owner UID and creation/update timestamps. Profile, preferences, songs, folders, document metadata, schedule and chat are scoped to the current auth session. Account transitions remount the workspace; stale persistence/export/reset callbacks fail. Guests retain only transient work. Invalid/foreign records are not overwritten; storage errors are shown, and the current in-memory work can be exported without provider credentials. Reset preserves profile/preferences and restores the starter folders.

The old unowned localStorage keys and IndexedDB mirror remain untouched; no account silently receives their contents. New snapshots use localStorage, not the old best-effort IndexedDB mirror, which was never the primary read source. This remains browser-only, not encrypted or cross-device storage. Metadata exports omit original uploaded files; import/restore and legacy ownership recovery remain pending. Other tools still need isolation. Rollback must preserve both old and v2 data without re-enabling shared reads.

Validation: 25 unit/security tests including six storage-service regression tests, root typecheck, Artist Assistant typecheck/build with secret scan, root build and production smoke pass. Two-account browser staging and cloud/provider checks remain pending; Firebase emulator tests were not rerun for this frontend-only change.

## Re-audit follow-up — charging and cancellation (2026-08-30)

Re-audit baseline: `6b2e0d1`. This batch fixes the first two of five findings; it does not close the re-audit.

- AI usage middleware canonicalizes case and trailing slashes to match Express routing. Verification, Coin consent, request IDs, reservation keys and daily quotas use the same action path for accepted URL variants.
- Cancellation retrieves every account-mapped subscription from Stripe instead of skipping records whose cached status is not `active`. Ownership is checked for all returned subscriptions before mutations. Active/trialing subscriptions are scheduled to end at period end; past-due, unpaid, incomplete and paused subscriptions are canceled immediately without prorations or a final invoice. Already-ended subscriptions are safe to retry. Missing mappings, ownership mismatches, provider errors and unconfirmed provider responses never return cancellation success.
- The cancellation control remains available after Pro access lapses. Confirmation text explains unpaid cancellation and does not promise refunds or debt forgiveness. Subscription state continues to arrive through signed webhooks; pending webhook delivery can delay the wallet display.
- Stripe behavior reference: [Cancellation and outstanding invoices](https://docs.stripe.com/billing/subscriptions/cancel). Staging must exercise actual Stripe lifecycle states, webhook delivery, retries and paid-through access. A checkout whose subscription mapping has not arrived returns a support/retry error rather than claiming cancellation.

New local regressions exercise every priced/free AI route with canonical, trailing-slash, uppercase and combined variants. Cancellation HTTP tests cover all eight current Stripe statuses, no subscription record, wrong ownership, unverified identities, provider outage and missing provider confirmation. Provider and subscription lookup doubles are isolated from live services.

Still open from this re-audit: Judgment Zone identity/signature exposure, RoyaltyOps/main-catalog browser account isolation, and permanent Sentinel quarantine/restored historical blocks. In particular, an already-quarantined account can still be blocked before reaching cancellation until the Sentinel fix lands. Do not treat this batch as launch approval.
