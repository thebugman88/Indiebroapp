# TO DOs

This is the live execution queue. Mark items with `[x]` only after code, tests, and deployment notes are complete.

## Immediate

- [ ] Choose the canonical Firebase project and environment naming.
- [ ] Decide separate Vercel projects versus a root workspace/monorepo.
- [x] Add a root CI build matrix for all ten apps (Linux/Windows; see `BUILD-VALIDATION.md`).
- [ ] Install and validate every app on Windows and Linux.
- [x] Record Node/npm versions and per-package Bun lockfile policy in `BUILD-VALIDATION.md`.
- [ ] Add root-level security, privacy, copyright, and AI disclosure policy docs.

## Judgement Zone

- [ ] Add Firebase Storage upload for audio and artwork.
- [ ] Store durable media paths, metadata, and ownership attestations.
- [ ] Move review creation and assignment to trusted Functions or API routes.
- [ ] Move XP, tiers, quotas, skips, and aggregation server-side.
- [ ] Prevent duplicate judge reviews and self-review.
- [ ] Add Firestore indexes and rules emulator tests.
- [ ] Add App Check, rate limits, abuse reporting, moderation, and audit logs.
- [ ] Support upgrading anonymous auth to a durable account.
- [ ] Add a real-time queue update strategy.

## Realtime Apps

- [ ] Choose managed realtime or persistent server hosting for `hang-out`.
- [ ] Choose managed realtime or persistent server hosting for `meeting-room`.
- [ ] Replace in-memory rooms, presence, chat, battle, and meeting state.
- [ ] Add reconnect, authorization, moderation, retention, and rate limits.
- [ ] Confirm AI endpoint routing works on the selected deployment.

## AI And Creator Apps

- [ ] Add auth, quotas, cost controls, and usage records to Gemini endpoints.
- [x] Remove Vite provider-key injection and stored creator-setting keys; disclose page-memory BYOK and provider transmission.
- [ ] Audit provider/proxy logs and all standalone BYOK routes; rotate any historically exposed keys.
- [ ] Label procedural/template fallbacks and advisory analytics.
- [x] Remove the quiz placeholder ad and simulated rewarded-ad points.
- [ ] Validate URL-based audio ingestion against SSRF, size, MIME, timeout, and copyright risks.
- [x] Remove the artist assistant unused `import.meta` initialization from the CJS server build.
- [ ] Sync local-first catalog, history, and settings where product requirements demand it.

## Quality And Operations

- [ ] Add shared error reporting and structured logs.
- [ ] Add accessibility, keyboard, mobile, and browser checks.
- [ ] Add unit tests for scoring, quotas, parsers, and validation.
- [ ] Add integration tests for auth, Firestore, Storage, and API routes.
- [ ] Add dependency audit and secret scanning to CI.
- [ ] Set Firebase and Gemini budgets/alerts.
- [ ] Document backups, restore drills, data deletion, and incident response.
- [ ] Stage a closed beta before public launch.

## Current scope and remaining gates

This queue covers the broader platform, not just the eleven root-suite audit findings. `AUDIT-REMEDIATION.md` and `ECONOMY-ROLLOUT.md` document implemented root authentication, audio uploads, trusted reviews/XP/quotas, private DMs, AI accounting and billing. Mixed items above remain unchecked when they include unfinished work (for example artwork, skips, moderation, live Storage tests or standalone deployment).

- [x] Separate standalone backend bundles from browser output; reject fake secret markers in app-build checks.
- [x] Add `SECURITY.md` maintenance/reporting boundaries; correct unsafe historical Hang Out audit instructions.
- [ ] Execute the new Windows matrix on GitHub (not verified by local Linux builds).
- [ ] Complete privacy/copyright policy review, monitored reporting contacts and data-retention decisions; do not invent founder approval.
- [ ] Complete account-scoped data migration beyond Lyric Pro, cloud creator-data sync and legacy import ownership checks.
- [ ] Complete staging credentials, provider checks, durable realtime and legal/launch approvals.
