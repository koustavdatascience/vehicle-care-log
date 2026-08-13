# ADR 008 — Optional Connected Data Preserves Local-First Ownership

## Status

Accepted for Phase 8.

## Decision

Vehicle Care Log remains usable without an account or network connection. Signing in is optional and begins with an explicit **link decision**: upload the data already on this device, download the account’s cloud copy, or postpone linking. The app never silently replaces one dataset with the other.

All source records remain durable in SQLite first. Local writes create or replace a bounded outbox entry keyed by entity type and entity ID. A sync run pushes batches of envelopes and then pulls a monotonically increasing server change cursor. Server records are scoped to the authenticated user and stored as canonical payloads with a tombstone, revision timestamp, and change log entry.

The merge policy is deterministic **latest-update-wins** by ISO-8601 `updatedAt`, with tombstones participating in the same ordering. A stale update is rejected as a conflict and cannot recreate a cloud-deleted record. Repeating an identical envelope is idempotent. Conflicts are preserved locally for review rather than silently discarded.

Attachments are optional and never block a vehicle-care record from saving. The app stores the local URI and upload state in SQLite, obtains a protected upload intent only after authentication, and retries failed uploads through the queue. Object keys are owner-scoped, and download authorization is checked on every request.

## Consequences

- Local-only users retain complete access to records and reminders.
- Cloud features require the existing authenticated session; logout clears account link state and does not expose a prior account’s cloud data.
- The generic canonical server entity store provides an evolvable migration bridge while the local relational model remains the offline source of truth.
- Clock skew can create a visible conflict; automatic resolution never overwrites a newer tombstone.
