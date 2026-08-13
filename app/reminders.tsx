import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { useLocalDatabase } from "@/components/foundation/local-storage-provider";
import { useActiveVehicle } from "@/components/foundation/vehicle-provider";
import { AppHeader } from "@/components/layout/app-header";
import { VehicleSelector } from "@/components/layout/vehicle-selector";
import { ScreenContainer } from "@/components/screen-container";
import { EmptyState, InlineError, LoadingState } from "@/components/ui/vcl-feedback";
import { VclButton } from "@/components/ui/vcl-button";
import { VclCard } from "@/components/ui/vcl-card";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import { getReminderStatus, type ReminderStatus } from "@/src/domain/services";
import type { Reminder } from "@/src/domain/models";
import { LocalReminderRepository } from "@/src/repositories/local-repositories";

function todayIso(): string { return new Date().toISOString().slice(0, 10); }
function statusLabel(status: ReminderStatus): string { return status === "due-soon" ? "Due soon" : status.charAt(0).toUpperCase() + status.slice(1); }

export default function RemindersScreen() {
  const { notice } = useLocalSearchParams<{ notice?: string }>();
  const database = useLocalDatabase();
  const repository = useMemo(() => new LocalReminderRepository(database), [database]);
  const { activeVehicle, vehicles, selectVehicle, isLoading: vehiclesLoading } = useActiveVehicle();
  const [reminders, setReminders] = useState<Reminder[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { if (!activeVehicle) { setReminders([]); setLoading(false); return; } setLoading(true); try { setReminders(await repository.listOpenForVehicle(activeVehicle.id)); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Reminders could not be loaded."); } finally { setLoading(false); } }, [activeVehicle, repository]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  if (vehiclesLoading) return <ScreenContainer><View style={styles.center}><LoadingState label="Loading vehicles" /></View></ScreenContainer>;
  return <ScreenContainer><FlatList data={reminders} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={<View style={styles.header}><AppHeader title="Reminders" subtitle="Local care timing for your vehicle" onBack={() => router.back()} /><VehicleSelector label={activeVehicle?.nickname ?? "No vehicle selected"} helperText={activeVehicle ? "Only reminders for this vehicle are shown." : "Choose a vehicle to manage reminders."} vehicles={vehicles} activeVehicleId={activeVehicle?.id ?? null} onSelectVehicle={(vehicleId) => { void selectVehicle(vehicleId); }} onManageVehicles={() => router.push("/(tabs)/settings")} />{notice ? <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text> : null}{error ? <InlineError message={error} /> : null}{activeVehicle ? <VclButton label="New reminder" onPress={() => router.push("/reminder/new")} /> : null}</View>} ListEmptyComponent={!activeVehicle ? <EmptyState icon="car.fill" title="Choose a vehicle" message="Reminders are saved locally per vehicle." actionLabel="Manage vehicles" onAction={() => router.push("/(tabs)/settings")} /> : loading ? <LoadingState label="Loading reminders" /> : <EmptyState icon="bell" title="No open reminders" message="Add a date or mileage reminder to stay ahead of vehicle care." actionLabel="Add reminder" onAction={() => router.push("/reminder/new")} />} renderItem={({ item }) => <ReminderRow reminder={item} currentOdometerKm={activeVehicle?.currentOdometerKm ?? null} onPress={() => router.push({ pathname: "/reminder/[id]", params: { id: item.id } })} />} /></ScreenContainer>;
}

function ReminderRow({ reminder, currentOdometerKm, onPress }: { reminder: Reminder; currentOdometerKm: number | null; onPress: () => void }) { const colors = useColors(); const status = getReminderStatus(reminder, todayIso(), reminder.notificationLeadDays, currentOdometerKm); const due = reminder.snoozedUntil ?? reminder.dueOn; return <VclCard onPress={onPress} accessibilityLabel={`Open reminder ${reminder.title}`} style={styles.row}><View style={styles.copy}><Text style={[styles.status, { color: status === "overdue" ? colors.error : status === "due-soon" ? colors.warning : colors.primary }]}>{statusLabel(status)}</Text><Text style={[styles.title, { color: colors.foreground }]}>{reminder.title}</Text><Text style={[styles.detail, { color: colors.muted }]}>{due ? `Due ${due}` : "Mileage reminder"}{reminder.dueOdometerKm === null ? "" : ` · ${reminder.dueOdometerKm.toLocaleString("en-IN")} km`}{reminder.recurrence === "none" ? "" : ` · ${reminder.recurrence}`}</Text></View></VclCard>; }
const styles = StyleSheet.create({ content: { gap: layoutTokens.spacing.sm, padding: layoutTokens.spacing.md, paddingBottom: layoutTokens.spacing.xxl }, header: { gap: layoutTokens.spacing.md }, center: { flex: 1, justifyContent: "center", padding: layoutTokens.spacing.md }, notice: { color: "#276749", fontSize: 13, lineHeight: 19, fontWeight: "600" }, row: { gap: 6 }, copy: { gap: 3 }, status: { fontSize: 11, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase" }, title: { fontSize: 16, fontWeight: "800" }, detail: { fontSize: 13, lineHeight: 18 } });
