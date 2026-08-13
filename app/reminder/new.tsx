import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { useActiveVehicle } from "@/components/foundation/vehicle-provider";
import { ReminderForm, ReminderSchedulingNote } from "@/components/reminders/reminder-form";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenContainer } from "@/components/screen-container";
import { EmptyState } from "@/components/ui/vcl-feedback";
import { layoutTokens } from "@/constants/design-tokens";

export default function NewReminderScreen() {
  const { activeVehicle } = useActiveVehicle();
  const close = () => router.back();
  if (!activeVehicle) return <ScreenContainer><View style={styles.center}><AppHeader title="New reminder" onBack={close} /><EmptyState icon="car.fill" title="Choose a vehicle first" message="Reminders are always linked to one active vehicle." actionLabel="Manage vehicles" onAction={() => router.replace("/(tabs)/settings")} /></View></ScreenContainer>;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><ScrollView contentContainerStyle={styles.content}><AppHeader title="New reminder" subtitle={`For ${activeVehicle.nickname}`} onBack={close} /><ReminderForm vehicleId={activeVehicle.id} onCancel={close} onSaved={(_, message) => { if (message) { router.replace({ pathname: "/reminders", params: { notice: message } }); } else router.replace("/reminders"); }} /><ReminderSchedulingNote message={null} /></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: layoutTokens.spacing.md, padding: layoutTokens.spacing.md }, center: { flex: 1, gap: layoutTokens.spacing.md, padding: layoutTokens.spacing.md }, unused: { fontSize: 0 } });
