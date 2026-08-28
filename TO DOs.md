# TO DOs

This is the live execution queue. Mark items with `[x]` only after code, tests, and deployment notes are complete.

## Immediate

- [ ] Choose the canonical Firebase project and environment naming.
- [ ] Decide separate Vercel projects versus a root workspace/monorepo.
- [ ] Add a root CI build matrix for all nine apps.
- [ ] Install and validate every app on Windows and Linux.
- [ ] Record exact Node/npm versions and lockfile policy.
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
- [ ] Make BYOK privacy behavior explicit and ensure keys are never logged.
- [ ] Label procedural/template fallbacks and advisory analytics.
- [ ] Remove or implement the quiz studio placeholder ad.
- [ ] Validate URL-based audio ingestion against SSRF, size, MIME, timeout, and copyright risks.
- [ ] Fix the artist assistant `import.meta`/CommonJS warning.
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
