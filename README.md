# Vehicle Care Log

Vehicle Care Log is a cross-platform iOS and Android application for tracking vehicle fuel, service, repairs, reminders, and expenses.

This repository currently contains the approved product planning materials and the completed Phase 1 scope baseline. Implementation is performed one phase at a time, with tests and a GitHub commit required before advancing.

## Repository contents

### Product and architecture documents

- [`docs/vehicle-care-log-prd.md`](docs/vehicle-care-log-prd.md) — Product Requirements Document.
- [`docs/vehicle-care-log-architecture-plan.md`](docs/vehicle-care-log-architecture-plan.md) — Detailed technical architecture plan.
- [`docs/vehicle-care-log-implementation-plan.md`](docs/vehicle-care-log-implementation-plan.md) — Phase-by-phase implementation roadmap.

### Phase 1 scope artifacts

- [`docs/phase-1-scope-baseline.md`](docs/phase-1-scope-baseline.md) — Pilot boundary, defaults, non-goals, privacy baseline, and success criteria.
- [`docs/phase-1-decision-log.md`](docs/phase-1-decision-log.md) — Finalized product and technical decisions, with deferred decisions recorded.
- [`docs/phase-1-release-matrix.md`](docs/phase-1-release-matrix.md) — Development, staging, pilot, and production release path.
- [`docs/phase-1-updated-backlog.md`](docs/phase-1-updated-backlog.md) — Prioritized backlog and acceptance criteria for Phases 2–10.
- [`docs/phase-1-risk-register.md`](docs/phase-1-risk-register.md) — Risks, owners, mitigations, and phase-gate triggers.

### Diagrams and visual reference

- [`diagrams/vehicle-care-log-architecture.png`](diagrams/vehicle-care-log-architecture.png) — Rendered system architecture diagram.
- [`diagrams/vehicle-care-log-architecture.mmd`](diagrams/vehicle-care-log-architecture.mmd) — Editable Mermaid source.
- [`diagrams/vehicle-care-log-reference.png`](diagrams/vehicle-care-log-reference.png) — Original supplied visual reference.

## Phase delivery rule

Each implementation phase must be completed in order. A phase is not complete until its defined features are implemented, edge cases and failure states are tested, defects are fixed, and the result is committed and pushed to GitHub with a descriptive commit message. Later phases must not be started before the prior phase is confirmed complete.

## Pilot boundary

The first pilot is a local-first Reminder-Ready MVP. It includes vehicle profiles, fuel/service/repair records, dashboard and expense views, local reminders, local notifications, settings, and local data deletion. Accounts, cloud synchronization, cloud backup, attachments, telematics, OCR, payments, and diagnostic recommendations are deferred.

## Development status

**Phase 1:** Scope, decisions, release matrix, updated backlog, and risk register prepared.
**Phase 2:** Not started.

## Original planning location

The planning materials were originally prepared under the local `vehicle-care-log-project` folder. Implementation source will be added to this repository root as the mobile project is built.
