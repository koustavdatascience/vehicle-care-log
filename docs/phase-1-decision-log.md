# Phase 1 Decision Log

## Vehicle Care Log Mobile Application

**Status:** Decisions for pilot implementation  
**Version:** 1.0  
**Decision owners:** Product and Engineering

> **Purpose:** Record the assumptions that are now fixed for the pilot and identify the decisions that are intentionally deferred. These decisions are the contract between Phase 1 scope confirmation and the later data, navigation, notification, and release phases.

## Decision Summary

| ID | Decision | Pilot position | Consequence |
|---|---|---|---|
| D-001 | Product shape | Cross-platform Expo and React Native mobile app for iOS and Android | One shared client; platform-specific permission and notification adapters remain possible. |
| D-002 | Pilot boundary | Reminder-Ready MVP; local records, dashboard, expenses, and local reminders | Cloud account and synchronization are not prerequisites for the pilot. |
| D-003 | Storage | Local-first SQLite database with a repository boundary | Screens never query storage directly; offline use is the default. |
| D-004 | Authentication | No account required for pilot | No auth, session, server ownership, or cloud deletion work in the pilot. |
| D-005 | Cloud sync | Deferred to the connected milestone | Stable UUIDs and sync-ready metadata may be designed early but do not require a server. |
| D-006 | Attachments | Deferred to the connected milestone | No image picker, upload queue, object storage, or attachment permissions in the pilot. |
| D-007 | Launch market | India-first pilot | Default currency is INR; localized strings and additional markets remain future work. |
| D-008 | Units | Kilometres and litres by default | Unit metadata is explicit so conversion can be added without rewriting records. |
| D-009 | Currency storage | Store money as integer minor units plus currency code | Prevents floating-point calculations from determining persisted totals. |
| D-010 | Reminder triggers | Date and/or mileage; either configured condition can make a reminder due | Reminder status derives from current date and current odometer, not a server job. |
| D-011 | Notifications | Device-local notifications only | Scheduling must be deterministic and re-created when reminders or odometer values change. |
| D-012 | Export | Not promised in pilot | Settings must delete local data; JSON/CSV export is a post-pilot feature. |
| D-013 | Privacy | Store only explicitly entered product data locally; avoid payload logging | No location, contacts, telemetry, or opaque data collection. |
| D-014 | Product safety boundary | Record keeping and planning, not diagnosis or safety advice | Copy must avoid claiming that reminders replace manufacturer or professional guidance. |
| D-015 | Minimum OS baseline | Provisional iOS 16 and Android 10 for engineering baseline | Reconfirm against supported Expo and store requirements before publishing. |
| D-016 | Theme | Follow-system theme with semantic tokens for light and dark | UI components must not hard-code screen-specific colors. |
| D-017 | Analytics | Deferred until privacy and event taxonomy review | No product analytics dependency in the MVP core. |
| D-018 | Release path | Development, staging/pilot, then production | Builds must be environment-specific and must not contain production secrets in source. |

## Detailed Decisions

### D-001 — Cross-platform client

**Decision:** Implement one cross-platform Expo and React Native TypeScript application targeting iOS and Android. The app may support a development web target if the framework provides it, but web is not a supported pilot release platform.

**Rationale:** The product is a mobile-first personal log and the visual reference is a phone experience. A shared client reduces duplicated feature work while retaining adapters for platform-specific notifications and secure storage.

**Rejected alternatives:** Separate native iOS and Android applications would increase delivery cost and create avoidable visual and behavior divergence. A web-only application would not meet the mobile-first requirement.

### D-002 — Local-first pilot

**Decision:** The pilot must work without an account and without an active network connection. All core writes and reads use the local data layer.

**Rationale:** Vehicle records are often entered at a service station or workshop. Offline behavior is a product requirement, not merely a failure mode.

**Implication:** Account, sync, cloud backup, and server-side notifications cannot be hidden dependencies of the first install or first record entry.

### D-003 — Data and transaction boundary

**Decision:** Use a local SQLite database behind repositories and domain services. A product screen may request a query or command through a feature-facing interface but may not issue raw SQL.

**Rationale:** This isolates storage decisions, supports migrations, gives tests a stable boundary, and allows later cloud synchronization to add a remote adapter without changing the screen contract.

**Implication:** Domain IDs, timestamps, soft deletes, validation, and transaction behavior must be defined before the dashboard is considered complete.

