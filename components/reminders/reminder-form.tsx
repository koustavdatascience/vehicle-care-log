import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { usePreferences } from "@/components/foundation/preferences-provider";
import { useLocalDatabase } from "@/components/foundation/local-storage-provider";
import { DateField } from "@/components/records/date-field";
import { InlineError } from "@/components/ui/vcl-feedback";
import { VclButton } from "@/components/ui/vcl-button";
import { VclField } from "@/components/ui/vcl-field";
import { VclSegmentedControl } from "@/components/ui/vcl-segmented-control";
import { layoutTokens } from "@/constants/design-tokens";
import { requestLocalNotificationPermission, syncReminderNotification } from "@/src/notifications/local-notification-adapter";
import type { Reminder, ReminderDraft, VehicleId } from "@/src/domain/models";
import { LocalReminderRepository } from "@/src/repositories/local-repositories";

type ReminderFormProps = { vehicleId: VehicleId; existing?: Reminder | null; onCancel: () => void; onSaved: (reminder: Reminder, schedulingMessage: string | null) => void };
type Recurrence = Reminder["recurrence"];
const recurrenceOptions: readonly { label: string; value: Recurrence }[] = [{ label: "One time", value: "none" }, { label: "Monthly", value: "monthly" }, { label: "Yearly", value: "yearly" }];

function createReminderId(): string { return `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
function parseInteger(value: string): number | null { return /^\d+$/.test(value.trim()) && Number.isSafeInteger(Number(value)) ? Number(value) : null; }

export function ReminderForm({ vehicleId, existing, onCancel, onSaved }: ReminderFormProps) {
  const database = useLocalDatabase();
  const repository = useMemo(() => new LocalReminderRepository(database), [database]);
  const { preferences } = usePreferences();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [dueOn, setDueOn] = useState<string | null>(existing?.dueOn ?? null);
  const [dueOdometerKm, setDueOdometerKm] = useState(existing?.dueOdometerKm === null || existing?.dueOdometerKm === undefined ? "" : String(existing.dueOdometerKm));
  const [recurrence, setRecurrence] = useState<Recurrence>(existing?.recurrence ?? "none");
  const [leadDays, setLeadDays] = useState(String(existing?.notificationLeadDays ?? preferences.notificationLeadDays));
  const [note, setNote] = useState(existing?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const parsedMileage = dueOdometerKm.trim() ? parseInteger(dueOdometerKm) : null;
    const parsedLeadDays = parseInteger(leadDays);
    if (!title.trim() || (dueOdometerKm.trim() && parsedMileage === null) || parsedLeadDays === null) {
      setError("Enter a title, valid optional due mileage, and whole-number notification lead time.");
      return;
    }
    const draft: ReminderDraft = {
      id: existing?.id ?? createReminderId(), vehicleId, title: title.trim(), dueOn, dueOdometerKm: parsedMileage,
      recurrence, notificationId: existing?.notificationId ?? null, notificationLeadDays: parsedLeadDays, note: note.trim() || null,
      completedAt: null, snoozedUntil: null,
    };
    setSaving(true); setError(null);
    try {
      let saved = existing ? await repository.update(draft) : await repository.create(draft);
      let schedulingMessage: string | null = null;
      if (preferences.notificationEnabled) {
        try {
          const permission = await requestLocalNotificationPermission();
          if (permission === "granted") {
            const notificationId = await syncReminderNotification(saved, true);
            await repository.setNotificationId(saved.id, notificationId);
            saved = { ...saved, notificationId };
          } else {
            schedulingMessage = permission === "denied" ? "Reminder saved. Notifications are denied in device settings." : "Reminder saved. Notifications are unavailable on this platform.";
          }
        } catch { schedulingMessage = "Reminder saved, but its notification could not be scheduled. You can retry from Settings."; }
      }
      onSaved(saved, schedulingMessage);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Reminder could not be saved."); } finally { setSaving(false); }
  };

  return <View style={styles.form}>
    {error ? <InlineError message={error} /> : null}
    <VclField label="Reminder" value={title} onChangeText={setTitle} placeholder="e.g. Renew insurance" />
    <DateField label="Due date" value={dueOn} onChange={setDueOn} optional />
    <VclField label="Due odometer (km)" value={dueOdometerKm} onChangeText={setDueOdometerKm} placeholder="Optional" keyboardType="number-pad" hint="Add a date, a mileage threshold, or both." />
    <VclSegmentedControl label="Repeat" value={recurrence} options={recurrenceOptions} onChange={setRecurrence} />
    <VclField label="Notify this many days before" value={leadDays} onChangeText={setLeadDays} placeholder="7" keyboardType="number-pad" hint="0 to 30 days. Device permission is requested when needed." />
    <VclField label="Note" value={note} onChangeText={setNote} placeholder="Optional" multiline />
    <View style={styles.actions}><VclButton label={existing ? "Save reminder changes" : "Save reminder"} onPress={save} loading={saving} /><VclButton label="Cancel" variant="secondary" onPress={onCancel} disabled={saving} /></View>
  </View>;
}

export function ReminderSchedulingNote({ message }: { message: string | null }) {
  return message ? <Text style={styles.note} accessibilityLiveRegion="polite">{message}</Text> : null;
}

const styles = StyleSheet.create({ form: { gap: layoutTokens.spacing.md }, actions: { gap: layoutTokens.spacing.sm, marginTop: layoutTokens.spacing.xs }, note: { color: "#6B4B00", fontSize: 13, lineHeight: 19 } });
