# MASTER CONFIG

## Environment Strategy

Use three environments wherever possible: `dev`, `staging`, and `prod`. Never copy production credentials into local files or commit `.env.local`.

### Browser-safe variables

Only values required to initialize a Firebase web client may use `VITE_`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Firebase web config is not a secret, but Firestore and Storage rules are mandatory protection.

### Server-only variables

Keep these in Vercel or Firebase/Google Cloud secret storage, never in client bundles:

- `GEMINI_API_KEY`
- Firebase Admin SDK credentials or workload identity configuration
- webhook signing secrets
- payment provider secrets
- email, moderation, and analytics service keys

## Firebase Console Checklist

- Create separate Firebase projects or clearly separated environments.
- For the root suite enable Email/Password; anonymous identities are rejected. Additional providers require an explicit product decision.
- Create Firestore and deploy reviewed rules and indexes.
- Create Storage and deploy reviewed Storage Rules.
- Enable App Check for web traffic.
- Configure authorized domains for local, preview, and production URLs.
- Enable billing limits, budgets, alerts, and usage dashboards.
- Set up Functions/Cloud Run only after selecting the trusted mutation architecture.

## Vercel Checklist

- Create one Vercel project per deployable app unless a monorepo decision changes this.
- Set the correct root directory for each project.
- Set Preview and Production environment variables separately.
- Confirm build command, output directory, Node version, and API/function routing.
- Do not deploy long-lived WebSocket servers as ordinary Vercel serverless functions.
- Configure custom domains, redirects, headers, CSP, and preview protection.
- Verify that server-only keys are absent from browser bundles.

## Runtime Contracts

- Static-only child app: Vite produces `dist`. Root and server-backed child builds publish only `dist/client`; server artifacts are outside that public directory.
- API app: frontend calls a documented `/api/...` endpoint; endpoint validates auth, input, limits, and errors.
- Realtime app: client connects to a managed or persistent service with authenticated room membership.
- File flow: validate type and size, upload to Storage, persist a Storage path, serve through authorized access.
- AI flow: authenticated request, server-side key, timeout, retry policy, usage record, redacted logs.

## Required Security Controls

- Firebase App Check and authenticated writes.
- Trusted server-side validation for XP, quotas, reviews, aggregates, scores, and permissions.
- Rate limits per user/IP/route and request body size limits.
- Strict MIME, duration, file-size, and checksum validation for media.
- No secret values in logs, localStorage, URLs, or client source.
- Security headers and a restrictive Content Security Policy.
- Dependency lockfiles and automated vulnerability scanning.
- Audit logs for moderation, ownership, rights, account, and score-sensitive actions.

## Judgement Zone Current Config

`judgement-zone/firebase.json` correctly references `firestore.rules` and `storage.rules`. `src/vite-env.d.ts` correctly types the Firebase variables. The root integration implements private audio uploads, trusted mutations, indexes and emulator tests. Artwork persistence, live Storage/IAM checks and environment selection remain pending. Standalone clients are not approved for production.

## Security foundation update (2026-08-30)

The root unified suite now uses Firebase Email/Password authentication and Firebase Admin ID-token verification. Root builds serve `dist/client`, with server output isolated in `dist/server.cjs`. Stripe fulfillment writes server-only Firestore subscription/event records. See `SECURITY-ROLLOUT.md` for exact environment variables, endpoint contracts, staging checks, admin claim assignment, and rollback. Realtime is deliberately unavailable until authenticated room membership replaces the raw broadcast relay. Standalone deployment configs are unchanged.


## Remaining audit remediation (2026-08-30)

The follow-up replaces the disabled raw relay with authenticated room protocols, implements private durable DMs and server-owned Judgment Zone mutations/uploads, removes fabricated analysis/catalog/chart results, and connects missing root AI routes. See `AUDIT-REMEDIATION.md` for all eleven findings and explicit staging/remaining-platform boundaries. This supersedes the first-batch realtime pause and “still open” list, but does not imply production deployment or complete the older platform roadmap.

## Build and key-handling update

`BUILD-VALIDATION.md` is the toolchain/install/output contract. Per-app manifests and locks are retained. Browser builds allow only `VITE_FIREBASE_` variables; never add `VITE_GEMINI_API_KEY` or inject `GEMINI_API_KEY` through Vite. BYOK is a user-entered page-memory mode where implemented; preferences persist with credential fields blank. Reload clears the entered key. The root Artist Assistant ignores custom-key overrides and uses platform billing; its separate legacy server must not be used as an unmetered fallback.
