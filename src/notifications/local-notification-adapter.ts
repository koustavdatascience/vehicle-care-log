import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import type { Reminder } from "../domain/models";
import { buildReminderNotificationPlan } from "./reminder-notification-policy";

export type NotificationPermissionState = "granted" | "denied" | "unavailable";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("vehicle-care-reminders", {
      name: "Vehicle care reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
    });
  }
}

export async function requestLocalNotificationPermission(): Promise<NotificationPermissionState> {
  if (Platform.OS === "web") return "unavailable";
  await configureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return "granted";
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted ? "granted" : "denied";
}

export async function syncReminderNotification(
  reminder: Reminder,
  notificationsEnabled: boolean,
  now: Date = new Date(),
): Promise<string | null> {
  if (Platform.OS === "web" || !notificationsEnabled) return null;
  if (reminder.notificationId) await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
  const plan = buildReminderNotificationPlan(reminder, now);
  if (!plan) return null;
  await configureAndroidChannel();
  return Notifications.scheduleNotificationAsync({
    content: { title: plan.title, body: plan.body, data: { reminderId: plan.reminderId, url: plan.url } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: plan.triggerAt, channelId: "vehicle-care-reminders" },
  });
}

export async function cancelReminderNotification(notificationId: string | null): Promise<void> {
  if (Platform.OS !== "web" && notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId);
}
