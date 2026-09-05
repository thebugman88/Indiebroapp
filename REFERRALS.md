# Verified referrals and community onboarding

This implements a server-backed referral program on `feat/usage-economy`. It does not deploy or enable the program. **Referral rewards are disabled unless `REFERRALS_ENABLED=true`; automatic payouts are separately disabled unless `REFERRALS_AUTOMATIC_REWARDS=true`.** Start with human review. Local XP, clicks, badges, profile flags and client-supplied ages/balances cannot authorize these rewards.

## Rules and user flow

The editable policy is `shared/referrals.ts`. The initial amounts are conservative implementation defaults, not a profitability guarantee:

| Qualified referral milestone | Inviter BC | Community points | Additional Pro time | Inviter badge |
| --- | ---: | ---: | --- | --- |
| 1 | 25 | 100 | — | Brotherhood Builder |
| 2 | 25 | 100 | — | — |
| 3 | 25 | 100 | 7 days | Community Connector |
| 4 | 25 | 100 | — | — |
| 5 | 25 | 100 | 14 days | Brotherhood Champion |
| 6–9, each | 25 | 100 | — | — |
| 10 | 100 | 500 | 30 days | Brotherhood Ambassador |

Every qualified new member receives **20 BC and a Welcome to the Brotherhood badge**. Each milestone is awarded once. Ten qualified referrals is the lifetime cap; rewards are cumulative (51 Pro days in total at all three time milestones). Community points are a separate verified score, not spendable Coins or client-side XP. New members do not receive the inviter's Pro time.

1. Verify email and complete the private community profile: artist/display name, display handle, role, genre, a short bio and a creative goal. Real names, addresses, photos and social accounts are not required. Draft profiles can be saved without completion. All core tools remain available without completing the referral checklist.
2. Accept the referral rules and anti-abuse disclosure to enroll. The server generates a random 96-bit invitation code and creates its unique Firestore mapping transactionally. Codes survive username changes. Display handles are not authentication or globally unique identity claims.
3. A newly registered user can enter the code at signup or use `/?ref=CODE#hub`. After email verification, they open Invite & Earn and explicitly attach it. A manually entered signup code is retained only in memory for that new UID; users must save it if closing the page. The invitation must already exist before account creation, attachment must occur within seven days, and the inviter must be older than the member. The attachment cannot later be changed. This prevents self-referrals, circular referrals and retroactive recruitment of existing accounts.
4. After attachment, successfully use **two different cloud tools across two UTC calendar days**, spending **at least 10 BC total**, and reach **48 hours of account age**. Included Coins count, so no purchase is required. Example: successful Lyric Pro generation (10 BC), then Sonic IQ generation (0 BC) on another day. Endpoints within the same tool count as one tool. Both profiles must be complete, and the inviter must also be at least 48 hours old before payout.
5. The member selects **Check activity & claim reward**. The server verifies current Firebase user status and checks persisted activity, profiles, blocks and limits. During the initial rollout, an administrator reviews the eligible claim. If automatic rewards are deliberately enabled later, unflagged qualified claims can settle immediately; flagged claims always require review. No background timer is required for this flow.

Activity advances only inside the transaction that marks an AI usage job delivered. Reserved, failed, refunded, pre-attachment and duplicate settlement attempts do not count. Only a bounded encrypted summary of tool families, two activity dates and the 10-BC threshold is retained; referral logic never copies lyrics or prompts. Reads do not award money. The qualification transaction credits both wallets, records the milestone, updates badges/points and changes the claim together. Concurrent/retried requests cannot mint another payout.

Firebase Admin exposes account creation with second precision, so the invitation-versus-birth comparison uses seconds rather than incorrectly comparing a rounded birth time with milliseconds. Strict inviter-before-member enrollment ordering independently prevents referral cycles and rejects already-enrolled accounts. Current email identity ownership is checked again inside the payout transaction; admin review cannot override another account's existing email identity claim.

## Pro and Coin accounting

Earned time is banked until explicitly activated. Activation consumes all banked days atomically and cannot overlap active Pro, a nonterminal subscription or a pending Pro checkout. Existing subscribers keep the banked days; this implementation does **not** pause, extend, cancel, refund or otherwise alter Stripe billing. Pro activation cannot automatically convert into a subscription.

Promotional Pro includes 10 GB base audio storage and the existing Pro purchase bonus. Instead of granting a full 1,500-BC monthly allowance for every short activation, it adds **45 BC per reward day** once: 315 for 7 days, 630 for 14 days, 1,350 for 30 days. The ordinary 150-BC free monthly allowance continues while promotional Pro is active. Paid subscriptions keep their existing 1,500-BC monthly behavior. There is no repeated allowance boost at promotion expiry, re-login or month rollover.

Referral and activation Coins are non-expiring account credits, represented in the existing wallet `purchased` bucket alongside other non-expiring/service credits; they are not cash purchases. Their source is recorded in separate referral ledgers. Pro expiry reduces base storage for future uploads but never deletes existing files. Earned time and ledgers are not TTL-deleted.

