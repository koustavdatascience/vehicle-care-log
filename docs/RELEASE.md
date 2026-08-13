# Release Procedure and Incident Recovery

This document covers release preparation only. It does **not** authorize publication. After a checkpoint is created and the release owner has completed the checks below, use the project interface’s **Publish** control for deployment; do not build or publish production artifacts from the sandbox.

## Build profiles

| Profile | Distribution | Channel | Intended use |
|---|---|---|---|
| `development` | Internal development client | `development` | Native feature development. |
| `staging` | Internal | `staging` | Connected-service integration. |
| `pilot` | Internal | `pilot` | Controlled real-device pilot validation. |
| `production` | Store-ready | `production` | Approved public submission. |

The profiles live in `eas.json` and explicitly set `EXPO_PUBLIC_APP_ENV`. Production auto-increments the remote app version. Before any build, confirm that the app identifiers remain `com.app.vehiclecarelogapp`, the deep-link scheme remains `vehiclecarelog`, the icon/splash assets are current, and a version increase is planned when the binary behavior changes.

## Preflight

1. Run `pnpm qualify` and `pnpm release:config` from a clean working tree.
2. Confirm the public Expo config resolves the intended iOS bundle ID, Android package, version identifiers, runtime-version policy, notification plugin, and deep-link intent filter.
3. Provision signing credentials in the organization-controlled Expo/Apple/Google accounts. Do not place certificates, provisioning profiles, keystores, service-account JSON, or store API keys in git, `.env`, or `eas.json`.
4. Configure server secrets only in the deployment secret manager if optional cloud sync is included in the candidate.
5. Complete the signed-device smoke matrix in [TESTING.md](./TESTING.md), including upgrade and restore journeys.
6. Confirm the privacy policy URL, support contact, age rating, data safety disclosures, App Store privacy details, and Play data-safety declarations with the release owner.

## Store listing source text

| Field | Proposed content |
|---|---|
| App name | Vehicle Care Log |
| Short description | Track fuel, maintenance, repairs, reminders, and vehicle expenses. |
| Full description | Keep a local-first record of fuel fills, service work, repairs, reminders, and expenses for your vehicles. Your records work offline, and optional account backup can be linked when you choose. |
| Keywords | vehicle maintenance, fuel log, service reminders, car expenses, mileage |
| Category | Utilities or Productivity (release owner to select the final store taxonomy) |
| Support route | A monitored support URL/email supplied by the release owner before submission. |
| Privacy policy | A stable HTTPS policy URL supplied by the release owner before submission. |

Create original iPhone, iPad (if supported), and Android phone screenshots from a signed pilot build. Do not use seeded real-user data in screenshots. Capture an empty state, dashboard with fictional test records, care history, expense reporting, reminder flow, and optional backup settings; validate all visible amounts are clearly fictional test data.

## Incident recovery

| Incident | Immediate response | Recovery verification |
|---|---|---|
| Startup/migration failure | Halt rollout; preserve the device state; inspect safe diagnostic event names only. | Install a fixed candidate over a copy of affected pilot data and confirm the migration rehearsal. |
| Sync unavailable | Keep local use available; retry when connectivity returns. | Confirm outbox acknowledgement and generic retry state clears after a successful sync. |
| Suspected privacy exposure | Disable affected release/sync path, rotate server credentials if applicable, and investigate without copying raw user data. | Verify redaction tests and public environment contract before resuming. |
| Incorrect notification behavior | Disable reminder notifications in Settings or ship a pilot fix; do not claim time-critical guarantees. | Re-run native permission, schedule, tap, cancel, and restart tests. |
| Lost local device | Explain that recovery requires a previously exported backup or optional account backup. | Restore through the configured account path on a clean device and confirm core records. |

## Release rollback

Native binary rollback is not the same as source rollback. Maintain the last approved pilot build, its git commit, migration version, and release evidence. If a new binary has a local schema migration, validate compatibility before encouraging any downgrade. Use the project’s checkpoint history to restore source only after protecting any production data and deciding the server/data recovery plan.
