# Source Directory Conventions

The `src` directory holds domain-oriented application code that does not belong to Expo Router route files. Route files in `app` compose screens and navigation; they should delegate domain work to these boundaries.

| Directory | Responsibility | Introduced in |
|---|---|---|
| `src/config` | Non-secret client configuration, feature gates, and deterministic validation | Phase 2 |
| `src/lib` | Small framework-independent utilities and runtime services | Phase 2 |
| `src/types` | Shared domain types; no React components | Phase 4 |
| `src/features/vehicles` | Vehicle profile use cases, forms, and repositories | Phase 5 |
| `src/features/records` | Fuel, service, and repair use cases | Phase 5 |
| `src/features/reminders` | Reminder calculation, scheduling, and notification adapters | Phase 7 |
| `src/features/reports` | Dashboard, expense, and reporting calculations | Phase 6 |

Code in one feature must use another feature through an exported use case or shared type rather than reaching into its private implementation. Database access is introduced in Phase 4; server and cloud code are deferred until Phase 8.
