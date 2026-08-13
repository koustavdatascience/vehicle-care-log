# Phase 10 Release Readiness Record

Phase 10 prepares the application for a controlled pilot and future store submission. It configures build profiles and native metadata, adds operational documentation, and defines evidence-driven release validation. It does not publish a build or invent store credentials.

| Item | Status | Evidence |
|---|---|---|
| Development, staging, pilot, and production profiles | Ready | `eas.json` and release configuration contract. |
| Bundle IDs, version codes, scheme, icon/splash references | Ready | Resolved public Expo configuration. |
| Local notification metadata and deep-link filter | Ready | `app.config.ts`, `constants/oauth.ts`, notification documentation. |
| Local migration rehearsal procedure | Ready | [MIGRATIONS.md](./MIGRATIONS.md). |
| Backup/export and account restore procedure | Ready | [SYNC_PROTOCOL.md](./SYNC_PROTOCOL.md) and [TESTING.md](./TESTING.md). |
| Privacy and data-deletion boundaries | Ready for policy owner review | [PRIVACY.md](./PRIVACY.md). |
| Signed iOS/Android candidate execution | Pending release-owner credentials and physical-device evidence | Follow [RELEASE.md](./RELEASE.md). |
| Store privacy/support URLs and screenshots | Pending release-owner supplied public materials | Follow [RELEASE.md](./RELEASE.md). |

> The production gate remains closed until the pending signed-candidate and store-owner items are evidenced. This protects local data and prevents placeholder compliance claims.
