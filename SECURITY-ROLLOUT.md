# Security foundation rollout

Scope: root unified suite at baseline `214e1be`. This is a staged security fix, not a production-readiness certificate. No production credentials, users, payment settings, Firebase rules, or deployments were changed while preparing it.

## What changes

- Firebase Email/Password registration and sign-in replace the local demo account registry, founder auto-login, hardcoded passkeys, and security-question recovery. Password recovery uses Firebase email links. Legacy demo credentials are discarded; creative drafts and catalogs are retained.
- Every root `/api` route requires a Firebase ID token except GET health/config and the separately signature-verified Stripe webhook. Firebase Admin checks signature, expiration, revocation, disabled accounts, and rejects anonymous users. Administrator routes additionally require a boolean `admin` claim and verified email. Client-provided email, role, and user IDs do not authorize anything.
- Stripe checkout uses the authenticated UID, configured recurring price, and configured site origin. Simulation and network-error Pro activation are removed. Session verification checks ownership, actual paid status, subscription status, and the configured product price.
- Verified Stripe events update server-only Firestore `billingSubscriptions` and `billingEvents` transactionally. Duplicate event IDs are ignored; older events cannot replace newer records, and canceled subscriptions cannot be reactivated by delayed events. Failed writes return 503 so Stripe retries. Browser Pro display is refreshed from the server on account changes, focus, and every minute.
- Frontend output is `dist/client`. Server code and source maps remain outside that directory. Missing APIs and backend bundle URLs return 404.
- The unauthenticated WebSocket relay is closed with HTTP 503 until a room-aware authenticated protocol is implemented. Broadcast/kick/blacklist APIs and local-only moderation controls return explicit unavailable errors rather than pretending to act. This intentionally pauses realtime features.

## Deployment prerequisites

1. Use a staging Firebase project first. Enable **Email/Password** in Authentication, authorize staging/production domains, and enable email enumeration protection. Configure the four `VITE_FIREBASE_*` auth values in `.env.example` before building. The suite uses its own named Firebase app, separate from the existing Judgment Zone anonymous app.
2. Set server `FIREBASE_PROJECT_ID` to that same project. Prefer application default credentials/workload identity with Firebase Auth and Firestore access. Where unavailable, put a service account JSON in secret storage as `FIREBASE_SERVICE_ACCOUNT_JSON`. Never give it a `VITE_` prefix or commit it. Enable Firestore.
3. Deny **all client reads and writes** to `billingSubscriptions` and `billingEvents`. The repository's Judgment Zone rules implicitly deny these collections. Review the actual deployed rules for any overlapping wildcard allow rules before enabling payment. Admin SDK writes bypass client rules. Judgment Zone track/review rules still need a separate hardening pass.
4. Register your real account through the new sign-in form, verify its email, then obtain its Firebase UID. From a trusted environment using the staging admin credentials, run `node --import tsx scripts/grant-admin.ts <verified-uid> --confirm`. This preserves existing claims. Sign out and back in. There is deliberately no public endpoint, hardcoded email shortcut, or default admin. The script was not run during implementation.
5. Set `APP_PUBLIC_URL` to an HTTPS origin with no path, query, or credentials; localhost HTTP is permitted only for local development. Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_PRO` to a recurring subscription price, and `STRIPE_WEBHOOK_SECRET`. Never mix test/live credentials or prices.
6. Register `/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `customer.subscription.created`, `.updated`, `.deleted`. Use Stripe test mode to verify payment, renewal, cancellation, duplicate events, and database-outage retries before accepting live payments. Test-mode keys do not activate any production account if staging uses separate Firebase data.
7. Existing real Stripe subscriptions without `metadata.firebaseUid` need a deliberate, verified account mapping before migration. Do not infer ownership from browser data or silently invent it.
8. Build the **root** suite and start the persistent Node server. Static hosting alone does not run these APIs. Set `PORT` if the host requires it. This change does not convert Express into Vercel serverless functions or change standalone app deployment configs.

## Contracts

- `POST /api/stripe/create-checkout-session`: bearer ID token, verified email, JSON `{ clientCustomKey }` (8–128 letters, digits, `_`, `-`). Returns a real Stripe URL or an error. UID-scoped idempotency prevents another user sharing the same client key.
- `POST /api/stripe/verify-session`: bearer ID token, `{ sessionId }`. Foreign sessions return 403; simulated IDs return 400; provider failures do not grant access.
- `GET /api/stripe/subscription`: bearer ID token; reads only that UID's unexpired active entitlements.
- `POST /api/stripe/webhook`: Stripe-signed raw JSON; never Firebase auth, never unsigned fallback.
- `GET /api/security/account-status`: bearer ID token; ignores requested account IDs and returns the authenticated user's status.
- Other security controls, audit records, admin APIs and resilience telemetry require verified admin claims.

## Validation and remaining work

Run `npm run lint`, `npm run test:security`, and `npm run build`, then `npm run test:production`. `bun.lock` is the root dependency lock; install with `bun install --frozen-lockfile` for reproducible validation.

Automated tests cover auth rejection/authorization, payment ownership/product/status checks, missing configuration, unsafe return origins, UID-scoped idempotency, webhook signature tampering, and retry on persistence failure. Production smoke checks verify protected routes, disabled raw sockets, and private backend artifacts. A live Firebase login and actual Stripe/Firestore lifecycle require staging credentials and were not exercised here.

Still open from the audit: trustworthy room protocols; real DMs instead of canned replies; fabricated analyzer fallbacks; missing Semantic Lab and other root API integrations; Judgment Zone review/track rules and server-side voting; server-owned XP/coins/quotas; billing management/cancellation UI; media storage and account-scoped creative data migration; standalone app audits. Local gamification/profile state remains a display/draft cache and MUST NOT authorize valuable server actions. Client-only admin roster/telemetry is not a global user directory.

## Rollback

Keep this branch separate until staging validation succeeds. If staging fails, disable the affected feature or revert the branch there. Do not restore automatic admin login, unsigned webhooks, simulation payments, or the raw global socket relay on a public deployment. Preserve Firestore billing records during any rollback and pause new checkout rather than taking payments without fulfillment.
