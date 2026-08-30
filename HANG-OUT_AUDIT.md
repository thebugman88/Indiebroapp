# Hang Out audit — current guidance

Updated 2026-08-30. The 2026-08-23 prototype audit is historical; its unsafe recommendations are superseded here. Git history preserves the original findings.

## Corrections to the old advice

- Never expose `GEMINI_API_KEY` through Vite `define`, `loadEnv`, or a `VITE_` variable. Browser bundles are public. Only Firebase web initialization values are exposed by the build configuration.
- Socket.io or a Redis adapter does not make a persistent WebSocket server a normal Vercel function. The current root suite needs a persistent Node host. A managed realtime migration still requires a deployment decision.
- Do not treat a successful local demo as production readiness. The old standalone `server.ts` is not covered by the root suite's authentication/payment remediation and must not be deployed publicly as a replacement.
- Model names in a dated audit are not a provider availability guarantee. Verify the configured model using staging credentials before launch.

## Current root integration

`server/realtime.ts` owns authenticated, room-scoped messaging. The unified server exposes the authenticated Gemini endpoints and enforces usage accounting. Sender and moderator identities come from verified authentication, not request payloads. State is in memory and resets with the process; multi-instance durability remains open.

## Build and hosting boundary

The independent build writes browser files to `dist/client` and the legacy server bundle to `dist/server.cjs`. The Vercel output directory points only to `dist/client`; this does not supply API or WebSocket hosting. The root suite is the current integrated runtime. A standalone frontend must be paired with a compatible authenticated backend before release.

`npm run check:apps -- hang-out` checks types, production compilation, and rejects a fake secret marker or backend artifacts in public output. The Windows/Linux matrix installs the app's own lockfile plus root dependencies required by shared imports. No hosting configuration or live credentials are changed by this check.

## Open release gates

Select the realtime host; decide history and retention requirements; test reconnect and moderation with real accounts; verify provider behavior, production IAM and budget alerts. See `MASTER CONFIG.md`, `AUDIT-REMEDIATION.md`, and `TO DOs.md`.
