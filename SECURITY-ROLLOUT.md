# Audit remediation rollout

Scope: root unified suite at baseline `214e1be`. This is a staged security fix, not a production-readiness certificate. No production credentials, users, payment settings, Firebase rules, or deployments were changed while preparing it.

## What changes

- Firebase Email/Password registration and sign-in replace the local demo account registry, founder auto-login, hardcoded passkeys, and security-question recovery. Password recovery uses Firebase email links. Legacy demo credentials are discarded; creative drafts and catalogs are retained.
- Every root `/api` route requires a Firebase ID token except GET health/config and the separately signature-verified Stripe webhook. Firebase Admin checks signature, expiration, revocation, disabled accounts, and rejects anonymous users. Administrator routes additionally require a boolean `admin` claim and verified email. Client-provided email, role, and user IDs do not authorize anything.
- Stripe checkout uses the authenticated UID, configured recurring price, and configured site origin. Simulation and network-error Pro activation are removed. Session verification checks ownership, actual paid status, subscription status, and the configured product price.
- Verified Stripe events update server-only Firestore `billingSubscriptions` and `billingEvents` transactionally. Duplicate event IDs are ignored; older events cannot replace newer records, and canceled subscriptions cannot be reactivated by delayed events. Failed writes return 503 so Stripe retries. Browser Pro display is refreshed from the server on account changes, focus, and every minute.
- Frontend output is `dist/client`. Server code and source maps remain outside that directory. Missing APIs and backend bundle URLs return 404.
- The raw relay is replaced by authenticated `/ws/meeting` and `/ws/hangout` protocols. Room events are scoped, identities and moderator roles are server-assigned, and duplicate votes are prevented. Verified-admin broadcasts reach connected rooms. Global kick/ban/free-access controls remain unavailable; in-room admin kicks are supported.
- DMs use private Firestore conversations; Judgment Zone uses validated transactional server writes and private Storage uploads. Fabricated analyzer results, synthetic market history and catalog identifiers are removed. Semantic Lab and assistant routes are connected. See `AUDIT-REMEDIATION.md` for the finding-by-finding checklist.

## Deployment prerequisites

1. Use a staging Firebase project first. Enable **Email/Password** in Authentication, authorize staging/production domains, and enable email enumeration protection. Configure the four `VITE_FIREBASE_*` auth values in `.env.example` before building. All root-suite features now use the named suite Firebase app. Judgment Zone no longer creates anonymous accounts.
2. Set server `FIREBASE_PROJECT_ID` to that same project. Prefer application default credentials/workload identity with Firebase Auth and Firestore access. Where unavailable, put a service account JSON in secret storage as `FIREBASE_SERVICE_ACCOUNT_JSON`. Never give it a `VITE_` prefix or commit it. Enable Firestore.
3. Review and deploy the root `firebase.json` Firestore rules and indexes to staging. They deny browser access; only the server uses the Admin SDK. Verify that your deployed project has no other overlapping allow rules. The DM members/updatedAt composite index must finish building. Configure a **private** Cloud Storage bucket and server `FIREBASE_STORAGE_BUCKET`; grant the server object access and signed-URL capability. Never make the bucket public. Judgment Zone playback now uses an authenticated, non-cacheable audio endpoint; storage object names and new signed URLs are not sent to clients. Previously issued signed URLs remain usable until their original one-hour expiry. Review shared-project impacts before deploying deny rules; standalone clients using direct Firestore will stop working. No rules were deployed during preparation.
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

Automated tests cover auth rejection/authorization, payment ownership/product/status checks, missing configuration, unsafe return origins, UID-scoped idempotency, webhook signature tampering, and retry on persistence failure. Production smoke checks verify protected routes, unknown raw socket paths, and private backend artifacts.

`npm run test:firebase` starts isolated Auth and Firestore emulators using the non-production project `demo-indiebro-security`. It requires Java 21+ and Node 24. The runner clears inherited service/payment credentials, and the test refuses non-loopback emulator hosts. Seven integration tests passed: direct browser access denial across protected/legacy collections, actual Auth emulator token permissions and disabled/anonymous rejection, simultaneous duplicate reviews, simultaneous attempts to consume the last quota, forged profile fields, concurrent private DMs, and durable subscription event deduplication/stale cancellation handling. These tests use actual database transactions rather than storage doubles.

`.github/workflows/security-verification.yml` runs the typecheck, 11 unit/security tests, 7 Firebase integration tests, build and production smoke test on pull requests and main pushes. It uses read-only repository permissions, pinned actions, a frozen Bun lockfile and no production secrets. Repository branch protection must separately require this job before it can block merging; this PR does not change branch protection.

Run `npm run check:staging` on the intended staging host after setting the environment. It prints only setting names and pass/fail results, validates project agreement/HTTPS/test-mode payment configuration, and checks credential availability. It does not establish live authorization or contact Stripe. In this workspace it correctly fails because staging credentials and settings are absent. Configure values in the hosting provider's environment/secret settings; do not paste private keys into chat.

Still unverified: deployed project IAM, private bucket access and signed uploads, deployed indexes/rules, real email delivery and browser login, Gemini success responses, and actual Stripe test checkout/webhook/payment-renewal-cancellation flows. Emulator success does not replace those live staging checks.

The eleven root-suite findings and remaining staging checks are listed in `AUDIT-REMEDIATION.md`. Their code remediation is complete; live configuration and provider integration are unverified. Server-owned coins/quotas and billing management are documented in `ECONOMY-ROLLOUT.md`. Broader platform work remains: creative-data migration, a global admin directory and ban controls, durable multi-instance rooms, and standalone deployment audits. Local gamification/profile state MUST NOT authorize valuable server actions. Room state is transient and requires one persistent process. DMs and judge records use durable storage.

Legacy Judgment Zone tracks require a deliberate migration with verified ownership and re-uploaded audio. Browser object URLs cannot be migrated into durable media. Do not import old client-asserted XP, review identities, or ownership as trusted data.

## Rollback

Keep this branch separate until staging validation succeeds. If staging fails, disable the affected feature or revert the branch there. Do not restore automatic admin login, unsigned webhooks, simulation payments, or the raw global socket relay on a public deployment. Preserve Firestore billing records during any rollback and pause new checkout rather than taking payments without fulfillment.

## Later contract updates

The checkout contract and webhook event set above describe the first security batch. For current versioned terms consent, product selection, Coin packs, invoice/refund/dispute events and recovery, use `ECONOMY-ROLLOUT.md` and the validators in `server/billing.ts`. Do not configure a new deployment from the first-batch event list alone. Test counts above are historical; run the scripts for current results.
