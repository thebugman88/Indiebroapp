# Privacy hardening and release checklist

This change targets the maintained **root suite**, based on `feat/usage-economy` at `0030b3d`. It does not deploy a service, change live IAM, configure Stripe, create secrets, or run Google Cloud Build. Do not deploy the child prototype servers or old Vercel handlers as production backends. Sonic IQ's unauthenticated legacy quiz handler now fails closed.

## Threat model and limits

The app adds authenticated AES-256-GCM encryption using Node crypto and browser Web Crypto, with random 96-bit nonces and HKDF-SHA-256 context separation. Owner/pair/record identity and expiry are authenticated with the ciphertext. Browser keys are derived separately per Firebase UID, delivered only after verified authentication, and imported as non-extractable CryptoKeys. Master keys never go to the browser. This follows the use of standard authenticated encryption and separated keys described in the [OWASP cryptographic storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html).

A stolen database or browser-storage copy should expose ciphertext for protected content, provided the attacker does not also obtain keys. **This is application encryption at rest, not end-to-end encryption or an “unhackable” guarantee.** A compromised running server, stolen signed-in session, malicious browser extension, XSS, or compromised recipient device can access information visible to that session. Server operators with both runtime/key access and database access can decrypt content. Independent security review and live configuration tests remain necessary.

| Data | Protection and allowed visibility |
| --- | --- |
| Browser drafts, collaborator details, catalog, quiz history, career files and preferences | Encrypted per account; plaintext and keys remain in process memory while unlocked. Stale account handlers cannot read or write the new session. |
| RoyaltyOps files, OCR text, extracted tracks and filenames | Encrypted records in an account-specific IndexedDB database. Record IDs, database partition IDs and approximate sizes remain visible. Provider credentials are removed before persistence. |
| Direct messages, voice notes, contact names and snippets | Encrypted Firestore payloads; server checks pair membership before decrypting. Participant IDs, timestamps and unread counts remain queryable. A recipient can copy or forward what they receive. |
| Judgement uploads, lyrics, reviews and judge profiles | Encrypted Firestore content and encrypted bucket audio. Judgement audio is intentionally shared for authenticated community review; blind-review identity restrictions still apply. |
| AI replay bodies | Encrypted, owner-only, inaccessible through app APIs after 24 hours. Lyric replay retains at most five recent A/B pairs per account. Accounting/idempotency records survive content deletion. |
| Security events | Encrypted identity/IP/details; timestamp and expiry metadata remain queryable. Optional AI review receives aggregate counters only. |
| Hang Out and Meeting Room realtime content | Authenticated room-scoped messages in runtime memory, sent to authorized room participants. Room participants can record or copy shared material. This is not E2EE. |
| Authentication and billing metadata | Firebase Authentication and Stripe retain their own records. UID, subscription/order references, balances and operational timestamps are not application-encrypted; protect them with IAM and provider controls. Password handling remains with Firebase. |

Sign-in initializes with memory-only persistence and removes this Firebase app's older remembered credentials without importing that session. Refreshing/closing a page requires signing in again. Sign-out broadcasts a logout signal to other open same-origin tabs where BroadcastChannel is supported. Closing the browser removes app access to keys; it is not a forensic erasure guarantee for OS memory, swap, or browser backups. Private API responses use `no-store`, and authenticated fetches refuse cross-origin destinations and redirects. During an existing-user rollout, an authorized administrator must also revoke legacy refresh tokens; deleting a browser credential cache cannot revoke copies already stolen or backed up.

## Lyric Pro behavior

