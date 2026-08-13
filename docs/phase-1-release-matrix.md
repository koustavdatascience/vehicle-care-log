# Phase 1 Release Matrix

## Vehicle Care Log Mobile Application

**Status:** Engineering baseline  
**Version:** 1.0  
**Scope:** Phase 1 scope confirmation and future release path

> **Purpose:** Define the environments, build intent, access expectations, data policy, and release gates for each stage of the Vehicle Care Log delivery path.

## 1. Environment Matrix

| Environment | Primary purpose | Data policy | Build channel | Expected users | Release owner |
|---|---|---|---|---|---|
| Local development | Feature development, unit tests, device debugging | Synthetic or developer-owned local data only | Local Expo development build | Engineering | Engineering |
| Development preview | Shared review of in-progress features | Resettable test data; no production data | Internal preview build | Product and Engineering | Engineering |
| Staging | Release-candidate validation and migration rehearsal | Synthetic pilot-shaped data; isolated services if connected mode exists | Internal distribution | Engineering, Product, QA | Release owner |
| Pilot | Real-world validation with a small invited group | User-owned device-local data; no cloud account required | TestFlight and Android internal testing | Invited vehicle owners | Product and Release |
| Production | Public application release after pilot gates pass | User data governed by the active product privacy policy | App Store and Google Play release | Public users | Product and Release |

## 2. Pilot Build Definition

The first pilot build includes the local-first experience through the Reminder-Ready MVP:

1. Vehicle profiles with create, edit, archive, and switch behavior.
2. Fuel, service, and repair records with persistence and edit/delete behavior.
3. Dashboard summaries, service history, and expense views.
4. Local reminders with date and mileage triggers.
5. Device-local notifications with permission-denied recovery.
6. Settings for units, currency, notification preferences, and local data deletion.
7. Empty, loading, error, offline, and success states.

The pilot does not include accounts, cloud synchronization, cloud backup, attachments, receipt OCR, payments, telematics, or diagnostic recommendations.

## 3. Build and Configuration Matrix

| Configuration | Local development | Development preview | Staging | Pilot | Production |
|---|---|---|---|---|---|
| Application identifier | Development suffix | Preview suffix | Staging suffix | Pilot identifier | Production identifier |
| Database | Local SQLite | Local SQLite | Local SQLite plus test backend if needed | Local SQLite | Local SQLite; connected backend only after approved milestone |
| Notifications | Local test schedules | Local test schedules | Real device-local schedules | Real device-local schedules | Real device-local schedules |
| Cloud sync | Disabled | Disabled by default | Optional isolated test | Disabled unless separately approved | Deferred until connected release |
| Attachments | Disabled | Disabled | Disabled | Disabled | Deferred until approved |
| Diagnostics | Console-safe, redacted | Redacted preview diagnostics | Structured test diagnostics | Privacy-reviewed diagnostics | Privacy-reviewed diagnostics |
| Data reset | Developer-controlled | Reset between review cycles | Repeatable seeded reset | No automatic reset | User-controlled deletion policy |
| Secrets | Local environment only | Managed preview configuration | Staging secret store | Release configuration | Production secret store |

## 4. Ownership and Approval

| Responsibility | Primary owner | Required approval |
|---|---|---|
| Product scope | Product owner | Product approval |
| Technical architecture | Engineering owner | Engineering approval |
| Visual and interaction quality | Product and design | Product approval |
| Privacy and data deletion | Product and engineering | Privacy review before pilot |
| Build signing and store configuration | Release owner | Release approval |
| Pilot enrollment | Product owner | Product approval |
| Production release | Release owner | Product and engineering sign-off |

## 5. Promotion Gates

A build may move from one environment to the next only when the applicable checks pass.

| Promotion | Required gates |
|---|---|
| Local development to preview | TypeScript, lint, formatting, unit tests, startup smoke test, no committed secrets. |
| Preview to staging | Core navigation, persistence, vehicle switching, record CRUD, and visual review. |
| Staging to pilot | Migration rehearsal, local notification test, deletion test, accessibility pass, privacy review, and no critical defects. |
| Pilot to production | Pilot feedback triage, crash review, core journey success, release smoke test, store metadata, support path, and rollback plan. |

## 6. Pilot Success Measures

The pilot should measure behavior that validates the product boundary rather than vanity metrics. Product and engineering should review whether invited users can complete the core workflows, whether records survive app restarts, whether reminders are understood, and whether expense summaries are trusted.

| Measure | Evidence |
|---|---|
| Setup completion | Invited users create at least one vehicle. |
| Record usefulness | Users record fuel and service or repair activity. |
| Data reliability | No confirmed loss of a saved record across restart or edit. |
| Reminder comprehension | Users can create, receive, and complete or snooze a reminder. |
| Expense clarity | Users can identify the period, vehicle, currency, and source record for a total. |
| Supportability | Testers can recover from denied notifications and validation errors. |

No numeric adoption target is frozen in Phase 1. The pilot is intended to discover workflow and trust issues before committing to public growth metrics.

## 7. Release Packaging Requirements

Every pilot or production candidate must include a build identifier, release notes, known limitations, test evidence, environment configuration summary, migration status, and a contact path for reporting defects. Production credentials and personal data must never be bundled in the repository or release notes.

The release owner must retain the exact commit SHA used to build a submitted binary. A rollback or withdrawal decision must be possible without deleting user data or changing the local schema unexpectedly.

## Phase 1 Exit Statement

The project now has a defined environment path from local development through pilot and production. The pilot is explicitly local-first and excludes cloud-dependent features, which keeps the first release aligned with the approved scope baseline.
