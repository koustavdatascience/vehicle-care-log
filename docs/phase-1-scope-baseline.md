# Phase 1 Scope Baseline

## Vehicle Care Log Mobile Application

**Status:** Approved implementation baseline  
**Version:** 1.0  
**Owner:** Product and Engineering  
**Platforms:** iOS and Android  
**Default launch market:** India  
**Default language:** English  
**Default currency:** Indian rupee (₹)

> **Purpose:** Freeze the first pilot boundary so that the local data model, navigation structure, notification behavior, and delivery sequence can proceed without a late architectural reset.

## 1. Product Definition

Vehicle Care Log is a personal vehicle record-keeping and reminder application. It helps a vehicle owner maintain vehicle profiles, record fuel purchases, record service and repair work, receive maintenance reminders, and understand expenses over time.

The product is a **record-keeping and planning tool**, not a vehicle diagnostic, safety, insurance, legal, or mechanical-advice service. The app must not imply that a reminder or recorded service replaces professional inspection or manufacturer guidance.

The first pilot will be a local-first mobile application. A user can create and manage vehicle information and activity records without an account or network connection. The supplied visual reference establishes the primary information hierarchy: active vehicle identity, fuel summary, next service, quick actions, recent activity, and expense summaries.

## 2. Pilot Release Boundary

The first pilot release is defined as the **Reminder-Ready MVP**, corresponding to the implementation roadmap milestones M0 through M2. It includes the complete device-only experience through local notifications. Accounts, cloud synchronization, cloud backup, and attachments are deferred until the local data model and write flows are proven.

| Area | Included in pilot | Deferred from pilot |
|---|---|---|
| Vehicle management | Create, edit, archive, switch, and view multiple vehicles | VIN decoding, automatic vehicle import, telematics |
| Fuel tracking | Date, odometer, quantity, price, total cost, station, notes, history | Fuel-card integrations, receipt OCR |
| Service tracking | Service date, odometer, category, provider, cost, notes, history | Provider marketplace, appointment booking |
| Repair tracking | Issue, work performed, date, odometer, provider, cost, notes | Diagnostic-code lookup, remote mechanic advice |
| Reminders | Date or mileage triggers, recurrence, snooze, complete, overdue state | Server-side push, shared reminders |
| Expenses | Monthly totals, category breakdown, vehicle filter, source-record navigation | Tax reporting, accounting integrations |
| Dashboard | Active vehicle, fuel summary, next service, quick actions, recent records | Predictive maintenance and AI recommendations |
| Storage | Local SQLite database and device preferences | Cloud account, cross-device sync, cloud backup |
| Notifications | Local device notifications with configurable lead time | Remote push notifications and multi-device delivery |
| Attachments | No attachment upload in pilot | Photos, receipts, documents, object storage |
| Export | No export promise in pilot; data remains on device | JSON/CSV export and restore package |
| Account | No account required | Sign-in, account linking, logout, ownership APIs |

## 3. Launch Defaults and User Preferences

The initial launch defaults are chosen to match the supplied reference and the intended India-first launch context. All display preferences must be changeable in Settings where the underlying feature is supported.

| Setting | Pilot default | Supported behavior |
|---|---|---|
| Language | English | Architecture remains ready for localization; additional translations are post-pilot. |
| Currency | INR (₹) | Store minor units as integers; display according to the selected currency. |
| Distance | Kilometres | Store odometer as a numeric value with explicit unit metadata. |
| Fuel quantity | Litres | Store quantity with explicit unit metadata. |
| Timezone | Device timezone | Persist timestamps in a consistent format and render in device local time. |
| Reminder lead time | 7 days before due date | User may choose 1 day, 7 days, 14 days, 30 days, or same-day where supported. |
| Reminder trigger | Either date or mileage condition | A reminder becomes due when the first configured condition is met. |
| Theme | Follow system | Light and dark tokens should exist even if a theme selector is deferred. |

The initial default vehicle flow should allow a vehicle to be created with make, model, year, fuel type, and current odometer. Registration details and images are optional fields only if they do not delay the core pilot.

## 4. Privacy and Data Handling Baseline

The pilot stores user-entered vehicle and expense data locally on the device. No account or server is required for core use. The app must not collect contact lists, precise location, driving telemetry, or vehicle identifiers beyond fields the user explicitly enters.

The pilot must provide a Settings action to delete all local application data after an explicit confirmation. Deletion must clear vehicles, records, reminders, preferences, notification registrations, and local caches. Because cloud sync is not included in the pilot, there is no server-side deletion workflow in this release.

Crash reporting and diagnostic logging, if enabled, must exclude free-text notes, registration details, vehicle identifiers, and full record payloads. Analytics are deferred until the privacy and event taxonomy review in the hardening phase. No secrets, production credentials, or personal data may be committed to the repository.

## 5. Explicit Non-Goals

The following are not part of the pilot and must not enter the implementation backlog as implied requirements:

1. Vehicle health diagnosis, fault-code interpretation, or safety recommendations.
2. GPS tracking, automatic trip detection, telematics, or OBD hardware integration.
3. Insurance, road-tax, legal-compliance, or warranty advice.
4. Service-center discovery, marketplace listings, appointment booking, or payments.
5. Receipt scanning, OCR, automatic bank or card transaction import.
6. Social sharing, multi-user collaboration, or shared household accounts.
7. Server-side reminders, cross-device synchronization, or cloud restoration.
8. AI-generated maintenance predictions or cost forecasts.
9. A guarantee that reminders represent manufacturer-prescribed service intervals.

## 6. Product Success Criteria for the Pilot

The pilot is successful when a new user can create a vehicle in under five minutes, record a fuel purchase and a service or repair entry, see those records reflected in the dashboard and expense summary, create a maintenance reminder, receive or simulate a local notification, and continue using the app with network access disabled.

The pilot must not lose user-entered records on app restart, vehicle switching, editing, deletion, or notification permission denial. The product must make the active vehicle and the scope of every expense total unambiguous.

## 7. Approval and Traceability

This baseline implements the scope and decision requirements in the approved [Product Requirements Document](vehicle-care-log-prd.md), the [Technical Architecture Plan](vehicle-care-log-architecture-plan.md), and the supplied [Implementation Plan](vehicle-care-log-implementation-plan.md).

**Phase 1 status:** Ready for engineering foundation work.  
**Next implementation phase:** Phase 2 — Initialize the mobile project and engineering foundation.

## References

[1]: vehicle-care-log-prd.md "Vehicle Care Log Product Requirements Document"

[2]: vehicle-care-log-architecture-plan.md "Vehicle Care Log Technical Architecture Plan"

[3]: vehicle-care-log-implementation-plan.md "Vehicle Care Log Phase-by-Phase Implementation Plan"
