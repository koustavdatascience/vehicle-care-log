# Phase 1 Updated Backlog

## Vehicle Care Log Mobile Application

**Status:** Prioritized implementation backlog  
**Version:** 1.0  
**Priority convention:** P0 = required for pilot, P1 = required for a credible post-pilot release, P2 = later enhancement

> **Purpose:** Translate the Phase 1 scope baseline into an implementation-ready backlog. Items are grouped by the phase in which they should be delivered, but each phase should be implemented as a runnable vertical slice.

## 1. Priority Rules

P0 items are required for the first pilot and must not be silently dropped without changing the scope baseline. P1 items support a connected or hardened release after the local-first pilot. P2 items are intentionally deferred and should not displace core data integrity, reminder reliability, or accessibility work.

## 2. Backlog by Phase

### Phase 2 — Mobile Project and Engineering Foundation

| ID | Priority | Backlog item | Acceptance criterion | Dependency |
|---|---|---|---|---|
| P2-001 | P0 | Initialize Expo and React Native TypeScript project | Clean clone installs and launches on iOS and Android development targets. | Scope baseline |
| P2-002 | P0 | Configure app identity and environments | App name, identifiers, icons, splash, environment template, and build profiles are documented. | P2-001 |
| P2-003 | P0 | Add TypeScript strictness, lint, formatting, and tests | Type checks, lint, formatting, unit tests, and a component smoke test run from documented commands. | P2-001 |
| P2-004 | P0 | Establish feature and infrastructure folders | Screens, features, domain, repositories, infrastructure, and tests have documented ownership boundaries. | P2-001 |
| P2-005 | P0 | Add safe startup and error boundary | Startup failure shows a recoverable state and does not expose a blank screen. | P2-001 |
| P2-006 | P0 | Add basic CI workflow | Pull requests run checks without requiring production secrets. | P2-003 |

### Phase 3 — Design System and Navigation Shell

| ID | Priority | Backlog item | Acceptance criterion | Dependency |
|---|---|---|---|---|
| P3-001 | P0 | Create semantic theme tokens | Screens use centralized color, typography, spacing, radius, and elevation tokens. | P2-001 |
| P3-002 | P0 | Implement safe-area screen and app header | Content is not hidden by notches, system bars, or the tab bar. | P3-001 |
| P3-003 | P0 | Implement primary navigation | Dashboard, Service & Reminders, Expenses, and Settings routes open and preserve navigation state. | P3-002 |
| P3-004 | P0 | Build common feedback states | Loading, empty, error, offline, permission-denied, success, and confirmation patterns exist. | P3-001 |
| P3-005 | P0 | Build reusable cards, controls, and form fields | Components expose accessibility labels and pressed, disabled, and validation states. | P3-001 |
| P3-006 | P1 | Add visual regression baseline | Reference-sized screens have captured review evidence for the main visual hierarchy. | P3-003 |

### Phase 4 — Local Domain Model, Database, and Repositories

| ID | Priority | Backlog item | Acceptance criterion | Dependency |
|---|---|---|---|---|
| P4-001 | P0 | Define domain entities and IDs | Vehicle, fuel, service, repair, reminder, expense, attachment placeholder, and sync metadata types use stable UUIDs. | P1 decisions |
| P4-002 | P0 | Implement validation schemas | Invalid dates, negative amounts, impossible odometers, and missing required fields are rejected with field-level errors. | P4-001 |
| P4-003 | P0 | Create SQLite schema and migrations | Fresh install and migration tests create the required tables, indexes, foreign keys, timestamps, and soft-delete fields. | P4-001 |
| P4-004 | P0 | Implement database provider and transaction helper | A single database provider applies migrations and supports atomic transactions. | P4-003 |
| P4-005 | P0 | Implement repository interfaces and local adapters | Features can create, read, update, archive, and delete through repositories without raw SQL in screens. | P4-004 |
| P4-006 | P0 | Implement domain calculations | Expense totals, reminder status, odometer rules, and unit-aware money calculations are deterministic and tested. | P4-002 |
| P4-007 | P0 | Add migration and repository fixtures | Tests can create isolated databases with known vehicles and records. | P4-003 |

