import type { Reminder } from "../domain/models";

export interface ReminderNotificationPlan {
  reminderId: string;
  title: string;
  body: string;
  url: string;
  triggerAt: Date;
}

function dateAtNineLocal(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day, 9, 0, 0, 0);
}

export function reminderDeepLink(reminderId: string): string {
  return `/reminder/${encodeURIComponent(reminderId)}`;
}

export function buildReminderNotificationPlan(
  reminder: Reminder,
  now: Date = new Date(),
): ReminderNotificationPlan | null {
  if (reminder.completedAt || !reminder.dueOn) return null;
  const effectiveDueOn = reminder.snoozedUntil ?? reminder.dueOn;
  const dueAt = dateAtNineLocal(effectiveDueOn);
  const triggerAt = new Date(dueAt);
  triggerAt.setDate(triggerAt.getDate() - reminder.notificationLeadDays);
  if (Number.isNaN(triggerAt.valueOf()) || triggerAt <= now) return null;
  return {
    reminderId: reminder.id,
    title: `Vehicle care: ${reminder.title}`,
    body: `Due ${effectiveDueOn}${reminder.dueOdometerKm === null ? "" : ` or ${reminder.dueOdometerKm.toLocaleString("en-IN")} km`}.`,
    url: reminderDeepLink(reminder.id),
    triggerAt,
  };
}

export function notificationReminderId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const reminderId = (data as Record<string, unknown>).reminderId;
  return typeof reminderId === "string" && reminderId.trim() ? reminderId : null;
}
