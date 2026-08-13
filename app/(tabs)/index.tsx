import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { useLocalDatabase } from "@/components/foundation/local-storage-provider";
import { useActiveVehicle } from "@/components/foundation/vehicle-provider";
import { AppHeader } from "@/components/layout/app-header";
import { SectionHeader } from "@/components/layout/section-header";
import { VehicleSelector } from "@/components/layout/vehicle-selector";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { EmptyState, InlineError, LoadingState, StatusBanner } from "@/components/ui/vcl-feedback";
import { VclCard } from "@/components/ui/vcl-card";
import { VclIconButton } from "@/components/ui/vcl-icon-button";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import type { CareRecordType } from "@/src/reporting/contracts";
import { LocalReportingRepository } from "@/src/reporting/local-reporting-repository";
import { buildDashboardViewModel, expenseTotal, monthRange, type DashboardViewModel } from "@/src/reporting/selectors";

function todayIsoDate(): string { return new Date().toISOString().slice(0, 10); }
function money(amountMinor: number): string { return `₹${(amountMinor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function HomeScreen() {
  const router = useRouter();
  const database = useLocalDatabase();
  const { activeVehicle, error: vehicleError, isLoading: vehiclesLoading, selectVehicle, vehicles } = useActiveVehicle();
  const [dashboard, setDashboard] = useState<DashboardViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeVehicle) { setDashboard(null); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const repository = new LocalReportingRepository(database);
      const range = monthRange(todayIsoDate());
      const [recentActivity, totals, dueServices, fuelEntries] = await Promise.all([
        repository.listActivity({ vehicleId: activeVehicle.id, startOn: null, endOn: null, limit: 5 }),
        repository.listExpenseCategoryTotals(activeVehicle.id, range),
        repository.listDueServices(activeVehicle.id, 5),
        repository.listFuelEntriesForInsight(activeVehicle.id),
      ]);
      setDashboard(buildDashboardViewModel({ vehicle: activeVehicle, periodExpenseMinor: expenseTotal(totals), recentActivity, dueServices, fuelEntries, today: todayIsoDate() }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Dashboard data could not be loaded.");
    } finally { setLoading(false); }
  }, [activeVehicle, database]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const openAdd = (type?: CareRecordType) => router.push({ pathname: "/add-record", params: { type: type ?? "" } });

  if (vehiclesLoading) return <ScreenContainer><View style={styles.center}><LoadingState label="Loading your vehicles" /></View></ScreenContainer>;

  return <ScreenContainer><FlatList
    data={dashboard?.recentActivity ?? []}
    keyExtractor={(item) => `${item.type}:${item.id}`}
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}
    ListHeaderComponent={<View style={styles.header}>
      <AppHeader title="Vehicle Care Log" subtitle="Your local vehicle-care workspace" action={<VclIconButton icon="plus.circle.fill" label="Open add record menu" onPress={() => openAdd()} />} />
      <VehicleSelector label={activeVehicle?.nickname ?? "No vehicle selected"} helperText={activeVehicle ? `${activeVehicle.make} ${activeVehicle.model} · ${activeVehicle.year}` : "Add a vehicle to start recording care activity."} vehicles={vehicles} activeVehicleId={activeVehicle?.id ?? null} onSelectVehicle={(id) => { void selectVehicle(id); }} onManageVehicles={() => router.push("/(tabs)/settings")} />
      <StatusBanner title="Local-first care log" message="Your records stay on this device. Sync and backup arrive after the local MVP." />
      {vehicleError ? <InlineError message={vehicleError} /> : null}
      {error ? <InlineError message={error} /> : null}
      {!activeVehicle ? <EmptyState icon="car.fill" title="Add your first vehicle" message="Create a profile to track fuel, service, repairs, and expenses locally." actionLabel="Manage vehicles" onAction={() => router.push("/(tabs)/settings")} /> : loading || !dashboard ? <LoadingState label="Loading dashboard" /> : <DashboardHeader dashboard={dashboard} onAdd={openAdd} />}
    </View>}
    ListEmptyComponent={activeVehicle && !loading && dashboard ? <EmptyState icon="list.bullet" title="No recent records" message="Fuel fills, services, and repairs for this vehicle will appear here." actionLabel="Add a record" onAction={() => openAdd()} /> : null}
    renderItem={({ item }) => <ActivityRow item={item} onPress={() => router.push({ pathname: "/record/[type]/[id]", params: { type: item.type, id: item.id } })} />}
  /></ScreenContainer>;
}

function DashboardHeader({ dashboard, onAdd }: { dashboard: DashboardViewModel; onAdd: (type?: CareRecordType) => void }) {
  const colors = useColors();
  const statusColor = dashboard.nextService.status === "overdue" ? colors.error : dashboard.nextService.status === "due-soon" ? colors.warning : colors.success;
  return <>
    <SectionHeader title="Care overview" />
    <View style={styles.summaryGrid}>
      <VclCard style={styles.summaryCard}><IconSymbol name="clock.fill" size={20} color={statusColor} /><Text style={[styles.summaryLabel, { color: colors.muted }]}>Next service</Text><Text numberOfLines={1} style={[styles.summaryValue, { color: colors.foreground }]}>{dashboard.nextService.label}</Text><Text style={[styles.summaryDetail, { color: colors.muted }]}>{dashboard.nextService.detail}</Text></VclCard>
      <VclCard style={styles.summaryCard}><IconSymbol name="chart.pie.fill" size={20} color={colors.primary} /><Text style={[styles.summaryLabel, { color: colors.muted }]}>This month</Text><Text style={[styles.summaryValue, { color: colors.foreground }]}>{money(dashboard.periodExpenseMinor)}</Text><Text style={[styles.summaryDetail, { color: colors.muted }]}>Current vehicle · INR</Text></VclCard>
    </View>
    <VclCard style={styles.fuelCard}><IconSymbol name="creditcard.fill" size={20} color={colors.primary} /><View style={styles.flexCopy}><Text style={[styles.summaryLabel, { color: colors.muted }]}>Fuel insight</Text><Text style={[styles.summaryValue, { color: colors.foreground }]}>{dashboard.fuelInsight.label}</Text><Text style={[styles.summaryDetail, { color: colors.muted }]}>{dashboard.fuelInsight.detail}</Text></View></VclCard>
    <SectionHeader title="Quick actions" />
    <View style={styles.quickGrid}><QuickAction icon="creditcard.fill" label="Fuel" onPress={() => onAdd("fuel")} /><QuickAction icon="wrench.and.screwdriver.fill" label="Service" onPress={() => onAdd("service")} /><QuickAction icon="car.fill" label="Repair" onPress={() => onAdd("repair")} /></View>
    <SectionHeader title="Recent activity" />
  </>;
}

function QuickAction({ icon, label, onPress }: { icon: "creditcard.fill" | "wrench.and.screwdriver.fill" | "car.fill"; label: string; onPress: () => void }) { const colors = useColors(); return <VclCard onPress={onPress} accessibilityLabel={`Add ${label.toLowerCase()} record`} style={styles.quickAction}><IconSymbol name={icon} size={22} color={colors.primary} /><Text style={[styles.quickLabel, { color: colors.foreground }]}>{label}</Text></VclCard>; }
function ActivityRow({ item, onPress }: { item: DashboardViewModel["recentActivity"][number]; onPress: () => void }) { const colors = useColors(); return <VclCard onPress={onPress} accessibilityLabel={`Open ${item.type} record: ${item.title}`} style={styles.activity}><View style={styles.flexCopy}><Text style={[styles.activityType, { color: colors.primary }]}>{item.type.toUpperCase()}</Text><Text numberOfLines={1} style={[styles.activityTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.summaryDetail, { color: colors.muted }]}>{item.occurredOn} · {item.odometerKm.toLocaleString("en-IN")} km</Text></View>{item.amountMinor === null ? null : <Text style={[styles.amount, { color: colors.foreground }]}>{money(item.amountMinor)}</Text>}<IconSymbol name="chevron.right" size={20} color={colors.muted} /></VclCard>; }

const styles = StyleSheet.create({ content: { padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.sm, paddingBottom: layoutTokens.spacing.xxl }, header: { gap: layoutTokens.spacing.lg }, center: { flex: 1, justifyContent: "center", padding: layoutTokens.spacing.md }, summaryGrid: { flexDirection: "row", gap: layoutTokens.spacing.sm }, summaryCard: { flex: 1, minHeight: 154, gap: 7 }, fuelCard: { flexDirection: "row", gap: 12, alignItems: "flex-start" }, flexCopy: { flex: 1, gap: 3 }, summaryLabel: { fontSize: 13, fontWeight: "700" }, summaryValue: { fontSize: 17, fontWeight: "800" }, summaryDetail: { fontSize: 12, lineHeight: 17 }, quickGrid: { flexDirection: "row", gap: layoutTokens.spacing.sm }, quickAction: { flex: 1, minHeight: 92, alignItems: "center", justifyContent: "center", gap: 8 }, quickLabel: { fontSize: 13, fontWeight: "800" }, activity: { flexDirection: "row", gap: 12, alignItems: "center" }, activityType: { fontSize: 10, letterSpacing: 0.7, fontWeight: "900" }, activityTitle: { fontSize: 16, fontWeight: "800" }, amount: { fontSize: 14, fontWeight: "800" } });
