# ADR-002: Versioned SQLite Is the Device-Only Source of Truth

**Status:** Accepted for Phase 4  
**Date:** 2026-08-13

## Decision

Vehicle Care Log stores pilot data in a single versioned Expo SQLite database. The database has foreign keys enabled, uses write-ahead logging, retains soft-deleted source records and synchronization metadata, and exposes parameterized repository operations. Screens must access data through repository interfaces rather than raw SQL.

The first supported release is **iOS and Android only**. The browser build remains a development surface; Expo documents SQLite web support as alpha and requiring additional WASM and security-header setup, so it is not a persistence acceptance target for the pilot.[1]

## Consequences

The app remains usable without connectivity. A later connected phase can consume `sync_metadata` without migrating the core business records. Money is stored as integer minor units, odometer values as integer kilometres, and dates as ISO calendar strings to avoid floating-point and timezone ambiguity.

## Validation Boundary

All user input is validated before a transaction begins. A record write is parameterized and transactional: a fuel entry, its expense projection, and eligible odometer update succeed or fail together. Duplicate active fuel entries are rejected through an application fingerprint and a partial SQLite unique index. Soft deletion excludes records from normal queries while preserving future sync intent.

## References

[1] [Expo SQLite documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/), accessed 2026-08-13.
