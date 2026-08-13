# Optional Cloud Sync Protocol

Cloud functionality is **optional**. The application is usable with no account, no server, and no network connection. Linking an account enables a backup/restore path for that account; it does not change the local-first source of interaction.

| Stage | Client behavior | Service boundary |
|---|---|---|
| Local edit | Writes SQLite first with local/pending state. | No network call. |
| Staging | Converts unsynced rows to idempotent outbox envelopes. | Up to 100 local rows are staged per entity scan. |
| Push | Sends due envelopes in bounded batches. | Authenticated `sync.push` accepts 1–50 changes. |
| Pull | Requests changes after the durable cursor. | Authenticated `sync.pull` accepts cursor ≥ 0 and up to 200 changes. |
| Acknowledge | Removes accepted outbox row and marks the local record synced. | Equal versions are successful idempotent no-ops. |
| Retry | Defers the next attempt by one minute. | Persists only a generic recovery string. |

## Envelope and ownership

Each envelope contains an entity type (`vehicle`, `fuel`, `service`, `repair`, `reminder`, or `attachment`), identifier, operation (`upsert` or `delete`), UTC update time, deletion time, and a payload. All server procedures are authenticated and owner-scoped. Attachment object keys are namespaced under the authenticated account.

> **Privacy rule:** raw transport errors, service responses, tokens, URLs, and account identifiers are not retained in local retry fields or shown in the user interface. The local retry message is simply: “Sync unavailable. Retry when connectivity returns.”

## Conflict handling

When an incoming remote change is older than an unsynced local change, the client retains the local row and records a conflict with local and remote payloads. When the local change is equal to or newer than an already-synced record, the incoming change is ignored. Otherwise, the remote change is applied and marked synced.

| Situation | Result |
|---|---|
| Local edit accepted by server | Outbox entry is removed and local state becomes `synced`. |
| Network or server failure | Outbox is retained, attempt count increases, and a generic retry time is saved. |
| Same version received twice | No duplicate record is created. |
| Newer unsynced local record meets remote record | Local record stays in place and a conflict is stored. |
| Newer remote record meets synced local record | Remote record is applied locally. |

## Attachments and backup

The attachment picker accepts images and PDFs up to 20 MB. The upload lifecycle is `queued → uploading → uploaded` or `failed`; a failed upload does not remove its local record. A portable JSON export contains vehicles, fuel entries, service records, repair records, reminders, and attachment metadata using format `vehicle-care-log.backup.v1`.

Portable export is an **export/share capability**. Account restore is performed through the authenticated “Restore account copy” control, which requests a cloud pull. Do not represent portable JSON import as available unless a reviewed import flow has been shipped and rehearsed.

## Data deletion and incident response

Deleting a record is a soft deletion locally so the deletion can synchronize. A person may choose “Keep data on this device only” to unlink the optional account path; that does not erase a cloud copy already created. Before production cloud-sync launch, the service owner must provide an authenticated, owner-scoped account/cloud-data deletion procedure and publish its request path in the privacy policy.

For a sync incident, first verify account status and network connectivity, then retry manually. Inspect only privacy-safe diagnostics and generic retry state. Do not copy logs containing record payloads into tickets. If a server-side deletion or restore is required, confirm the account owner and backup timestamp, record an audit event, preserve the local database until restore is verified, and re-run a pull afterward.
