# Local Setup and Environment Configuration

Vehicle Care Log is a **local-first Expo application**. A person can create vehicles and record fuel, service, repairs, expenses, and reminders without an account or network connection. The optional account path is only needed for cloud backup, restore, and attachment upload.

| Requirement | Supported baseline | Why it matters |
|---|---:|---|
| Node.js | 22.x | Matches the repository toolchain. |
| pnpm | 9.12.0 | Pinned in `package.json`. |
| Expo SDK | 54 | Provides the React Native runtime and config plugins. |
| iOS | 16.0+ | Declared by Expo build properties. |
| Android | API 29+ | Declared by Expo build properties. |

## Start locally

Install the locked dependency graph and start the offline-capable mobile bundle:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Use `pnpm dev:full` only when developing the optional server-backed sync path. The standard `pnpm dev` command intentionally starts Metro alone, so normal local vehicle logging does not depend on a server.

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the local-first Expo bundle. |
| `pnpm dev:full` | Start Expo and the optional sync server together. |
| `pnpm check` | Run the TypeScript compiler without emitting files. |
| `pnpm lint` | Run the Expo lint configuration. |
| `pnpm test` | Run deterministic Vitest coverage. |
| `pnpm qualify` | Run the required type, lint, and test gate. |
| `pnpm release:config` | Resolve public Expo configuration for a release review. |

## Environment boundary

> **Never place credentials, session tokens, account identifiers, vehicle notes, attachment URIs, or user contact data in an `EXPO_PUBLIC_*` variable.** Expo embeds public values into the mobile bundle.

The configuration loader reads `.env` only when it exists and never overrides values already injected by the execution environment. It maps only app identity and OAuth endpoint metadata into the Expo-public namespace. Server-side secrets remain server-only.

| Variable | Where it belongs | Exposure | Notes |
|---|---|---|---|
| `EXPO_PUBLIC_APP_ENV` | EAS build profile | Public | One of `development`, `staging`, `pilot`, or `production`. |
| `EXPO_PUBLIC_APP_ID` | Build environment | Public | App/platform identifier; never a credential. |
| `EXPO_PUBLIC_OAUTH_PORTAL_URL` | Build environment | Public | Login portal endpoint only. |
| `EXPO_PUBLIC_OAUTH_SERVER_URL` | Build environment | Public | Authentication endpoint only. |
| `JWT_SECRET` | Server deployment | Secret | Signs or verifies server sessions; rotate if exposed. |
| `DATABASE_URL` | Server deployment | Secret | Cloud database connection; never include in the app bundle. |
| `OAUTH_SERVER_URL` | Server deployment | Server-only endpoint | Used by backend integration, not as a secret. |

For a local-only pilot, leave the optional OAuth and server values absent. The app remains usable. For a connected-data pilot, provision secrets in the host’s secret manager rather than committing `.env` files; use values scoped to the intended staging or production environment.

## Configuration review

Resolve and inspect the generated metadata before a native build:

```sh
pnpm release:config
pnpm qualify
```

The expected mobile identity is **Vehicle Care Log**, with Android package and iOS bundle identifier `com.app.vehiclecarelogapp`, deep-link scheme `vehiclecarelog`, portrait orientation, and runtime version policy `appVersion`. Any future identifier change needs a migration decision: changing an installed app’s identifier creates a separate app in both stores.

## Local data reset for development

Use an emulator or simulator reset when a clean install is needed to rehearse migrations. Do not clear storage on a person’s physical device unless they have exported a portable backup or explicitly confirmed that deletion is intended. A local reset removes locally retained records and cannot be reversed by this application.
