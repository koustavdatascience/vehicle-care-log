import { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { useLocalDatabase } from "@/components/foundation/local-storage-provider";
import { usePreferences } from "@/components/foundation/preferences-provider";
import { AppHeader } from "@/components/layout/app-header";
import { ReminderForm, ReminderSchedulingNote } from "@/components/reminders/reminder-form";
import { ScreenContainer } from "@/components/screen-container";
import { EmptyState, InlineError, LoadingState } from "@/components/ui/vcl-feedback";
import { VclButton } from "@/components/ui/vcl-button";
import { layoutTokens } from "@/constants/design-tokens";
import { cancelReminderNotification, syncReminderNotification } from "@/src/notifications/local-notification-adapter";
import type { Reminder } from "@/src/domain/models";
import { LocalReminderRepository } from "@/src/repositories/local-repositories";

function tomorrowIso(): string { const date = new Date(); date.setDate(date.getDate() + 1); return date.toISOString().slice(0, 10); }

export default function ReminderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const database = useLocalDatabase();
  const repository = useMemo(() => new LocalReminderRepository(database), [database]);
  const { preferences } = usePreferences();
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); try { setReminder(await repository.findById(id)); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Reminder could not be loaded."); } finally { setLoading(false); } }, [id, repository]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const close = () => router.back();
  const complete = async () => {
    if (!reminder) return;
    try {
      await cancelReminderNotification(reminder.notificationId);
      const result = await repository.complete(reminder.id, new Date().toISOString());
      if (result.nextReminder && preferences.notificationEnabled) {
        const notificationId = await syncReminderNotification(result.nextReminder, true);
        await repository.setNotificationId(result.nextReminder.id, notificationId);
      }
      setNotice(result.nextReminder ? "Reminder completed. Its next recurring reminder is ready." : "Reminder completed.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Reminder could not be completed."); }
  };
  const snooze = async () => {
    if (!reminder) return;
    try { const saved = await repository.snooze(reminder.id, tomorrowIso()); const notificationId = await syncReminderNotification(saved, preferences.notificationEnabled); await repository.setNotificationId(saved.id, notificationId); setNotice("Reminder snoozed until tomorrow."); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Reminder could not be snoozed."); }
  };
  const remove = () => Alert.alert("Delete reminder?", "This removes the reminder and any scheduled local notification.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => { void (async () => { if (!reminder) return; try { await cancelReminderNotification(reminder.notificationId); await repository.softDelete(reminder.id); router.replace("/reminders"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Reminder could not be deleted."); } })(); } }]);
  if (loading) return <ScreenContainer><View style={styles.center}><LoadingState label="Loading reminder" /></View></ScreenContainer>;
  if (!reminder) return <ScreenContainer><View style={styles.center}><AppHeader title="Reminder" onBack={close} /><EmptyState icon="bell" title="Reminder unavailable" message={error ?? "It may have been deleted."} actionLabel="Back to reminders" onAction={() => router.replace("/reminders")} /></View></ScreenContainer>;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><ScrollView contentContainerStyle={styles.content}><AppHeader title={reminder.completedAt ? "Completed reminder" : "Reminder"} subtitle={reminder.completedAt ? "Kept in your local history" : "Edit, complete, or snooze this reminder"} onBack={close} />{error ? <InlineError message={error} /> : null}<ReminderSchedulingNote message={notice} />{reminder.completedAt ? null : <View style={styles.actions}><VclButton label="Mark complete" onPress={complete} /><VclButton label="Snooze to tomorrow" variant="secondary" onPress={snooze} /></View>}<ReminderForm vehicleId={reminder.vehicleId} existing={reminder} onCancel={close} onSaved={(_, message) => { setNotice(message ?? "Reminder updated."); void load(); }} /><VclButton label="Delete reminder" variant="ghost" onPress={remove} /></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: layoutTokens.spacing.md, padding: layoutTokens.spacing.md }, center: { flex: 1, gap: layoutTokens.spacing.md, padding: layoutTokens.spacing.md }, actions: { gap: layoutTokens.spacing.sm } });