### Phase 5 — Vehicles and Core Records

| ID | Priority | Backlog item | Acceptance criterion | Dependency |
|---|---|---|---|---|
| P5-001 | P0 | Create and edit vehicle profiles | User can create, edit, archive, and switch between at least two vehicles. | P4-005 |
| P5-002 | P0 | Add fuel record flow | User can save, edit, delete, and review a fuel record with quantity, cost, date, and odometer. | P4-005 |
| P5-003 | P0 | Add service record flow | User can save, edit, delete, and review service category, date, odometer, provider, cost, and notes. | P4-005 |
| P5-004 | P0 | Add repair record flow | User can save, edit, delete, and review issue, work performed, date, odometer, provider, cost, and notes. | P4-005 |
| P5-005 | P0 | Implement validation and save feedback | Invalid form data remains visible and a failed write offers retry without partial records. | P4-002 |
| P5-006 | P0 | Implement record detail and delete confirmation | A record can be inspected, edited, deleted, and removed from normal lists after confirmation. | P5-002–P5-004 |
| P5-007 | P0 | Verify restart and offline behavior | Records remain available after process restart and with network connectivity disabled. | P5-001–P5-006 |

### Phase 6 — Dashboard, History, Expenses, and Reporting

| ID | Priority | Backlog item | Acceptance criterion | Dependency |
|---|---|---|---|---|
| P6-001 | P0 | Build active vehicle dashboard | Header, odometer, fuel summary, next service, quick actions, and recent records use real local data. | P5-001–P5-004 |
| P6-002 | P0 | Add dashboard empty and unavailable states | A new or incomplete vehicle never displays misleading mock totals. | P6-001 |
| P6-003 | P0 | Build service and repair history | User can view chronological records and open the source detail. | P5-003–P5-004 |
| P6-004 | P0 | Build expense summary | Monthly total, category breakdown, vehicle scope, currency, and source navigation are correct. | P4-006, P5-002–P5-004 |
| P6-005 | P0 | Add period and vehicle filters | Changing the period or vehicle updates every displayed total consistently. | P6-004 |
| P6-006 | P1 | Add fuel-efficiency trend | Trend is shown only when compatible consecutive records provide sufficient data. | P4-006 |

### Phase 7 — Reminders, Notifications, and Settings

| ID | Priority | Backlog item | Acceptance criterion | Dependency |
|---|---|---|---|---|
| P7-001 | P0 | Create and edit reminders | Date, mileage, or combined triggers can be saved and displayed with status. | P4-005 |
| P7-002 | P0 | Implement reminder lifecycle | Reminder supports upcoming, due, overdue, snoozed, completed, and deleted states. | P7-001 |
| P7-003 | P0 | Implement local notification scheduler | A reminder schedule is deterministic, idempotent, and rescheduled after changes. | P7-002 |
| P7-004 | P0 | Handle notification permission states | Denied permission leaves the app usable and provides a clear recovery path. | P7-003 |
| P7-005 | P0 | Handle notification deep links | Tapping a notification opens the correct reminder or completion context. | P7-003 |
| P7-006 | P0 | Add settings and local deletion | Units, currency, lead time, notification preference, and delete-all-local-data behavior work. | P4-005 |
| P7-007 | P0 | Recalculate mileage reminders after odometer updates | Saving a qualifying odometer value changes reminder status and schedule without duplicates. | P4-006, P7-003 |

### Phase 8 — Optional Account, Sync, Attachments, and Backup

