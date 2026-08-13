# Local CSV Export Contract

## Status

This document defines the **Phase 1 contract** for a future local CSV export. The formatter, file creation, sharing experience, and export interface are intentionally outside this phase.

## Contribution Attribution

Before pushing a substantive export phase, the maintainer verifies the local Git author uses the GitHub account’s numeric no-reply address in the form `<numeric-id>+<login>@users.noreply.github.com`. The repository test validates this address format without depending on local Git configuration, so clean CI clones remain reproducible.

## Privacy Boundary

The export is designed to run entirely on the device for **one selected vehicle**. It will not create an account requirement, use cloud sync, send record data to a server, or rely on an AI service.

The CSV will deliberately exclude record identifiers, vehicle registration labels, provider or station names, free-text notes, account or owner identifiers, sync state, attachment metadata, and diagnostics. The user controls the vehicle, record types, and optional inclusive ISO date range to include.

## Planned Columns

| Column | Source | Notes |
|---|---|---|
| Record type | Fuel, service, or repair type | No record ID is exported. |
| Date | `occurredOn` | ISO calendar date. |
| Odometer (km) | `odometerKm` | Displayed in kilometres. |
| Category or description | Sanitised category, issue, or work label | Provider and free-text notes are excluded. |
| Amount (INR) | `amountMinor` and `currency` | Future formatter converts paise to an INR decimal value. |
| Fuel (litres) | `quantityMilliLitres` | Future formatter converts millilitres to litres. |
| Next due date | Service next-due date | Blank when not applicable. |
| Next due odometer (km) | Service next-due odometer | Blank when not applicable. |

## Result States

The future formatter returns either a ready-to-share CSV result with a filename and row count, or an explicit empty state. An empty filter result will not be silently represented as a header-only file.
