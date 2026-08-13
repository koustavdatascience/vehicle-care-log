# Phase 9 Pilot Quality Gate

Vehicle Care Log remains **usable without an account or network connection**. This hardening pass protects that baseline during pilot testing.

| Area | Acceptance rule | Evidence |
|---|---|---|
| Accessibility | Every primary action exposes a label, state, and hint; fields announce validation errors; feedback announces loading and errors. | Shared VCL controls and manual screen-reader checks on iOS and Android. |
| Dynamic Type and touch | Core text wraps without truncating essential actions at 200% text size; tap targets retain the 44-point minimum. | Portrait-device manual test matrix. |
| Privacy | Tokens, cookies, URLs, identifiers, free text, notes, attachment paths, and response bodies are never logged. | `safe-diagnostics` redaction tests and code review. |
| Offline reliability | Vehicles and records save locally before sync, and a failed sync remains retryable with no local data loss. | SQLite outbox and conflict-recovery tests. |
| Performance | Vehicle-scoped histories use bounded repository queries and `FlatList`; reports do not hydrate unrelated vehicles. | Reporting repository query tests and 1,000-record manual pilot fixture check. |
| Recovery | Unexpected render failures show a privacy-safe retry surface; storage and network failures provide an actionable state. | Error-boundary and repository failure paths. |

## Pilot exit checklist

- Test first-run, no-vehicle, offline-only, linked-account, and denied-notification journeys on iOS and Android.
- Run with VoiceOver and TalkBack enabled; verify labels, state changes, and form-error announcements.
- Test display scaling at the largest supported font size, light and dark themes, and narrow Android widths.
- Verify no sensitive values appear in Metro, device, browser, or CI logs.
- Run `pnpm qualify` locally and require the GitHub Quality Gate on the release candidate.