| ID | Priority | Backlog item | Acceptance criterion | Dependency |
|---|---|---|---|---|
| P8-001 | P1 | Add optional account and session handling | User can sign in, restore a session, log out, and clear prior user tokens. | Pilot validation |
| P8-002 | P1 | Implement owned cloud schema and APIs | Server validates ownership and rejects unauthorized vehicle or record access. | P8-001 |
| P8-003 | P1 | Implement sync outbox and pull cursor | Offline writes upload once and remote changes converge without duplicate records. | P8-002 |
| P8-004 | P1 | Implement account-linking flow | Device-only data is not overwritten silently when a user links an account. | P8-003 |
| P8-005 | P1 | Add backup and restore | A new device can restore the selected cloud dataset with visible progress and failure recovery. | P8-003 |
| P8-006 | P1 | Add optional attachments | Attachments upload, retry, display, delete, and obey object authorization rules. | P8-002 |

### Phase 9 — Hardening and Automated Testing

| ID | Priority | Backlog item | Acceptance criterion | Dependency |
|---|---|---|---|---|
| P9-001 | P0 | Complete unit and repository coverage | Domain calculations, migrations, repository writes, and reminder transitions have deterministic tests. | Phases 4–7 |
| P9-002 | P0 | Add core end-to-end journeys | Vehicle creation, record entry, dashboard update, reminder, and deletion journeys pass on both platforms. | Phases 5–7 |
| P9-003 | P0 | Complete accessibility pass | Labels, focus order, scalable text, contrast, touch targets, and text chart alternatives are verified. | Phases 3–7 |
| P9-004 | P0 | Test failure and lifecycle states | App restart, backgrounding, denied notifications, database failure, invalid input, and offline behavior are covered. | Phases 4–7 |
| P9-005 | P0 | Review logs and privacy | No sensitive record payloads, notes, or secrets appear in diagnostics. | Phases 4–8 |
| P9-006 | P1 | Add performance budgets | Startup, dashboard render, long history, and sync queues stay within agreed budgets. | Feature complete |

### Phase 10 — Release and Delivery

| ID | Priority | Backlog item | Acceptance criterion | Dependency |
|---|---|---|---|---|
| P10-001 | P0 | Configure signed pilot builds | iOS and Android pilot builds install, launch, and use the intended configuration. | P9 gates |
| P10-002 | P0 | Run migration and release rehearsal | Fresh install, update, database migration, deletion, and notification tests pass. | P9-001–P9-004 |
| P10-003 | P0 | Conduct pilot validation | Invited users complete the core workflows without a blocking defect. | P10-001 |
| P10-004 | P0 | Prepare support and release documentation | Setup, tests, known limitations, release notes, and issue reporting path are complete. | P10-003 |
| P10-005 | P1 | Prepare public store release | Store metadata, privacy materials, screenshots, support path, and rollback plan are approved. | Pilot sign-off |

## 3. Explicitly Deferred Backlog

The following items are intentionally not scheduled for the pilot: vehicle diagnostics, OBD or telematics, GPS tracking, receipt OCR, automatic transaction import, service marketplace, appointment booking, payments, shared accounts, AI recommendations, server push, cloud backup, attachment storage, and automatic VIN decoding.

Deferred items may be reconsidered only through a scope change that updates the baseline, risk register, and acceptance criteria. They should not appear as hidden placeholders in the pilot UI.

## 4. Definition of Done for a P0 Item

A P0 item is complete only when its primary path works on iOS and Android, data is persisted through the approved repository boundary, validation and failure states exist, accessibility labels are present, the relevant tests pass, and the feature is documented well enough for another engineer to maintain.

A UI-only mockup or a workflow backed by hard-coded sample data is not complete. A deferred feature may be shown in planning documents, but it must not present itself as available in the pilot build.

## References

[1]: phase-1-scope-baseline.md "Phase 1 Scope Baseline"

[2]: phase-1-decision-log.md "Phase 1 Decision Log"

[3]: vehicle-care-log-implementation-plan.md "Vehicle Care Log Phase-by-Phase Implementation Plan"
