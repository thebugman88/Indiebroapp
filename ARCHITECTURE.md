# ARCHITECTURE

## Boundary Rules

- Frontends render product workflows and call documented backend contracts.
- Firebase Auth identifies users; Firestore stores durable records; Storage stores media.
- Trusted Functions, Cloud Run, or Vercel API routes own permissions, scoring, quotas, AI secrets, and sensitive mutations.
- Vercel hosts static frontends and compatible serverless endpoints.
- Persistent realtime workloads must use a managed realtime product or a separately hosted process.

## Data Ownership

Every durable record must have an owner, creation/update timestamps, schema version, access policy, deletion policy, and audit requirements. Client state is a cache or draft, not the source of truth for trust-sensitive data.

## Repository Shape

The current workspace has independent projects. Until a monorepo decision is approved, each app must keep its own lockfile and build command, while the root CI layer validates them all. Shared code should be extracted only when ownership and versioning are clear.

## Naming

Use stable lowercase collection and route names, explicit environment prefixes where needed, and versioned API contracts. Do not encode secrets, user names, or mutable business rules into client-generated IDs.

## Change Checklist

Before a cross-project change, update the relevant master document, identify the owning project, define the backend contract, add a focused test, validate the deployment target, and record a rollback path.

## Current build ownership

The root suite now integrates ten child frontends through shared authenticated API contracts. Child manifests and lockfiles remain independent; shared imports require a complete repository checkout and root dependencies. `shared/browserSettings.ts` is owned by root security maintenance and strips provider credentials at the Artist Assistant/RoyaltyOps persistence boundaries. It does not supply authentication or cloud synchronization. See `BUILD-VALIDATION.md` for cross-platform validation, artifact paths and rollback.