## Abuse controls and privacy

- Firebase identity is verified server-side, including disabled/revoked session checks. Current verified email and account creation time come from the Admin SDK, not profile JSON. Anonymous accounts are ineligible.
- Enrollment/payout/activation require a single-use App Check token for an explicitly allowed Firebase app ID. The server calls `verifyToken(token, { consume: true })` and rejects missing, replayed or wrong-app tokens. Fifteen referral mutations per UID/hour are allowed. [Firebase custom backend protection](https://firebase.google.com/docs/app-check/custom-resource-backend)
- Email identity uses an HMAC with a dedicated runtime secret. Gmail/Googlemail dots and aliases normalize together; plus tags are conservatively treated as the same mailbox on other providers. This can flag legitimate distinct mailboxes, which requires support review. Raw email is not copied into referral documents.
- The first-party `__Host-ib_referral_device` cookie is random, signed, Secure, HttpOnly and SameSite=Lax, with a 90-day maximum age. It is an abuse signal, not authentication, invasive hardware fingerprinting or proof of a human. Device/account associations are keyed hashes. Shared devices and identity changes trigger review; they do not permanently ban families or shared networks. Up to eight enrolled devices per account are allowed before support review is needed.
- IP addresses are not used to infer unique people or automatically ban shared networks. The Cloud Run proxy/client-IP problem remains unresolved. Clearing cookies, new devices, multiple independently verified emails and real-person collusion can evade these signals. **No dummy-account-proof claim is made.** Manual review, monitoring, a support/appeals process and operational limits remain necessary.
- At most two referrals per inviter/day and 25 across the program/day can pay out. Limits are transactional across instances. A daily limit delays payout until a later check; it does not revoke account access. The ten-referral cap is separate. No undisclosed paid fraud vendor or live AI reviewer was enabled.
- Private profiles, account reward summaries, claim risk details, activity summaries, reward evidence and admin decision reasons use the existing authenticated encryption. Invitation mappings, UID relationships, timestamps, keyed abuse identifiers and accounting amounts remain operational metadata protected by deny-all browser rules and IAM. An inviter sees counts and their own rewards, never the new member's profile, identity, lyrics, tool names or activity dates.
- reCAPTCHA Enterprise introduces trusted third-party browser code and device/interaction assessment data. It initializes only on an opted-in referral mutation, without automatic token refreshing. The app does not send drafts or prompts to it, but third-party script trust remains part of the browser threat model. Review Google's terms, privacy disclosures and assessment costs before launch. [Firebase Enterprise integration](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)

## Setup required before enabling

1. Register the intended web app/domains with Firebase App Check and reCAPTCHA Enterprise; test actual browser scores, privacy consent, cookie behavior and CSP. Put only the **public** site key in build-time `VITE_FIREBASE_APPCHECK_SITE_KEY`. The four existing Firebase frontend variables remain required. Do not put any server secret into a Vite variable or `project.toml`.
2. Configure runtime `REFERRAL_APPCHECK_APP_IDS` as the comma-separated allowlist of exact app IDs. Consuming tokens requires the runtime service account's appropriate App Check token-verifier permission. Keep enforcement scoped to these custom referral endpoints; do not blindly enable global Firebase Authentication App Check enforcement because sign-in occurs before optional referral consent/initialization.
3. Generate an independent random 32-byte secret, encode as canonical base64, and place it in Secret Manager as runtime-only `REFERRAL_ABUSE_HMAC_KEY`. Never reuse test fixtures, encryption keys, Firebase config or provider keys. Keep it stable: changing it without a planned migration would break identity deduplication and invalidate cookies. Its migration/rotation requires an explicit reviewed procedure; ordinary private-data encryption key rotation is separate.
4. Review/deploy the deny-all Firestore rules and added ciphertext index exemptions/TTL for rate-limit records. Do not TTL-delete referral identity tombstones, claims or reward ledgers; that would permit repeat rewards. Establish a proportionate retention/account-deletion policy for pseudonymous abuse records and backups before launch, including legal/privacy review as appropriate.
5. Configure `REFERRALS_ENABLED=true` only after live staging validation and reviewing reward economics/caps. Keep `REFERRALS_AUTOMATIC_REWARDS` absent/false initially. Admins can review eligible referrals in Invite & Earn; approval always rechecks real activity and blocks, requires a written reason and writes encrypted evidence. Never approve solely because a count or profile looks plausible.
6. Test complete onboarding, App Check, two-day activity, shared-device review, repeat requests, paid/promo transitions and account switching in staging. Emulator tests substitute synthetic attestation and provider results; they cannot certify production fraud detection, CAPTCHA usability, Stripe configuration or provider costs. No app access depends on scheduled referral processing, but the existing payment recovery and lyric cleanup scaling decision still needs resolution.

GitHub verification runs on pushes to `feat/usage-economy` as well as PRs, using the existing public standard runners. This workflow does not deploy to Google Cloud. No cloud configuration, provider assessment, customer migration or paid build was performed as part of this code change.
