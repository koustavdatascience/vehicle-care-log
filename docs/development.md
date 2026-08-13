# Development Guide

## Phase 2 Foundation

The project is an Expo Router application using TypeScript, React Native, NativeWind, and Vitest. The mobile client is intentionally local-first during the pilot. No secret should be placed in an `EXPO_PUBLIC_*` variable, in source control, or in a mobile bundle.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the development services and Expo web runtime. |
| `pnpm check` | Run the TypeScript compiler without emitting files. |
| `pnpm lint` | Run Expo lint checks. |
| `pnpm test` | Run deterministic unit tests once. |
| `pnpm quality` | Run type checks, lint, and tests in sequence. |

## Startup Contract

`src/config/app-config.ts` contains public configuration validation. `src/lib/runtime/launch-state.ts` converts that validation outcome into either a safe first-run state or a visible configuration error. It creates no vehicle, expense, or maintenance records. Persisted local data and recovery behavior begin in Phase 4.

## Public Configuration

The Phase 2 foundation does not require a local environment file. Public, non-secret configuration is defined and validated in `src/config/app-config.ts`. The supported environments are `development`, `staging`, `pilot`, and `production`. Any future secret is supplied through the platform secret-management flow and must never be bundled into the mobile client.

## Quality Gate

Every phase must pass `pnpm quality`, include targeted edge-case tests, and have no unresolved Git changes before it is committed and pushed. Device checks for iOS and Android are recorded alongside the relevant phase when native behavior is introduced.
