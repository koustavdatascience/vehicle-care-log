# Product Requirements Document

## Vehicle Care Log Mobile Application

**Document status:** Draft for product alignment  
**Version:** 1.0  
**Author:** Manus AI  
**Platform:** iOS and Android mobile application  
**Primary reference:** Supplied Vehicle Care Log visual concept [1]

> **Product premise:** Vehicle Care Log gives drivers one reliable place to record fuel, maintenance, repairs, reminders, and vehicle expenses so they can understand vehicle ownership costs and avoid missed service obligations.

---

## 1. Executive Summary

Vehicle Care Log is a cross-platform mobile application for private vehicle owners who want a simple, visual, and dependable way to manage ongoing vehicle care. The product is centered on a dashboard that surfaces the most important current information: fuel status, the next scheduled service, recent expenses, upcoming reminders, and quick actions for adding a new record.

The supplied visual reference establishes the initial product direction. It shows a clean, card-based interface with a primary vehicle summary, a fuel tracker, a next-service card, recent records, quick actions, service history, reminders, and an expenses view with monthly summaries. The product should preserve this information hierarchy while making the workflows functional, fast, and understandable for users who may only open the app briefly after refueling, servicing, or receiving a repair invoice.

The initial release should focus on a single-owner experience with support for multiple vehicles, local or cloud-backed data persistence, configurable reminders, and simple cost reporting. Advanced features such as automatic bank synchronization, workshop integrations, telematics, and community content are outside the MVP unless validated by user research.

## 2. Product Vision

Vehicle Care Log should become the driver’s trusted maintenance memory: a low-friction record of what was done, what it cost, what is due next, and how the vehicle is performing over time.

The experience should feel more like a calm vehicle-health dashboard than an accounting system. Users should be able to answer the following questions within seconds:

| User question | Product response |
|---|---|
| How is my vehicle doing today? | A dashboard summarizing the active vehicle, mileage, fuel, next service, and recent activity. |
| What needs attention next? | Service and reminder cards ordered by urgency and due date. |
| How much am I spending? | Monthly and category-based expense summaries with a clear breakdown. |
| What happened previously? | Searchable service, repair, fuel, and expense history. |
| What should I record now? | Prominent quick actions for fuel, service, repair, and reminder entries. |

## 3. Goals and Non-Goals

### 3.1 Goals

The MVP will make it easy to create and maintain a vehicle profile, record fuel purchases, log service and repair work, create time- or mileage-based reminders, and review vehicle-related expenses. It will present this information through a dashboard modeled on the visual reference, with clear status labels and consistent date, mileage, and currency formatting.

The MVP will also establish trustworthy record keeping. Users should be able to edit or delete incorrect records, see when reminders are overdue, and understand how summary totals are calculated. The application should work well for occasional users and should not require technical knowledge about vehicle maintenance.

### 3.2 Non-Goals for MVP

The MVP will not diagnose vehicle problems, provide safety-critical mechanical advice, guarantee service intervals, or replace a qualified mechanic. It will not automatically connect to a vehicle’s onboard computer, import transactions from financial institutions, book appointments with workshops, sell parts, or support social sharing. These areas may be considered after product-market validation and appropriate safety, legal, and privacy review.

## 4. Target Users and Personas

### Primary persona: The organized owner

The organized owner wants a complete record for routine maintenance, resale preparation, warranty documentation, and budgeting. This user values structured history, reminders, and exportable records but has limited patience for manual data entry.

### Secondary persona: The practical commuter

The practical commuter mainly wants to record fuel purchases and receive reminders for oil changes, inspections, registration, insurance, tires, and other recurring obligations. This user needs the fastest possible entry flow and benefits from sensible defaults.

### Secondary persona: The multi-vehicle household

The multi-vehicle household manages two or more vehicles and needs clear separation of records. This user requires quick vehicle switching, per-vehicle dashboards, and consolidated or vehicle-specific expense views.

### Occasional persona: The resale or handover user

This user may use the application temporarily to reconstruct vehicle history or present a maintenance record to a prospective buyer. They need reliable chronological history and a clean summary of major work performed.

## 5. Core User Journeys

### 5.1 First-time setup

A new user installs the app, creates or skips an account depending on the selected storage model, and adds a vehicle with its make, model, year, registration identifier, current odometer reading, fuel type, and optional image. The app then presents a dashboard with empty-state guidance and suggested first reminders.

### 5.2 Record a fuel purchase

