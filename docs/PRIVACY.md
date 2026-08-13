# Privacy and Data Handling

Vehicle Care Log is designed to keep everyday vehicle records on the device. The core experience does not require registration or an internet connection. Optional account linking is offered only for backup/restore and attachment synchronization.

| Data category | Default location | Optional transfer | Retention and control |
|---|---|---|---|
| Vehicle profiles and care records | Device SQLite database | Account-linked sync only after user action | Editable and soft-deletable in the app; device reset removes local data. |
| Reminder schedule | Device notification system | None | User can disable notifications and refresh/cancel schedules. |
| Attachments | Device cache/local URI | Signed account-scoped upload after user action | Images/PDFs only, maximum 20 MB. |
| Portable backup | Device document directory / chosen share destination | Only when the user shares it | The user controls the destination and retention. |
| Diagnostics and analytics | Development diagnostics only | No record payloads or identity fields | Sensitive attributes are redacted; production analytics is disabled by default. |

## Safe diagnostics

Diagnostic and analytics helpers redact sensitive key names, including tokens, URLs, attachments, notes, emails, account identifiers, and user identifiers. User-facing recovery notices are generic. Support and engineering teams must not request raw database files, session tokens, OAuth callback URLs, or unredacted screenshot evidence in routine tickets.

## Public build configuration

Values prefixed with `EXPO_PUBLIC_*` are compiled into the mobile application and must be treated as public. Only non-sensitive app and endpoint metadata may use that namespace. Credentials, owner or account identifiers, user data, database URLs with credentials, and signing material must remain in server-side secret storage.

## Required publication materials

Before public distribution, publish a privacy policy at a stable HTTPS URL. It must state the operator’s identity and contact route, the optional nature of cloud backup, categories transferred when sync is enabled, attachment treatment, retention periods, deletion/request route, and any jurisdiction-specific disclosures. Add that URL to App Store Connect and Play Console rather than embedding an unverified placeholder in this repository.

## Deletion requests

Local-only users control records on their device. Users who have enabled optional cloud backup require a documented owner-scoped deletion request that covers cloud records and attachment objects. The current release gate prohibits representing cloud deletion as self-service until that server endpoint and confirmation flow are implemented, tested, and included in the public policy.