- Every successful generation has two complete, separately titled songs. There is no duplicated Set B, browser AI bypass, or recycled template fallback.
- Prompts emphasize original writing, distinct hooks and scenes, natural cadence, genre-appropriate structure, and revision of weak lines. Missing/short outputs and shared normalized lines or six-word passages are rejected. Encrypted fingerprints also reject overlap with the account's last ten generated songs within 24 hours. Words and input sizes are bounded.
- These checks do **not** compare against every published song. They cannot guarantee elite artistic quality, zero resemblance to a famous song, or copyright clearance. The UI explicitly requires review before release; it no longer promises blanket immunity or ownership of every output.
- Successful output is saved to an encrypted temporary browser history: **five A/B pairs = ten songs**, for up to 24 hours from generation. Saving or reopening does not reset the song's timestamp. Each browser has its own temporary copy; it is not a cross-device archive.
- Download buttons save each set or both sets as readable text to the user's device. The post-generation notice appears each time unless that account selects “don't show again.” Downloads and deliberately shared DM/Hang Out copies have separate lifetimes.
- Expired lyric content is rejected immediately by app reads. Browser cleanup runs while the app is active; server maintenance removes expired encrypted replay bodies. Firestore TTL is asynchronous and is **not** an exact deletion clock; backups and provider retention are separate. [Firestore TTL documentation](https://cloud.google.com/firestore/native/docs/ttl)
- The AI provider receives the creative inputs necessary for generation. The 24-hour app policy does not control provider retention or training settings. Configure suitable provider terms/data controls before inviting users to submit sensitive unpublished work.
- Timeouts abort the local transport and stop the fallback chain. A closed transport cannot prove remote provider work stopped, so timeout failures never automatically launch another generation. Explicit provider errors can still use the configured fallback chain. No live provider quality or cancellation guarantee was established by mocked tests.

## Billing and catalog fixes

Checkout distinguishes an expired paid entitlement from a terminated subscription. It checks every mapped subscription with Stripe and blocks another Pro purchase for any state other than `canceled` or `incomplete_expired`. The database transaction also refuses a new Pro order while any subscription is nonterminal. Existing checkout locking remains in place. Stripe can continue collection activity for `past_due` subscriptions; an account downgrade alone must not authorize another recurring purchase. [Stripe subscription lifecycle](https://docs.stripe.com/billing/subscriptions/overview)

Manual catalog tracks no longer receive fabricated ISRCs or a fixed duration. Unknown values display as unknown/not provided; total playtime counts only known durations.

## Security enforcement

The root API requires verified server-side identity, uses owner/pair/room authorization, retains billing consent/idempotency controls, and rejects unsafe object structures. Proven structural abuse triggers a durable **five-minute account cooldown** and an encrypted event. Admin restrictions are bounded to 30 seconds–24 hours and have an explicit unblock action. Billing cancellation remains reachable during account cooldowns. Realtime clients recheck identity/restrictions periodically; an admin kick closes current connections immediately.

The existing rate limiter is process-local and is not a distributed perimeter defense. Do not trust arbitrary `X-Forwarded-For` headers or permanently ban a shared IP based on an AI guess. The stored IP is the observed connection address; Cloud Run may expose a proxy address. Trusted client-IP attribution, an edge WAF/rate limiter, attack alert delivery and incident ownership must be configured and tested separately. No new cloud WAF, public IP blacklist, or permanent automatic ban has been deployed.

`SECURITY_AI_REVIEW_ENABLED=true` opts into a periodic advisory reviewer. It receives only aggregate request/blocked/severity counts, has no access to user content or identifiers, and cannot execute repairs or bans. `SECURITY_AI_MODEL` can select its model. It is **off by default**, was not enabled during this work, and incurs provider usage if enabled. Its latest advisory is restricted to administrators at `/api/security/assessment`.

Production headers limit executable scripts to the app, deny framing, restrict connections, omit referrers, and disable unnecessary browser capabilities. OCR worker/core scripts are bundled locally; language data can be downloaded from the pinned Tesseract data path. RoyaltyOps external ISRC lookup and Quick Tools automatic online rhyme suggestions are off by default and disclose the identifiers/word sent when enabled. Dictation asks before using the browser's speech provider. Lyric read-aloud selects a local device voice only and stops when its workspace closes. Provider exception objects and private prompts are not written to the maintained API's console logs.

## Required configuration before staging

1. Generate a cryptographically random 32-byte key outside git, logs, chat and build output. Store a JSON object mapping key IDs to canonical base64 keys in Secret Manager as the runtime-only `PRIVATE_DATA_KEYS_JSON`. Set `PRIVATE_DATA_KEY_ID` to the current entry's ID. Do not use passwords, Firebase frontend config, Gemini keys, Stripe keys or test-fixture material as encryption keys.
2. Bind that secret only to `indiebrotherhood-runtime@vercel-2026.iam.gserviceaccount.com` and the narrowly scoped recovery operator. Retain a secure recoverable key backup. Losing the key makes saved files unreadable. Do not put either key material or provider secrets in `project.toml` or a `VITE_` variable.
3. Keep all instances on the same keyring. For rotation: add a new key, switch the current ID, retain previous IDs until their server and browser data are migrated, then retire old material through an approved recovery/retention procedure. Rotation does not rewrite offline browser data automatically. A KMS-backed envelope-key service is a possible further separation of key administration; this implementation does not claim to provide that service.
4. Deploy the deny-all browser Firestore and Storage rules and the reviewed index/TTL definitions. The Admin SDK serves authorized data and bypasses Firebase rules, so runtime IAM must remain narrow. No public bucket ACLs, Firebase download tokens, or unauthenticated object URLs should be introduced.
5. Apply TLS, Firebase authorized domains, authentication abuse controls and administrator account protection. Review the CSP against staging login, audio, OCR and realtime flows. No live IAM, browser session, or provider configuration is certified solely by local tests.
6. Choose and verify recovery execution **before** allowing payments or promising background cleanup. The current process has a one-minute maintenance timer. Request-based CPU and scaling to zero cannot be assumed to run it. Either keep a suitably configured active instance or implement and verify an authenticated scheduled worker/job. The choice remains unresolved; neither option was deployed here. [Cloud Run billing/CPU behavior](https://cloud.google.com/run/docs/configuring/billing-settings)
7. Configure expiration monitoring for `usageJobs.responseExpiresAt`. Never TTL-delete whole usage-job or payment records to remove lyrics: that would destroy idempotency/accounting history. The maintenance function deletes only private response fields. The index file provides TTL policies for originality fingerprints and security events; policy deployment and deletion costs still require review.
8. Verify encrypted backup restoration, key loss/rotation handling, log retention and account deletion procedures. Historical plaintext exports, download tokens, provider copies and backups need their own inventory/remediation; this change cannot erase copies already distributed.

## Existing-data migration

New readers fail closed for old plaintext cloud content. Do not mix old writers with the encrypted schema. Before switching a production dataset, stop writers/traffic, secure access rules, review a backup strategy, load the runtime keyring and perform a read-only inventory:

```sh
node --import tsx scripts/migrate-private-data.ts --project vercel-2026
```

The inventory prints counts only, never customer values or keys. Only after reviewing those counts and the implications may an operator add `--apply --confirm-project vercel-2026`. The utility encrypts labelled judge profiles/tracks/audio and DM payloads. It removes old AI replay bodies while retaining accounting records. Audio writes use generation preconditions; record writes use transactions. Unsupported/ambiguous ownership stops migration. This utility has **not** been run against the user's cloud project.

Browsers show a notice for recognized older plaintext data. Users can explicitly migrate records labelled for their own account; encrypted writes are verified before their plaintext records are removed. Conflicting new data, corrupt records or account changes stop migration. Expired legacy lyric history is removed only after the UI's explicit migration warning/confirmation. Unlabelled Quick Tools/Sonic IQ/shared legacy data is never assigned to the current user. Deleting such shared data requires a separate destructive confirmation. Older app tabs must be closed, and unsupported legacy formats/browser backups need manual review.

## Verification contract

Use the repository's pinned Bun installer and `bun.lock` files (`BUILD-VALIDATION.md`). Do not introduce npm/yarn/pnpm lockfiles. Root and child builds must run from the complete repository checkout because shared security modules are imported across app boundaries.

Regression coverage includes nonterminal subscription checkout blocking, transaction-level purchase rejection, owner/pair authorization, ciphertext persistence, tamper/expiry/rotation failures, account-switch isolation, stale handlers, encrypted file migration, failed-save reporting, lyric input/output checks and cancellation behavior. Firebase integration uses only an explicit demo project and local emulators; Java 21+ is required. The GitHub security workflow now also targets PRs into `feat/usage-economy`.

Mocked/provider-free checks are not an independent penetration test or a live lyric-quality assessment. Keep the release blocked on live staging verification, keys/rules/IAM configuration, provider privacy settings, and the recovery/scaling decision.
