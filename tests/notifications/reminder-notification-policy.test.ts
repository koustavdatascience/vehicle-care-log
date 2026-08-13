import { describe, expect, it } from "vitest";

import type { Reminder } from "../../src/domain/models";
import { buildReminderNotificationPlan, notificationReminderId, reminderDeepLink } from "../../src/notifications/reminder-notification-policy";

const reminder: Reminder = {
  id: "reminder-1", vehicleId: "vehicle-1", title: "Renew insurance", dueOn: "2026-09-10", dueOdometerKm: null,
  recurrence: "yearly", notificationId: null, notificationLeadDays: 7, note: null, completedAt: null, snoozedUntil: null,
  createdAt: "2026-08-13T00:00:00.000Z", updatedAt: "2026-08-13T00:00:00.000Z", deletedAt: null, syncState: "local",
};

describe("Phase 7 reminder notification policy", () => {
  it("builds a timezone-local 9am plan at the configured lead-time boundary with a safe deep link", () => {
    const plan = buildReminderNotificationPlan(reminder, new Date(2026, 8, 1, 8, 59, 0));
    expect(plan?.url).toBe("/reminder/reminder-1");
    expect(plan?.triggerAt.getHours()).toBe(9);
    expect(plan?.triggerAt.getMinutes()).toBe(0);
    expect(plan?.triggerAt.getDate()).toBe(3);
    expect(reminderDeepLink("reminder /1")).toBe("/reminder/reminder%20%2F1");
  });

  it("does not schedule expired, completed, date-less, or snoozed reminders before their next valid trigger", () => {
    expect(buildReminderNotificationPlan(reminder, new Date(2026, 8, 3, 9, 0, 0))).toBeNull();
    expect(buildReminderNotificationPlan({ ...reminder, completedAt: "2026-08-13T09:00:00.000Z" }, new Date(2026, 8, 1))).toBeNull();
    expect(buildReminderNotificationPlan({ ...reminder, dueOn: null, recurrence: "none" }, new Date(2026, 8, 1))).toBeNull();
    const snoozed = buildReminderNotificationPlan({ ...reminder, snoozedUntil: "2026-10-10" }, new Date(2026, 9, 1));
    expect(snoozed?.triggerAt.getDate()).toBe(3);
    expect(snoozed?.triggerAt.getMonth()).toBe(9);
  });

  it("extracts only a non-empty reminder id from notification response data", () => {
    expect(notificationReminderId({ reminderId: "reminder-7" })).toBe("reminder-7");
    expect(notificationReminderId({ reminderId: " " })).toBeNull();
    expect(notificationReminderId({ url: "/reminder/reminder-7" })).toBeNull();
    expect(notificationReminderId(null)).toBeNull();
  });
});