The user taps **Fuel** from the dashboard, enters the amount paid, quantity, price per unit, odometer reading, date, fuel type, and optional notes, then saves. The application updates the vehicle’s fuel history, monthly expense totals, and dashboard summary. If sufficient data exists, it calculates basic fuel-efficiency trends.

### 5.3 Log service or repair work

The user taps **Service** or **Repair**, selects a category, enters the date, odometer reading, description, provider, cost, and optional attachments, then saves. The entry appears in history and contributes to expense reporting. The user may optionally create a follow-up reminder from the same flow.

### 5.4 Respond to a reminder

The user receives an in-app or operating-system notification for an upcoming or overdue item. Opening the reminder shows its details and provides actions to mark it complete, reschedule it, or convert the completion into a service or expense record.

### 5.5 Review monthly expenses

The user opens **Expenses**, selects a month or date range, and views total spending, category distribution, and a chronological list of included records. The user can filter by vehicle and category and open any entry for correction.

## 6. Information Architecture and Navigation

The primary navigation should use four areas, with the dashboard as the default landing screen. The exact navigation treatment may be a bottom tab bar or equivalent platform-native pattern, but the information architecture should remain stable across iOS and Android.

| Area | Purpose | Primary actions |
|---|---|---|
| Dashboard | Provide an at-a-glance view of vehicle health and current obligations. | Add fuel, service, repair, or reminder; switch vehicle; open details. |
| Service & Reminders | Show completed maintenance, repairs, upcoming tasks, and overdue items. | Add record; complete or reschedule reminder; filter history. |
| Expenses | Explain spending by month, category, and vehicle. | Change date range; filter; add or edit expense. |
| More / Settings | Manage vehicles, preferences, notifications, data, and account. | Add vehicle; set currency and units; export or delete data. |

A global vehicle selector should be available from the dashboard and other vehicle-specific views. When only one vehicle exists, the selector may remain visually subtle but should still make the active vehicle clear.

## 7. Functional Requirements

### 7.1 Vehicle profiles

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| VP-01 | Users can create a vehicle profile. | Must | A profile can be saved with make, model, year, fuel type, and current odometer reading. |
| VP-02 | Users can edit and archive a vehicle profile. | Must | Editing does not alter historical records; archived vehicles are hidden by default but remain recoverable. |
| VP-03 | Users can manage multiple vehicles. | Must | Records, reminders, and expense summaries are associated with the correct vehicle. |
| VP-04 | Users can add a vehicle image or choose a default visual. | Should | The image appears in dashboard and vehicle-specific headers without blocking profile creation. |
| VP-05 | Users can store optional identifying details. | Should | Registration identifier, VIN, insurer, purchase date, and notes can be stored as optional fields. |

### 7.2 Dashboard

The dashboard is the primary product surface and should follow the visual reference’s hierarchy: vehicle header, fuel tracker, next service, recent records, quick actions, and a compact expense summary.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| DB-01 | The dashboard shows the active vehicle and current odometer reading. | Must | The active vehicle is unambiguous and can be changed without leaving the dashboard. |
| DB-02 | The dashboard shows a fuel summary. | Must | It displays the latest fuel quantity or amount, latest odometer reading, and a clear path to add fuel. |
| DB-03 | The dashboard shows the next service or reminder. | Must | The nearest upcoming item is shown with due date and/or mileage, plus an overdue state when applicable. |
| DB-04 | The dashboard shows recent records. | Must | Recent service, repair, fuel, and expense activity is listed chronologically. |
| DB-05 | The dashboard provides quick actions. | Must | Fuel, Service, Repair, and Reminder actions are reachable within one tap from the primary screen. |
| DB-06 | The dashboard shows a compact expense summary. | Should | The current period total and category highlights link to the Expenses area. |
| DB-07 | The dashboard supports useful empty states. | Must | A new user sees clear next steps rather than blank cards or misleading totals. |

### 7.3 Fuel tracking

Fuel entries should support manual capture first. The app should avoid requiring every field when a user only wants a quick record, while preserving enough information for later analysis.

Required or recommended fields are date, amount paid, quantity, price per unit, odometer reading, fuel type, station or location, and notes. The user should be able to configure measurement units and currency. The application should calculate derived values only when the data is sufficient and should label estimates clearly.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FU-01 | Users can add a fuel entry. | Must | The entry saves and appears in fuel history and expense totals. |
| FU-02 | Users can edit or delete a fuel entry. | Must | Summary totals and derived metrics recalculate after the change. |
| FU-03 | The app calculates price per unit when possible. | Should | A calculated value is shown only when amount and quantity are present. |
| FU-04 | The app calculates fuel efficiency when possible. | Should | It uses compatible consecutive odometer and quantity records and explains when data is insufficient. |
| FU-05 | Users can view fuel history and trends. | Should | A list is available in MVP; a simple trend chart may be included if it remains readable on small screens. |

