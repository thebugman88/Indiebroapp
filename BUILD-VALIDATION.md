# Build and validation contract

The repository currently contains the root integrated suite and ten child apps. Keep separate manifests and Bun lockfiles; this does not convert the repository to package-manager workspaces or approve separate production deployments.

## Toolchain

- Node: 24.19.0, recorded in `.node-version`; manifests require Node 24.x.
- npm used locally: 11.9.0, for script execution and the pinned Bun launcher.
- Installer/lock format: Bun 1.4.0 in every package's `packageManager` field.
- Install root and each selected app using `npx --yes bun@1.4.0 install --frozen-lockfile --ignore-scripts`.
- Commit the corresponding `bun.lock` with any dependency changes. Do not silently generate competing npm lockfiles. Intentional updates use the same pinned installer without `--frozen-lockfile`, followed by frozen validation.

Child frontends import shared auth/economy utilities from the root. Their build checks therefore install root dependencies and the child package's dependencies. Each child has an explicit TypeScript scope and Vite configuration. This is a full-repository checkout contract; copying a child directory alone is not a supported build.

## Commands

From the root: `npm run lint`, `npm run test:security`, `npm run test:firebase`, `npm run build`, `npm run test:production`.

`npm run check:apps` runs each child typecheck and build. Select one with `npm run check:apps -- hang-out`. It also injects a fake provider-key marker and scans public output to ensure it was not bundled. Server artifacts in public output fail the check. The marker is not a real credential and makes no provider request.

The app matrix in `.github/workflows/app-builds.yml` repeats these child checks on Linux and Windows. The root security workflow remains separate. Workflow files do not configure branch protection or prove a Windows run passed before the commits are published and CI completes.

## Artifact boundary

Server-backed child builds write browser assets to `dist/client` and backend artifacts to `dist/server.cjs`; static-only child builds write `dist`. The root uses `dist/client` as well. Never configure a web host to publish a server-backed app's entire `dist` directory. The legacy child Express servers still need separate security audits; compiling them does not authorize deployment.

## Rollback

Revert the affected build or UI commit if compatibility fails, keeping browser/server separation and secret-injection restrictions intact. Keep billing records and account data. Do not reintroduce simulated rewards or restore credentials from old browser settings. No production database migration is part of this batch.

## Local validation for this batch

Node 24.19.0 / npm 11.9.0 on Linux: root typecheck, 19 unit/security tests, production build and one production smoke test pass. All ten child typechecks/builds and browser secret/artifact checks pass. Existing large-chunk warnings remain. Windows CI, live browser flows and provider/storage checks have not been run; no deployment or production credential changes were made. Firebase emulator tests were not rerun for this build/UI/settings batch.
