# Phase 3 Design System and Navigation

Phase 3 establishes the product-wide visual and navigation foundation without creating vehicle or record data. The application uses the semantic palette in `theme.config.js`, layout tokens in `constants/design-tokens.ts`, and reusable components under `components/ui` and `components/layout`.

## Route shell

| Route | Purpose in this phase | Status |
|---|---|---|
| Dashboard | Local-first empty dashboard, overview cards, quick-action states, and add-flow entry | Implemented |
| Service | Navigation and no-data state | Placeholder until service workflows |
| Expenses | Navigation and no-data state | Placeholder until reporting workflows |
| Settings | Navigation and no-data state | Placeholder until settings workflows |
| Add record | Modal shell that opens and closes safely | Implemented |
| Vehicle detail | Stack detail shell that returns safely | Implemented |

## Component rules

Interactive elements expose an accessibility role, readable label, pressed treatment, and disabled state. `VclButton`, `VclIconButton`, `VclField`, `VclSegmentedControl`, `VclCard`, and feedback components are the standard primitives for future phases. The dashboard deliberately shows no fabricated mileage, expense, or maintenance values. Persistent vehicles and records begin in Phase 4 and Phase 5.