### 7.4 Service and repair records

Service and repair records should share a common entry pattern but preserve distinct categories. Examples include oil change, tire rotation, battery, brakes, inspection, registration, insurance, scheduled service, and general repair.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| SR-01 | Users can add service records. | Must | A record can include category, date, mileage, description, cost, provider, and notes. |
| SR-02 | Users can add repair records. | Must | Repair records support problem description, work performed, cost, and provider. |
| SR-03 | Users can attach supporting files or photos. | Should | Users can add at least one image or document when device and storage support it. |
| SR-04 | Users can edit or delete records. | Must | The history and expense totals update consistently. |
| SR-05 | Users can create a reminder after saving a record. | Should | The follow-up reminder can be based on a date, mileage, or both. |
| SR-06 | Users can filter history. | Must | Filters include record type, category, vehicle, and date range. |

### 7.5 Reminders

Reminders should support recurring or one-time vehicle obligations. A reminder may be due on a date, at an odometer threshold, or when either condition is reached. Examples include service, inspection, registration, insurance renewal, tire replacement, and warranty expiration.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| RE-01 | Users can create a reminder. | Must | A reminder can be saved with title, category, vehicle, and date and/or mileage trigger. |
| RE-02 | Users can configure recurrence. | Should | Recurrence supports common intervals such as monthly, yearly, or mileage-based intervals. |
| RE-03 | Users receive reminder notifications. | Must | Notifications can be enabled or disabled and respect the user’s configured lead time. |
| RE-04 | Users can mark reminders complete. | Must | Completion records the completion date and optionally links to a service or expense entry. |
| RE-05 | Users can snooze or reschedule reminders. | Must | A user can choose a later date or mileage without losing the original reminder context. |
| RE-06 | Overdue reminders are visually distinct. | Must | Overdue states use text and accessible visual styling, not color alone. |

### 7.6 Expenses and reporting

Expense reporting should make ownership cost understandable without pretending to be a full accounting product. Categories should include fuel, service, repair, parts, insurance, registration, taxes, cleaning, parking, and other configurable items.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| EX-01 | The app calculates monthly expense totals. | Must | Totals include all eligible records for the selected vehicle and period. |
| EX-02 | Users can view category breakdowns. | Must | The breakdown is legible on mobile and includes a text alternative to any chart. |
| EX-03 | Users can change period and vehicle filters. | Must | A user can select a month or date range and one vehicle or all active vehicles. |
| EX-04 | Users can open source records from a summary. | Must | Tapping a category or item reveals the records contributing to the total. |
| EX-05 | Users can export a vehicle history or expense report. | Could | Export is considered a post-MVP enhancement unless required for resale or warranty workflows. |

### 7.7 Data, account, and synchronization

The initial product decision is whether to support local-only storage, optional account-backed synchronization, or mandatory accounts. The PRD assumes **local-first storage with optional cloud backup or synchronization** as the preferred direction because it supports fast entry and reduces the barrier to first use. The implementation team should validate the storage approach before development.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| DA-01 | Records persist between sessions. | Must | Closing and reopening the app does not lose saved data. |
| DA-02 | Records are associated with a vehicle. | Must | A record cannot silently appear under the wrong vehicle. |
| DA-03 | Users can back up or restore data. | Should | The product communicates backup status and failure states clearly if cloud backup is enabled. |
| DA-04 | Users can delete their data. | Must | Deletion is clearly explained and requires confirmation. |
| DA-05 | The app handles offline entry. | Should | Core record creation works without connectivity when local-first storage is enabled. |

## 8. User Experience and Visual Requirements

The visual direction should be derived from the supplied reference while remaining consistent with native mobile interaction patterns. The interface should use a light background, strong black or near-black typography, blue as the primary accent, compact cards, rounded controls, simple line or filled icons, and restrained use of color for categories and status. The UI should prioritize legibility over decorative detail.

The dashboard should use a vertical scroll layout that allows the user to scan status from top to bottom. Cards should have clear titles, concise supporting labels, and one obvious action. Important states must be expressed through text such as **Due soon**, **Overdue**, or **Completed**, with color serving as reinforcement rather than the only signal.

