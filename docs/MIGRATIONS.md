# Local Database Migrations

Vehicle Care Log stores primary records in SQLite on the device. The app applies migrations during startup, before repositories are exposed to the interface. Each migration executes in a transaction and advances `PRAGMA user_version` only after its SQL completes successfully.

| Schema version | Migration | Main additions |
|---:|---|---|
| 1 | `initial-local-first-domain-schema` | Vehicles, fuel, services, repairs, reminders, attachments, expenses, and sync metadata. |
| 2 | `reminder-lifecycle-and-notification-metadata` | Reminder recurrence, scheduled notification identifiers, lead days, notes, and due-date index. |
| 3 | `connected-data-outbox-account-link-and-attachment-queue` | Optional account state, sync outbox/conflicts, attachment queue fields, and retry indexes. |

The current schema version is **3**. Local records use soft-delete timestamps and sync state rather than destructive removal. Fuel records also carry a uniqueness fingerprint to prevent duplicate active entries.

## Authoring a migration

New migrations are append-only. Do not edit a migration that may have been applied on a pilot device.

1. Add a new `Migration` entry with the next integer version in `src/data/migrations.ts`.
2. Keep DDL and the new `PRAGMA user_version` change within the existing transaction mechanism.
3. Add deterministic coverage for a fresh database, upgrade from the immediately previous version, repeated startup, and a database failure.
4. Update this document’s version table and the release checklist.
5. Run `pnpm qualify` before any native build.

| Safe practice | Reason |
|---|---|
| Prefer additive columns, tables, and indexes. | Older local records remain readable. |
| Preserve soft deletes. | Pending cloud deletes can propagate correctly. |
| Back up before any destructive transform. | Device-local SQLite cannot be recovered from an app reset. |
| Make an upgrade idempotent. | Startup can occur more than once after an interrupted launch. |
| Surface a generic recovery state on failure. | Raw SQLite errors must not reach users or persisted diagnostics. |

## Migration rehearsal

Perform this rehearsal for every release candidate with a physical test device or clean emulator:

1. Install the previous signed pilot build and create at least one vehicle, fuel entry, service record, repair, reminder, and attachment metadata record.
2. Export a portable backup and, when the optional account path is enabled, run a successful device backup.
3. Install the candidate over the previous build without clearing application data.
4. Open the app, confirm startup completes, and verify the active vehicle, records, reminder state, and totals remain intact.
5. Restart the app twice. Verify the migration does not reapply and no duplicate rows or duplicate reminder schedules appear.
6. Confirm the current `PRAGMA user_version` is 3 (or the new released version) using the development inspection tooling.
7. Run `pnpm vitest run tests/data/migrations.test.ts` as the deterministic complement to the device rehearsal.

If migration startup fails, stop the release. Preserve the device database and diagnostic event name for investigation, restore from a known-good build only after confirming the downgrade path, and do not ask a pilot user to clear data as the first response.
