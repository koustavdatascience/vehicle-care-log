# Phase 1 Risk Register

## Vehicle Care Log Mobile Application

**Status:** Phase 1 implementation gate  
**Version:** 1.0  
**Review cadence:** At the end of every implementation phase and before pilot release

> **Purpose:** Identify risks that could invalidate the local-first pilot or force a late change to the schema, navigation, notification behavior, privacy posture, or release path.

## Risk Scoring

Probability and impact are scored from 1 to 5. The risk score is `probability × impact`.

| Score | Classification | Required response |
|---|---|---|
| 1–4 | Low | Monitor in the phase review. |
| 5–9 | Moderate | Assign an owner and mitigation before the dependent phase. |
| 10–16 | High | Validate early; do not pass the dependent phase without an explicit decision. |
| 17–25 | Critical | Stop progression until the risk is reduced or the scope is changed. |

## Active Risks

| ID | Risk | Probability | Impact | Score | Owner | Mitigation | Trigger / response |
|---|---|---:|---:|---:|---|---|---|
| R-001 | The MVP grows into cloud sync, attachments, or integrations before local flows are stable. | 4 | 5 | 20 | Product | Keep connected features outside the pilot baseline and require a scope change for promotion. | New cloud-dependent requirement appears; return to scope review before implementation. |
| R-002 | The local schema does not support stable IDs, edits, soft deletes, or later sync. | 3 | 5 | 15 | Engineering | Freeze entity fields, UUID strategy, timestamps, tombstone-compatible deletes, and migrations before Phase 4. | A later feature needs to reinterpret an existing record; write an ADR and migration test. |
| R-003 | Users enter impossible or inconsistent odometer values, producing misleading efficiency and reminder states. | 4 | 5 | 20 | Product and Engineering | Reject negative values, validate monotonic vehicle odometer progression, distinguish current reading from historical record, and test out-of-order entries. | A record would lower the active odometer or change past calculations; block the write or require explicit correction flow. |
| R-004 | Local notifications are duplicated, missing, or scheduled at the wrong boundary. | 3 | 5 | 15 | Engineering | Use deterministic notification IDs, cancel-and-reschedule on changes, test due/overdue boundaries, timezone changes, permission denial, and app restart. | Duplicate or late notification appears in device testing; stop notification release until reproduced and fixed. |
| R-005 | Users misunderstand expense totals because period, vehicle scope, or currency is unclear. | 3 | 4 | 12 | Product and Design | Display period, active vehicle, currency, empty state, and source-record navigation on every expense summary. | Pilot tester cannot explain a total or trace it to a record; revise copy and acceptance tests. |
| R-006 | The app loses records during a failed write, restart, migration, or storage error. | 2 | 5 | 10 | Engineering | Use repository transactions, migrations, error states, retry behavior, seeded fixtures, and restart tests before Phase 5 exit. | Any confirmed lost record; stop phase progression and run a data-integrity investigation. |
| R-007 | Android and iOS behave differently for safe areas, numeric input, dates, keyboard dismissal, or notifications. | 4 | 4 | 16 | Engineering | Validate each vertical slice on both platforms and use platform adapters for native behavior. | A core journey passes on one platform but not the other; fix before phase completion. |
| R-008 | The visual reference is treated as a static mock and produces dead-end or inaccessible screens. | 3 | 4 | 12 | Design and Engineering | Implement real states, semantic components, labels, pressed states, and empty/error flows before polish. | A button has no complete action or screen reader label; block the design-system gate. |
| R-009 | Device-local data cannot be recovered when a user changes or loses a device. | 4 | 4 | 16 | Product | Do not promise backup or recovery in the pilot; evaluate export and cloud backup as explicit post-pilot features. | A user-facing screen implies recovery; remove the claim or implement the approved recovery feature. |
| R-010 | Free-text notes, vehicle identifiers, or secrets appear in logs, diagnostics, or analytics. | 2 | 5 | 10 | Engineering and Privacy | Redact payloads, defer analytics, keep secrets in environment configuration, and test logging with sensitive fixtures. | Sensitive value appears in a log or crash event; remove the event and conduct a privacy review. |
| R-011 | Default INR, kilometre, and litre assumptions do not fit a future multi-market release. | 3 | 3 | 9 | Product | Persist explicit currency and unit metadata and expose preferences where supported. | Second-market request arrives; add localization and conversion ADR rather than changing historical values. |
| R-012 | The minimum operating-system support target becomes incompatible with the selected Expo SDK or store rules. | 2 | 4 | 8 | Engineering | Treat iOS 16 and Android 10 as provisional and revalidate before signed pilot and production builds. | Toolchain or store requirement changes; update release matrix and test devices. |
| R-013 | Future sync conflict behavior is left implicit and later overwrites user data. | 3 | 5 | 15 | Engineering | Design sync-ready metadata now and require an explicit conflict policy before Phase 8. | Two devices edit the same record; block silent last-write-wins until conflict behavior is approved. |
| R-014 | Notification permission denial makes the reminder feature appear broken. | 3 | 4 | 12 | Product and Engineering | Explain permission value, show in-app due and overdue states, and provide recovery through device settings. | Tester denies permission and cannot find due reminders; fix in-app fallback before pilot. |
| R-015 | Scope is marked complete because the UI renders, even though persistence and edge cases fail. | 3 | 5 | 15 | Release owner | Require phase exit gates, acceptance tests, clean working tree, and commit SHA evidence for every phase. | A phase demo relies on mock data or untested paths; do not advance the plan. |
| R-016 | Mobile project scaffolding or CI uses a dependency version incompatible with the supported Expo template. | 2 | 4 | 8 | Engineering | Use the supported Expo project scaffold, keep dependencies aligned, and run clean-install checks before Phase 2 exit. | Clean install fails or version drift appears; align dependencies before adding features. |

## Top Risks Before Phase 2

The highest-priority risks before project initialization are scope expansion (R-001), odometer integrity (R-003), platform divergence (R-007), and the definition of phase completion (R-015). The scope baseline and backlog keep cloud work outside the pilot; odometer rules must be carried into the domain model; both platforms must be checked for the engineering baseline; and every phase must produce test evidence rather than only a screenshot.

## Review Protocol

At each phase gate, the owner should review whether any trigger has occurred, update probability and impact scores, record new risks, and link the relevant commit or test evidence. A risk may be closed only when the mitigation is implemented and verified, not merely when it is discussed.

## Phase 1 Exit Statement

The material risks affecting scope, local data integrity, notification behavior, privacy, platform compatibility, and phase gating are recorded with owners and response actions. The next phase may begin only after this register is committed with the other Phase 1 artifacts.
