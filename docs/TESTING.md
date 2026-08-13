# Testing and Release Smoke Tests

The repository uses deterministic Vitest tests for domain rules, SQLite migration/repository contracts, sync behavior, diagnostic redaction, navigation/design contracts, and release configuration. A release candidate must pass the automated gate and the native-device matrix.

| Command | Required outcome |
|---|---|
| `pnpm check` | TypeScript completes with no errors. |
| `pnpm lint` | Expo lint completes with no violations. |
| `pnpm test` | All non-skipped Vitest tests pass. |
| `pnpm qualify` | Runs all three required gates. |
| `pnpm release:config` | Resolves intended public Expo metadata. |
| `pnpm vitest run tests/data/migrations.test.ts` | Verifies fresh, repeat, and failure migration paths. |
| `pnpm vitest run tests/sync/local-sync-repository.test.ts` | Verifies outbox, retry, conflict, and generic failure persistence. |

## Automated regression matrix

| Area | Coverage focus |
|---|---|
| Local data | Schema version ordering, idempotence, repository isolation, soft delete, duplicate fuel prevention. |
| Entry validation | Negative values, invalid dates, future odometer, and malformed records. |
| Reporting | Empty history, cost/distance calculations, bounded selectors, and large local histories. |
| Reminders | Due/overdue boundaries, scheduling plan, deep-link target, cancellation, and permissions states. |
| Sync | Bounded outbox, retries, generic persisted failure, idempotence, conflicts, and account reset. |
| Privacy | Redacted diagnostic attributes, development-only analytics, OAuth launcher/callback recovery, and public environment boundary. |
| Release | Build profile separation, identifiers, versioning, permissions, notification metadata, and deep-link scheme. |

## Signed-candidate smoke matrix

Run the following on a physical iOS device and a physical Android device for each pilot or production candidate. Mark a failure as a release blocker and attach only privacy-safe observations to the issue.

| Journey | Expected result |
|---|---|
| First launch with no data | Helpful empty state; no placeholder metrics or startup error. |
| Add / edit / delete vehicle | Active vehicle remains coherent after restart. |
| Add fuel, service, repair | INR paise, kilometres, and litres display correctly; invalid inputs are rejected. |
| Dashboard / history / expenses | Values derive from real local records and source routes work. |
| Reminder | Permission recovery, schedule refresh, notification tap, snooze, completion, and deletion work. |
| Offline operation | New records remain usable without network; optional sync gives generic recovery only. |
| Backup | Portable export opens a share path; account backup and account restore preserve expected records when configured. |
| Accessibility | VoiceOver/TalkBack labels, focus order, Dynamic Type, high contrast, and loading/error announcements are usable. |
| Upgrade | Previous pilot data survives candidate installation and repeated launches. |

## Evidence

Record build profile, git commit, native build number, device/OS, test date, pass/fail, and a concise non-sensitive note for every candidate. Do not record people’s vehicle registrations, account IDs, attachment contents, OAuth URLs, or raw exception messages in release evidence.
