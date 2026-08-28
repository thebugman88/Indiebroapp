# Founder check list

Use this document to make product and risk decisions. Sign or date decisions that affect architecture, legal posture, or launch scope.

## Product Direction

- [ ] Which products are core businesses, which are internal tools, and which are experiments?
- [ ] Is IndieBrotherhood one account/platform or a collection of independent apps?
- [ ] Who is the first paying or retained user: artist, judge, producer, manager, or community host?
- [ ] What is the one workflow that must feel exceptional at launch?
- [ ] What features are explicitly out of scope for version one?

## Trust And Policy

- [ ] Who owns submitted audio, lyrics, artwork, reviews, and generated output?
- [ ] What evidence is required for rights ownership and takedown handling?
- [ ] Are anonymous judges allowed, and how do they upgrade accounts?
- [ ] What does a verified judge mean, and who can grant or revoke that status?
- [ ] How are conflicts of interest, self-review, brigading, harassment, and fraud handled?
- [ ] What data is retained, for how long, and how can a user export or delete it?
- [ ] What AI outputs are advisory only, and where must that be disclosed?

## Infrastructure Decisions

- [ ] Select Firebase project IDs for dev, staging, and production.
- [ ] Select the realtime provider or persistent host for `hang-out` and `meeting-room`.
- [ ] Select the account/auth providers beyond anonymous auth.
- [ ] Approve Vercel project layout and domain strategy.
- [ ] Approve the trusted backend boundary: Firebase Functions, Cloud Run, Vercel Functions, or a combination.
- [ ] Approve media retention, maximum upload sizes, and supported formats.
- [ ] Approve monthly budgets and alert thresholds for Firebase, Google Cloud, Gemini, and hosting.

## Launch Gate

- [ ] All production writes are authorized and validated server-side.
- [ ] Security rules have tests and have been reviewed.
- [ ] No production secret appears in source, bundles, logs, or localStorage.
- [ ] All user-facing placeholders, fake metrics, demo controls, and unsupported claims are removed or clearly labeled.
- [ ] Every core workflow has loading, empty, error, retry, and permission states.
- [ ] Backups, restore procedure, monitoring, and incident contacts are documented.
- [ ] Closed beta feedback has been reviewed and prioritized.
- [ ] Founder approves the privacy policy, terms, copyright process, and launch scope.

## Decision Record

| Date | Decision | Owner | Notes |
|---|---|---|---|
|  |  |  |  |