Entry forms should be optimized for one-handed use. Numeric fields should open an appropriate keyboard, dates should use platform-native date controls, and recurring fields should be hidden behind progressive disclosure where possible. After saving, the app should confirm the result and return the user to a useful context rather than leaving them at an unexplained blank form.

### Visual requirements derived from the reference

| Area | Requirement |
|---|---|
| Brand and title | Use the working name **Vehicle Care Log** unless a different brand name is approved. |
| Dashboard | Use a summary-first layout with vehicle identity, fuel, next service, records, quick actions, and expenses. |
| Cards | Use consistent corner radius, internal spacing, hierarchy, and touch targets. |
| Color | Blue is the primary action color; status colors should be accessible and paired with labels. |
| Typography | Use a highly legible sans-serif with clear size contrast between page title, card title, value, and metadata. |
| Charts | Keep charts simple, readable, and accompanied by totals or labels. |
| Imagery | Vehicle images are optional and must never be required to use core features. |
| Motion | Use brief, functional transitions for save, filter, and reminder state changes; avoid distracting animation. |

## 9. Accessibility and Localization

The app should target WCAG-informed mobile accessibility practices, including sufficient contrast, scalable text support, logical focus order, accessible labels for icons, and touch targets that are comfortable for a wide range of users. All important information conveyed by color must also be conveyed through text, icons, or position.

The application should separate display strings, date formatting, number formatting, units, and currency from core logic. MVP may launch in one language and one default locale, but the data model and UI should not prevent later localization. Users should be able to select distance units, fuel units, and currency independently where practical.

## 10. Data Model Overview

| Entity | Key fields | Relationships |
|---|---|---|
| User | id, email or local identifier, preferences, notification settings | Owns vehicles and records. |
| Vehicle | id, make, model, year, fuel type, odometer, registration details, image | Has many records and reminders. |
| FuelEntry | id, vehicle id, date, quantity, amount, unit price, odometer, fuel type, notes | Belongs to one vehicle; contributes to expenses. |
| ServiceRecord | id, vehicle id, date, odometer, category, description, provider, cost, attachments | Belongs to one vehicle; may complete a reminder. |
| RepairRecord | id, vehicle id, date, odometer, issue, work performed, provider, cost, attachments | Belongs to one vehicle; contributes to expenses. |
| Reminder | id, vehicle id, title, category, date trigger, mileage trigger, recurrence, status | Belongs to one vehicle; may link to a completion record. |
| Expense | id, vehicle id, source record id, category, date, amount, notes | May be generated from fuel, service, or repair records. |
| Attachment | id, record id, file type, URI, created date | Belongs to a record. |

The product should avoid duplicate manual expense entry when an expense can be derived from a fuel, service, or repair record. If a standalone expense is supported, it should be clearly labeled and included in the same reporting system.

## 11. Notifications and Permissions

The app should request notification permission only when the user enables reminders or reaches a clear reminder setup point. The permission explanation should state the benefit in plain language. Camera, photo-library, and file permissions should be requested only when the user chooses to add an image or document.

Notification content should be concise and actionable. It should identify the vehicle, the obligation, and whether it is upcoming or overdue without exposing unnecessary personal information on a locked screen. Users must be able to control notification categories and lead times from settings.

## 12. Analytics and Success Metrics

Product analytics should be privacy-conscious and limited to events needed to evaluate activation, retention, and feature usefulness. The app should not collect sensitive data unrelated to the product’s purpose.

| Objective | Metric | Initial success signal |
|---|---|---|
| Activate new users | Percentage of new users who create a vehicle and save one record | A clear majority of users who complete setup save at least one record. |
| Reduce entry friction | Time from opening add flow to saved record | The median entry time decreases across usability iterations. |
| Build habit | Users who return and add a second record within 30 days | Repeat entry indicates ongoing utility. |
| Make reminders useful | Reminder open, completion, or reschedule rate | Users act on reminders rather than disabling them immediately. |
| Improve cost visibility | Users who open Expenses after recording expenses | Users understand and revisit their spending summary. |
| Maintain trust | Crash-free sessions, sync failure rate, data-loss reports | Reliability issues remain rare and are recoverable when they occur. |

Analytics events should include only necessary metadata such as feature name, success or failure state, and coarse device or app version information. The product should provide a privacy policy and data deletion path before any account-backed analytics or synchronization is enabled.

