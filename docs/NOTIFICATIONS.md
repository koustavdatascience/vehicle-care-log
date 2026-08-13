# Reminder Notifications

Vehicle Care Log schedules **local** reminder notifications. It does not require an account, uses no remote push campaign, and keeps reminder scheduling available when the device is offline.

| Behavior | Implementation |
|---|---|
| Schedule basis | Due date at 09:00 in the device’s local time, minus the reminder’s lead days. |
| Eligibility | Open reminder with a due date and a future trigger time. |
| Completed reminder | No notification plan is created. |
| Snoozed reminder | The snoozed date replaces the original due date for scheduling. |
| Android channel | `vehicle-care-reminders`, created before Android permission prompting. |
| Tap destination | `/reminder/:id`, derived from notification payload `reminderId`. |
| Web | Local notifications are reported as unavailable; no false success state is shown. |

The Android build declares `POST_NOTIFICATIONS` and `SCHEDULE_EXACT_ALARM`. Android 13 and later require a user opt-in prompt. Android notification scheduling also registers the system boot receiver through the Expo notifications module so schedules can be restored after restart. iOS notification permissions do not require a usage-description string, but authorization state must be checked at runtime.

## Device validation

1. Install a signed candidate on Android and iOS hardware; Expo Go and the web preview are not enough for release validation.
2. Enable local reminder notifications from **Settings** and accept permission.
3. Create one future date-based reminder with a short lead interval appropriate for testing.
4. Confirm the Android channel label and permission prompt; on iOS, confirm the system authorization state.
5. Background the app, receive the notification, tap it, and verify the matching reminder opens.
6. Snooze, complete, edit, and delete the reminder, checking that stale scheduled notifications are cancelled or refreshed.
7. Deny permission and verify the app gives a recovery instruction without blocking local record entry.

> Exact alarm behavior can vary with device policy, battery optimization, and OEM settings. Treat the scheduled trigger as a reminder aid, not a safety-critical guarantee.

## Release metadata

The native notification plugin uses the monochrome launcher asset and VCL teal color `#0E7490`, with default channel `vehicle-care-reminders`. Background remote notifications are intentionally disabled because the current product scope is local reminder scheduling rather than remote push.
