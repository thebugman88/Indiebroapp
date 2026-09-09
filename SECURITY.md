# Security maintenance and release boundaries

The root suite is the maintained integrated runtime. Child prototype servers and old Vercel API handlers are not certified by root security tests. Do not expose them publicly without equivalent authentication, quota, input-validation and payment controls.

Provider secrets belong in host secret settings, never in frontend environment variables. Firebase public initialization settings are not authorization. Builds expose only `VITE_FIREBASE_` settings. BYOK credentials in creator settings are stripped before persistence; old stored keys are removed when those settings are loaded. Keys already distributed in historical bundles, browser backups or exports require rotation; this code cannot revoke them.

Report suspected exposure privately to the repository owner. Do not include tokens, private keys, customer data, uploaded audio or payment details in public issues. A monitored external reporting address and response SLA still need founder approval.

On suspected exposure: pause the affected operation, preserve redacted evidence, revoke/rotate the credential at its provider, inspect access and billing history, deploy the fix in staging, then verify before re-enabling it. Do not let AI repair processes change permissions, mint Coins or publish billing code autonomously.

See `SECURITY-ROLLOUT.md` for staging, admin claims, rules and rollback; `ECONOMY-ROLLOUT.md` for payment recovery. Live IAM/rules, browser flows, provider calls, backup restoration, contact ownership and incident response drills remain launch gates.

See `PRIVACY-HARDENING.md` for the encryption threat model, runtime keyring, explicit legacy-data migration, lyric retention, bounded security restrictions and the unresolved Cloud Run recovery decision. Application encryption is not end-to-end encryption and does not make a compromised runtime safe.

See `REFERRALS.md` for server-verified referral qualifications, App Check and privacy setup, manual review, reward limits and promotional Pro accounting. Referral rewards and automatic payouts are disabled by default; browser XP and profile fields never authorize these rewards.
