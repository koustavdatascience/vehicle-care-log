# Local CSV Export

## Purpose and Availability

Vehicle Care Log can create a **local-only**, spreadsheet-friendly CSV report for one selected vehicle. The report contains selected fuel, service, and repair records and is intended for a user who wants to review their own maintenance history outside the app.

The export flow is available on supported iOS and Android devices. It does not require an account, cloud sync, an AI service, or an internet connection. Browser builds deliberately report that native sharing is unavailable instead of attempting to transmit data through a web download.

## Export Flow

| Step | Behaviour |
|---|---|
| Select scope | The user chooses one vehicle and a local date range: a preset period or a custom inclusive date range with an optional start and end date. |
| Create report | The app reads only that vehicle’s locally stored fuel, service, and repair records, then creates a CSV in the device cache. |
| Share | The device share sheet opens. The user decides whether to share, save, or cancel. |
| Recover | Empty, unsupported, and file/share failures are shown as bounded recovery messages without technical error details. |

> **Important:** After a user selects a destination in the share sheet, that destination app may copy or retain the report under its own privacy practices.

## Privacy Boundary

The CSV is deliberately limited to the following columns: record type, date, odometer in kilometres, category or description, amount in INR, fuel in litres, next-due date, and next-due odometer.

It excludes record IDs, vehicle registration labels, provider or station names, free-text notes, account or owner identifiers, sync state, attachment metadata, diagnostics, and local file paths. The data remains on the device until the user chooses a destination app from the native share sheet.

Temporary reports are written to the app cache rather than persistent document storage. If file creation or sharing fails after a report was written, the app attempts to delete that partial cached file and presents only a generic retry message. Successfully shared reports remain in the system cache long enough for the selected destination app to receive them; operating systems may clear cached files later.

## CSV Format and Spreadsheet Safety

The formatter uses a fixed eight-column order and CRLF line endings. It escapes commas, quotation marks, and line breaks using RFC 4180-compatible CSV quoting. Values that begin with spreadsheet formula prefixes are protected before export. Empty filters return a clear no-records result rather than a blank or header-only report. Custom dates must be valid `YYYY-MM-DD` calendar dates; both boundaries are inclusive, and an end date cannot precede its start date.

## Accessibility and Testing

The Settings action names the export operation, describes that it opens the device share sheet, prevents repeated taps while a report is being prepared, and announces the outcome through a polite alert region. Test on a physical iOS or Android device before a release because the native share sheet is platform-provided.

For deterministic development validation, run:

```bash
pnpm qualify
```

This validates the CSV contract, formatter, local record selection, temporary-file policy, sharing outcomes, Settings recovery messaging, type checking, linting, and the full unit suite.
