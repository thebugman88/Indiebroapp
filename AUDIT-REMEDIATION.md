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

Other older platform-roadmap items remain: suite-wide server-owned coins/feature quotas, a billing-management UI, account-scoped migration of all creative drafts, a global admin directory/ban management, durable multi-instance rooms, and separate standalone-app deployment audits. Disabled global ban/free-access controls remain explicitly unavailable; no fake success is returned. These are not silently marked fixed by this checklist.
