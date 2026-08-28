# MASTER BUILDS

## North Star

Build a dependable IndieBrotherhood platform for artists, judges, collaborators, and catalog managers. Every product should have a clear owner, real data boundary, trusted backend behavior, observable failures, and a deployment path that matches its runtime needs.

## Build Phases

### Phase 0: Baseline and decisions

- Choose the canonical Firebase project and environments: development, staging, production.
- Decide whether the apps remain separate Vercel projects or become a monorepo/workspace.
- Define the shared identity model and whether anonymous users can later upgrade to email/Google accounts.
- Establish naming, domains, data retention, copyright, moderation, and AI disclosure policies.

### Phase 1: Shared foundation

- Add a root workspace or CI workflow that installs and builds every app independently.
- Standardize Node, npm, TypeScript, Vite, ESLint, formatting, and environment naming.
- Create shared Firebase initialization, auth helpers, error reporting, and API response conventions.
- Add Firebase App Check, Analytics/Crashlytics equivalent, and structured server logs where appropriate.
- Add Firestore, Storage, and Functions/Cloud Run deployment configuration.

### Phase 2: Judgement Zone production core

- Move review assignment, review creation, score aggregation, XP, tier progression, quotas, skip limits, and duplicate-review prevention to trusted Functions or a Vercel API.
- Upload audio and artwork to Firebase Storage and persist Storage paths, MIME type, size, duration, checksum, and ownership metadata.
- Add moderation, copyright takedown, abuse reporting, audit logs, and data deletion workflows.
- Add Firestore indexes, emulator tests, rules tests, and integration tests.
- Replace anonymous-only identity with account upgrade without losing a user's profile.

### Phase 3: Realtime products

- Select a realtime provider for `hang-out` and `meeting-room`: Firebase listeners, Realtime Database, Ably, Pusher, or a persistent host such as Fly.io/Render/Railway.
- Move room, battle, meeting, chat, moderation, and presence state out of process memory.
- Add reconnect behavior, authorization per room, rate limiting, message history rules, and moderation tools.

### Phase 4: AI and creator tools

- Put server-managed Gemini calls behind authenticated, rate-limited endpoints.
- Treat BYOK as an explicit separate mode with no server logging or storage of keys.
- Add usage records, quotas, prompt versioning, model versioning, retries, timeouts, and cost controls.
- Label template, procedural, advisory, demo, and AI-generated outputs accurately.

### Phase 5: Catalog and business readiness

- Sync artist catalog, quiz history, analysis history, and metadata records to the chosen account backend.
- Implement durable exports, import validation, backups, audit trails, and user data export/deletion.
- Remove placeholder ads, unsupported market claims, and demo-only controls.
- Add billing only after usage accounting and terms are trustworthy.

### Phase 6: Launch hardening

- Run CI builds for all apps on Windows and Linux.
- Run security review, rules tests, dependency audit, accessibility checks, and mobile browser checks.
- Stage a closed beta, monitor errors and costs, then roll out production gradually.

## Definition Of Done

A feature is done only when its UI, backend contract, persistence, authorization, failure state, tests, documentation, environment variables, deployment target, and rollback path are all defined. A successful local demo is not sufficient.

## Recommended Deployment Shape

- Static/front-end apps: Vercel.
- Serverless AI/API endpoints: Vercel Functions or Firebase Functions, with secrets stored server-side.
- Realtime state: managed Firebase realtime services or a separately hosted persistent service.
- Files: Firebase Storage with signed/authenticated access.
- Durable application data: Firestore with rules plus trusted server mutations.
