# Phase 11 — Custom CSV Export Date Range

## Objective

Extend the existing local-only CSV export flow with a **custom inclusive date range**. A person can select an optional start date and/or end date for the report without introducing accounts, network access, cloud persistence, or changes to the CSV privacy boundary.

## Scope

The Settings export card will retain the existing preset ranges and add a custom-range selection. The custom flow will offer accessible start and end date inputs, validation before file creation, and a clear return path to the preset range. Only the current in-memory selection is used; the date range is not persisted.

| Requirement | Acceptance criterion |
|---|---|
| Local-first behavior | The selected dates are supplied directly to the existing local CSV service; no request, account, or database migration is introduced. |
| Inclusive boundaries | A record dated on the selected start or end date is included. |
| Partial ranges | Start-only means on/after the chosen date; end-only means on/before the chosen date. |
| Invalid range | An end date earlier than the start date blocks export and shows a bounded recovery message. |
| Valid date form | Inputs accept only canonical `YYYY-MM-DD` ISO calendar dates; invalid dates never reach export selection. |
| Accessibility | Every date field has a descriptive accessible label and hint; dynamic feedback is announced politely. |
| Privacy | Existing record-column exclusions and cache-file lifecycle guarantees remain unchanged. |
| Regression coverage | Deterministic unit tests cover boundaries, partial ranges, invalid dates, range ordering, and the existing export paths. |

## Explicit Non-Goals

This phase will not add a cloud export, background task, telemetry, calendar permissions, multiple vehicle export, PDF output, or changes to the eight-column CSV contract.

## Validation Sequence

The feature will be validated with focused deterministic tests and the project-wide `pnpm qualify` gate before a checkpoint, Git commit, GitHub push, and workflow confirmation.
