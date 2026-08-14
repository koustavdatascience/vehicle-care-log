# Vehicle Care Log — Mobile Interface Design Brief

## Design Intent

Vehicle Care Log is a **calm, practical vehicle-maintenance companion** for drivers who need to record upkeep quickly and understand what needs attention next. The interface is designed for **portrait 9:16 use**, with the highest-frequency actions reachable in the lower half of the screen and iOS-native navigation, typography, spacing, and feedback patterns.

The product should feel like a focused Apple utility rather than a finance spreadsheet. Information is grouped into clear cards, important dates are stated in plain language, and destructive or irreversible actions require confirmation. The first release is local-first, so the application never implies cross-device recovery before that capability exists.

## Screen List and Responsibilities

| Screen | Primary content | Primary actions |
|---|---|---|
| Launch and first-use state | Empty state explaining vehicle care tracking; primary setup action | Add first vehicle; review privacy note |
| Home dashboard | Active vehicle, current odometer, upcoming service, recent fuel record, current-period spend, and quick actions | Change active vehicle; add fuel, service, repair, or reminder; open details |
| Vehicle garage | Compact list of vehicles with make, model, year, registration nickname, and maintenance state | Add, select, edit, archive, or delete a vehicle |
| Vehicle detail | Vehicle header, current odometer, maintenance summary, recent activity, and links to records | Edit vehicle; add a record; open full history |
| Add or edit vehicle | Form for name, make, model, year, fuel type, registration label, and starting odometer | Validate and save; cancel safely |
| Fuel record form | Date, odometer, volume, total cost, station, and optional note | Validate, save, edit, or delete a fuel entry |
| Service record form | Service category, date, odometer, provider, cost, notes, and next-service rule | Save, edit, or delete a service entry |
| Repair record form | Repair category, date, odometer, provider, cost, notes, and repair status | Save, edit, or delete a repair entry |
| Service and repair history | Filterable chronological list with status badges and record summaries | Filter, search, open, edit, or delete a record |
| Expenses and reports | Current-period total, category breakdown, trend summaries, and record drill-down | Change period; select vehicle; open a linked record |
| Reminder detail and editor | Due date or odometer rule, state, notification state, and linked service | Create, update, snooze, complete, or delete a reminder |
| Settings | Units, currency, default vehicle behavior, notification permission state, local data controls, and app information | Update preferences; open system settings; delete local data with confirmation |

## Primary User Flows

### First vehicle setup

The user opens the application to an empty state, taps **Add vehicle**, completes the short form, and lands on a dashboard with an intentionally empty but useful next-step state. The app must not show fabricated cost, mileage, or maintenance data.

### Recording a fuel fill

The user selects **Fuel** from the lower quick-action area, enters a date, odometer, litres, and cost, reviews any validation message, and saves. The app returns to a contextual success state and the new entry appears in history and later in dashboard/report calculations.

### Planning or completing maintenance

The user starts from the dashboard or vehicle detail, selects **Service**, enters the completed work and its next due date or odometer target, then saves. The reminder becomes visible in the service summary and later phases schedule the appropriate local notification.

### Understanding spending

The user opens **Expenses**, selects a month and vehicle scope, reads the total and category split, and can tap a category or record to trace every amount back to its source. A zero-data state should show a plain-language explanation rather than an empty chart.

## Navigation and Interaction Model

The app will use a five-item bottom tab structure: **Home**, **Vehicles**, **History**, **Expenses**, and **Settings**. Vehicle- and record-specific views are pushed from those tabs using native stack transitions. Creation and editing use modal screens with a visible Cancel action and a fixed lower Save button only when the current form can be safely submitted.

On narrow screens, primary actions remain near the thumb zone. Form controls use at least a 44-point target, clear labels above fields, numeric keyboards where applicable, and inline validation directly below the affected input. Every save, delete, permission, and empty state must provide a clear outcome without relying only on color.

## Visual Direction

| Token | Value | Role |
|---|---|---|
| `brandNavy` | `#102A43` | Primary headings, active vehicle emphasis, and high-trust brand anchor |
| `brandBlue` | `#1E6FD9` | Primary action, active tab, links, and focused controls |
| `canvas` | `#F6F8FB` | Main screen background |
| `surface` | `#FFFFFF` | Cards, sheets, forms, and elevated sections |
| `ink` | `#17212B` | Primary text |
| `secondaryInk` | `#5C6B7A` | Supporting labels and metadata |
| `divider` | `#DCE3EA` | Hairline separators and inactive borders |
| `success` | `#16835D` | Completed or on-track maintenance state |
| `warning` | `#B96900` | Due-soon state |
| `danger` | `#C43D3D` | Overdue, destructive, or invalid state |

The typography hierarchy will use platform system fonts with a 28–32 point dashboard title, 20–22 point section titles, 17 point primary row labels, and 13–15 point supporting metadata. Cards use an 18-point radius, modest separation, and no ornamental gradients. Charts and status chips use accessible text labels and patterns so their meaning does not depend on color.

## Accessibility and iOS HIG Commitments

The application supports Dynamic Type, VoiceOver labels and hints, reduced motion, sufficient contrast, safe areas, predictable back navigation, and semantic form errors. The standard iOS navigation bar, native modal behavior, native date selection, and system permission messaging are preferred over custom replacements. Critical values such as date, odometer, currency, and unit are always written in text.

## Phase Boundary

This brief defines the final UX target. Phase 2 establishes the project and engineering foundation only. The theme tokens, tab shell, visual components, and actual screen implementation begin in **Phase 3**; persisted vehicle and record data begin in **Phase 4**.

## UI Refinement — Card-First Local Care Workspace

The post-delivery refresh uses the supplied reference only for its **airy hierarchy, rounded card composition, calm neutral canvas, and restrained motion**. Vehicle Care Log retains its own vehicle-care content, brand colors, and local-first language; it does not reproduce the reference application’s labels, imagery, data, or branding.

| Area | Update | Acceptance criterion |
|---|---|---|
| Vehicle management | The Settings/garage list becomes the sole vertical `FlatList`, with every settings surface moved into its `ListHeaderComponent`. | The user can scroll from the top controls through every saved vehicle on compact portrait devices. |
| Local-first controls | No linked-account, cloud-backup, or sync call-to-action is shown in the primary dashboard or Settings flow. | Core vehicle, reminder, and CSV actions remain available without an account or network. |
| Visual hierarchy | Use a soft neutral canvas, compact header, generous card spacing, clearly separated sections, and a strong lower-thumb primary action. | The main screens read as an intentional mobile workspace rather than a dense settings form. |
| Vehicle selector | Present the active vehicle as a clean elevated selector and use the existing sheet for switching or managing vehicles. | The switcher remains accessible and every affordance has a 44-point minimum target. |
| Opening motion | A single fade-and-rise transition plays once after the application shell becomes ready. | Motion completes within 280ms, does not block interaction, and is disabled when the system requests reduced motion. |
