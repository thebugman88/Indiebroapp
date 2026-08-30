# MASTER AUDIT

**Date:** 2026-08-23  
**Workspace:** `indieapps`  
**Status:** Prototype portfolio moving toward production platform

## Executive Finding

This workspace contains nine independent Vite + React applications. They are not yet a unified product platform: each has its own package manifest, server assumptions, storage approach, environment file, and deployment behavior. The strongest next move is to establish shared infrastructure decisions before adding more features.

## Verified Strengths

- All projects have a recognizable product surface, README, environment example, and Vite build shape.
- Most Gemini calls are routed through Express server code rather than directly exposing a server-managed key.
- `judgement-zone` now has Firebase Anonymous Auth, Firestore/Storage rule templates, and a local fallback.
- `judgement-zone` passes `npm run lint` and `npm run build`.
- Existing `HANG-OUT_AUDIT.md` already records important WebSocket and Vercel findings.

## Critical Findings

### Platform architecture

- `hang-out` and `meeting-room` rely on long-lived WebSockets and in-memory state. This is not a reliable Vercel deployment model.
- There is no root workspace, shared package, CI matrix, or common deployment contract.
- Several apps use localStorage or IndexedDB as their primary persistence layer.

### Trust and security

- `judgement-zone` still performs review, XP, quota, and aggregate mutations in the browser. Firebase rules are only a baseline and do not make those operations trusted.
- `judgement-zone` uploads currently use browser object URLs; audio and cover art are not durable cross-device assets.
- The royalty extractor intentionally accepts BYOK credentials in the browser. This must be described as user-provided and exposed, never as a secure server secret.
- Public AI routes need authentication, rate limits, request size limits, timeout handling, and abuse logging without logging prompt secrets.

### Product integrity

- `indiebrotherhood-semantic-lab` uses randomized synthesis logic that can look like measured market analysis.
- `hit-analyzer` includes sample tracks and advisory cross-platform metrics that need explicit demo/advisory labeling.
- `lyric-pro-quiz-studio` contains a placeholder ad surface.
- Several products have template or procedural fallbacks that should be labeled when they are not AI or real market data.

### Build and deployment

- Validation has not been reproducibly completed for every app in the current workspace.
- `royalty-&-isrc-metadata-extractor` has a Windows path risk because `&` can interfere with command resolution.
- `indiebrotherhood-artist-assistant` emits an `import.meta` with CommonJS warning.
- Vercel files vary in what they assume is deployed: static Vite output, Express server, or API routes.

## Project Risk Register

| Project | Current posture | First production blocker |
|---|---|---|
| `hang-out` | Realtime prototype | Replace/relocate WebSocket state and AI routes |
| `hit-analyzer_-built-by-indiebrotherhood` | AI analysis prototype | Validate build, protect URL audio ingestion, add durable jobs |
| `indiebrotherhood-artist-assistant` | Large local-first assistant | Sync data, fix server module warning, protect BYOK handling |
| `indiebrotherhood-semantic-lab` | Creative analysis prototype | Remove misleading randomized market claims |
| `judgement-zone` | Best current Firebase foundation | Move trust-sensitive logic server-side; upload to Storage |
| `lyric-pro-quiz-studio` | Server-backed quiz prototype | Remove placeholder monetization and add durable scores |
| `lyric-pro-studio` | AI/template lyric tool | Deploy API correctly; add accounts, quotas, and history |
| `meeting-room` | Realtime prototype | Replace WebSocket/in-memory state for Vercel |
| `royalty-&-isrc-metadata-extractor` | Local-first metadata tool | Secure AI mode, sync catalog, validate Windows/CI build |

## Audit Verdict

Do not call the portfolio production-ready yet. Use `MASTER BUILDS.md` as the implementation sequence, `MASTER CONFIG.md` as the deployment contract, and `TO DOs.md` as the live execution queue. The founder decisions in `Founder check list.md` are gates, not paperwork: they determine whether the apps become one platform or remain separate experiments.

## Remediation checkpoint (2026-08-30)

Security foundation branch replaces founder auto-login/local credentials, requires verified identity and admin claims for protected root APIs, removes unpaid Pro activation, verifies signed Stripe events, persists subscription state, and separates browser/server build artifacts. The raw cross-room WebSocket relay is disabled pending replacement. See `SECURITY-ROLLOUT.md` for the rollout and explicit remaining blockers. This checkpoint does not mark the platform production-ready or imply live credentials/rules were validated.


## Remaining audit remediation (2026-08-30)

The follow-up replaces the disabled raw relay with authenticated room protocols, implements private durable DMs and server-owned Judgment Zone mutations/uploads, removes fabricated analysis/catalog/chart results, and connects missing root AI routes. See `AUDIT-REMEDIATION.md` for all eleven findings and explicit staging/remaining-platform boundaries. This supersedes the first-batch realtime pause and “still open” list, but does not imply production deployment or complete the older platform roadmap.