### D-004 — No account in pilot

**Decision:** Do not require sign-in, email, social login, or account recovery for pilot use.

**Rationale:** Authentication creates a server, security, ownership, and recovery surface that is not needed to validate whether people will maintain vehicle records and use reminders.

**Deferred:** Account creation, ownership rules, session persistence, logout cleanup, and cross-device restoration move to the connected milestone.

### D-005 — Cloud sync deferred but anticipated

**Decision:** Do not build a production cloud sync service in the pilot. Use client-generated UUIDs, timestamps, soft-delete/tombstone-compatible fields, and repository interfaces so later synchronization does not require rewriting domain code.

**Rationale:** Stable local behavior and data correctness are higher-risk dependencies than multi-device access. Building sync before local flows stabilize would compound failure modes.

### D-006 — Attachments deferred

**Decision:** Do not include receipt or vehicle image uploads in the pilot. Optional profile imagery must not be implemented if it introduces an attachment pipeline.

**Rationale:** Attachments require permissions, storage quotas, upload retries, object authorization, deletion cleanup, and privacy review. They are valuable but independent of the core record-keeping validation.

### D-007 — India-first defaults

**Decision:** Use India as the initial launch context, INR as the default currency, kilometres as the default distance unit, and litres as the default fuel quantity unit.

**Rationale:** These defaults are explicit implementation assumptions that unblock forms and dashboard copy. They are preferences, not constraints on the data model.

**Implication:** Every monetary record stores a currency code, and every unit-bearing record stores unit metadata so later localization does not reinterpret historical data.

### D-008 — Reminder semantics

**Decision:** A reminder may be date-based, mileage-based, or both. If both are configured, it becomes due when the earliest applicable condition is reached. A due reminder becomes overdue after its date condition has passed or after the mileage threshold is exceeded, subject to the chosen product wording.

**Rationale:** Vehicle maintenance is commonly driven by time or mileage. Treating either condition as sufficient is understandable and works offline.

**Implication:** Updating a vehicle odometer must recalculate the affected reminders and reschedule local notifications.

### D-009 — Local notifications

**Decision:** Schedule notifications on the device. Default lead time is seven days before a date-based reminder, with configurable values of one, seven, fourteen, thirty, or same-day where the platform supports the schedule.

**Rationale:** Local notifications preserve the offline-first promise and avoid a server scheduler in the pilot.

**Implication:** Each reminder schedule must have a deterministic identifier; saves, edits, snoozes, completions, and deletes must cancel and re-create schedules idempotently.

### D-010 — Privacy and deletion

**Decision:** The pilot stores user data locally and exposes a destructive “Delete all local data” action behind confirmation. Logs and crash diagnostics must exclude free-text notes and full record payloads.

**Rationale:** The product contains personal vehicle and spending information. The simplest honest pilot promise is device-local storage with clear local deletion.

**Implication:** The Settings design must distinguish deleting one record, archiving one vehicle, and deleting all local application data.

### D-011 — Export deferred

**Decision:** Do not promise export or restore in the pilot. Document export as a post-pilot backlog item rather than presenting a non-functional control.

**Rationale:** A partial or misleading backup feature would create false confidence. The local data model should remain exportable in principle, but user-facing export waits until the schema and deletion rules are stable.

### D-012 — Product safety boundary

**Decision:** All content and empty states must describe the app as a log and reminder tool. The app must not diagnose a vehicle, state that a repair is safe, or imply that a reminder equals a manufacturer service recommendation.

**Rationale:** The product records user-entered information; it does not inspect the vehicle or validate maintenance quality.

## Deferred Decisions

| Decision | Revisit when | Proposed owner |
|---|---|---|
| Account provider and recovery | Before connected milestone | Engineering and Product |
| Sync conflict policy | Before first multi-device beta | Engineering |
| Object storage provider | Before attachment implementation | Engineering |
| JSON/CSV export format | Before export implementation | Product and Engineering |
| Supported OS expansion | Before public store release | Engineering and Release |
| Analytics event taxonomy | During hardening phase | Product and Privacy |
| Localization roadmap | Before a second launch market | Product |

## Phase 1 Exit Statement

The pilot scope, technical assumptions, privacy posture, defaults, reminder behavior, and deferred feature boundary are now explicit. No unresolved Phase 1 decision is expected to require changing the local schema, primary navigation, or notification strategy before Phase 4, provided that the product remains within the pilot boundary.