## 13. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Primary dashboard content should appear quickly after app launch, with loading states for unavailable data and no blocking network dependency for local-first actions. |
| Reliability | A saved record must not be silently lost; failed writes should provide a visible recovery path. |
| Security | Data in transit and cloud-backed data must use appropriate platform and service encryption. Credentials and tokens must not be stored in client code. |
| Privacy | Collect only data needed for vehicle records, reminders, synchronization, and product improvement with user consent. |
| Compatibility | Support current, actively maintained iOS and Android versions selected at implementation kickoff. |
| Maintainability | Use a shared cross-platform codebase where practical, with platform-native controls for dates, notifications, permissions, and accessibility. |
| Observability | Capture actionable crash and error information without logging sensitive record content. |
| Scalability | The data model should support multiple vehicles and growing histories without forcing a redesign of the core entities. |

## 14. MVP Release Scope

The MVP should include vehicle creation and switching, the dashboard, fuel entries, service entries, repair entries, one-time and recurring reminders, monthly expense summaries, editing and deletion, local persistence, configurable units and currency, and notification support. It should also include empty states, validation, accessible status labels, and a basic settings area.

The MVP should not be delayed by advanced charts, workshop integrations, automatic vehicle data import, financial synchronization, resale marketplaces, or complex social features. These can be evaluated after the team observes how users record data and which workflows produce repeat usage.

### MVP acceptance criteria

The MVP is ready for pilot testing when a new user can create a vehicle, record fuel, add a service or repair record, create a reminder, receive or simulate a reminder notification, and view the resulting expense summary without assistance. A user must also be able to correct an erroneous record, switch between two vehicles without cross-contamination of data, and understand the status of upcoming and overdue items.

## 15. Post-MVP Opportunities

Potential subsequent releases may add receipt and document scanning, CSV or PDF export, cloud synchronization across devices, shared household access, service-provider records, maintenance templates by vehicle type, richer fuel-efficiency trends, appointment tracking, warranty and insurance document management, and integration with vehicle telematics. Each feature should be evaluated against privacy, reliability, and the risk of implying mechanical diagnosis or safety guarantees.

## 16. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Manual entry feels tedious | Users abandon the product after setup. | Use quick actions, defaults, progressive disclosure, and optional fields. |
| Reminder dates or mileage are misunderstood | Users miss important obligations. | Use explicit due labels, separate date and mileage triggers, and clear overdue states. |
| Summary totals appear incorrect | Users lose trust in the product. | Show calculation scope, link totals to source records, and test edits and deletions thoroughly. |
| Multi-vehicle records are mixed | Users may make decisions using incorrect history. | Make the active vehicle prominent and require vehicle association for every record. |
| Cloud synchronization creates conflicts | Data may be duplicated or lost. | Start local-first, define conflict behavior before sync, and provide backup status. |
| Charts are difficult to read on small screens | Expense insights become inaccessible. | Prefer labeled summaries and simple charts with text alternatives. |
| The product is mistaken for a diagnostic tool | Users may rely on unsafe assumptions. | Use clear disclaimers and position the app as a record-keeping and reminder tool. |

## 17. Open Product Decisions

The following decisions should be confirmed before implementation begins:

| Decision | Recommended starting point |
|---|---|
| Account requirement | Allow first use without an account; offer optional account-backed backup if feasible. |
| Storage model | Local-first persistence with a clearly defined future synchronization path. |
| Default market and units | Select one launch market, then make currency, distance, and fuel units configurable. |
| Attachment support | Include photo attachments only if storage and backup behavior are defined; otherwise defer. |
| Expense model | Derive expenses from fuel, service, and repair records, with optional standalone expenses later. |
| Reminder triggers | Support date and mileage triggers, with “either condition” behavior documented in the UI. |
| Branding | Confirm whether **Vehicle Care Log** is the final product name and whether the blue visual direction is approved. |
| Export | Defer from MVP unless maintenance history export is a launch requirement. |

## 18. Definition of Done for Product Design

Product design is complete when the team has approved the information architecture, dashboard hierarchy, add-record flows, reminder states, expense summary, vehicle switching behavior, empty states, error states, accessibility behavior, and settings structure. Each core flow should have designs for first use, normal use, validation failure, offline or unavailable-data behavior, and successful completion.

## 19. References

[1]: /home/ubuntu/upload/pasted_file_7C8TkD_image.png "Supplied Vehicle Care Log visual reference"

---

**End of document**
