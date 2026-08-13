import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { useLocalDatabase } from "@/components/foundation/local-storage-provider";
import { useActiveVehicle } from "@/components/foundation/vehicle-provider";
import { AppHeader } from "@/components/layout/app-header";
import { SectionHeader } from "@/components/layout/section-header";
import { VehicleSelector } from "@/components/layout/vehicle-selector";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { EmptyState, InlineError, LoadingState } from "@/components/ui/vcl-feedback";
import { VclCard } from "@/components/ui/vcl-card";
import { VclSegmentedControl } from "@/components/ui/vcl-segmented-control";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import type { ActivityFeedItem, CareRecordType } from "@/src/reporting/contracts";
import { LocalReportingRepository } from "@/src/reporting/local-reporting-repository";
import { rangeForPeriod } from "@/src/reporting/selectors";

type RecordFilter = "all" | CareRecordType;
type PeriodFilter = "month" | "quarter" | "year" | "all";
type CategoryFilter = "all" | string;
const recordOptions: readonly { label: string; value: RecordFilter }[] = [{ label: "All", value: "all" }, { label: "Fuel", value: "fuel" }, { label: "Service", value: "service" }, { label: "Repair", value: "repair" }];
const periodOptions: readonly { label: string; value: PeriodFilter }[] = [{ label: "Month", value: "month" }, { label: "3 months", value: "quarter" }, { label: "Year", value: "year" }, { label: "All", value: "all" }];
function todayIsoDate(): string { return new Date().toISOString().slice(0, 10); }
function money(amountMinor: number | null): string | null { return amountMinor === null ? null : `₹${(amountMinor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function ServiceScreen() {
  const router = useRouter();
  const database = useLocalDatabase();
  const colors = useColors();
  const { activeVehicle, isLoading: vehiclesLoading, selectVehicle, vehicles } = useActiveVehicle();
  const [recordFilter, setRecordFilter] = useState<RecordFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [records, setRecords] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const range = useMemo(() => rangeForPeriod(todayIsoDate(), period), [period]);

  const load = useCallback(async () => {
    if (!activeVehicle) { setRecords([]); setCategories([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const repository = new LocalReportingRepository(database);
      const types = recordFilter === "all" ? undefined : [recordFilter];
      const serviceCategory = recordFilter === "service" && category !== "all" ? category : null;
      const [activity, savedCategories] = await Promise.all([
        repository.listActivity({ vehicleId: activeVehicle.id, ...range, types, serviceCategory, limit: 100 }),
        repository.listServiceCategories(activeVehicle.id, range),
      ]);
      setRecords(activity);
      setCategories(savedCategories);
      if (category !== "all" && !savedCategories.includes(category)) setCategory("all");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "History could not be loaded."); } finally { setLoading(false); }
  }, [activeVehicle, category, database, range, recordFilter]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const categoryOptions = useMemo(() => [{ label: "All categories", value: "all" }, ...categories.map((entry) => ({ label: entry, value: entry }))], [categories]);

  if (vehiclesLoading) return <ScreenContainer><View style={styles.center}><LoadingState label="Loading vehicles" /></View></ScreenContainer>;
  return <ScreenContainer><FlatList data={records} keyExtractor={(item) => `${item.type}:${item.id}`} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
    ListHeaderComponent={<View style={styles.header}>
      <AppHeader title="Service & history" subtitle="Chronological care records" />
      <VehicleSelector label={activeVehicle?.nickname ?? "No vehicle selected"} helperText={activeVehicle ? "History is scoped to the selected vehicle." : "Select or create a vehicle to view local care history."} vehicles={vehicles} activeVehicleId={activeVehicle?.id ?? null} onSelectVehicle={(id) => { void selectVehicle(id); }} onManageVehicles={() => router.push("/(tabs)/settings")} />
      {!activeVehicle ? <EmptyState icon="car.fill" title="Choose a vehicle" message="Service history becomes available after a vehicle profile is selected." actionLabel="Manage vehicles" onAction={() => router.push("/(tabs)/settings")} /> : <>
        <VclCard onPress={() => router.push("/reminders")} accessibilityLabel="Open vehicle reminders" style={styles.reminderCard}><View style={styles.flexCopy}><Text style={[styles.type, { color: colors.primary }]}>REMINDERS</Text><Text style={[styles.title, { color: colors.foreground }]}>Upcoming & overdue care</Text><Text style={[styles.detail, { color: colors.muted }]}>Create, snooze, complete, and reschedule local vehicle reminders.</Text></View><IconSymbol name="chevron.right" size={20} color={colors.muted} /></VclCard>
        <SectionHeader title="Filters" />
        <VclSegmentedControl label="Record type" value={recordFilter} options={recordOptions} onChange={(value) => { setRecordFilter(value); if (value !== "service") setCategory("all"); }} />
        <VclSegmentedControl label="Date range" value={period} options={periodOptions} onChange={setPeriod} />
        {recordFilter === "service" && categories.length > 0 ? <VclSegmentedControl label="Service category" value={category} options={categoryOptions} onChange={setCategory} /> : null}
        <Text style={[styles.scope, { color: colors.muted }]}>{period === "all" ? "All available local records" : `${range.startOn} to ${range.endOn}`} · {activeVehicle.nickname}</Text>
        {error ? <InlineError message={error} /> : null}
        <SectionHeader title="Care history" />
      </>}
    </View>}
    ListEmptyComponent={activeVehicle && !loading ? <EmptyState icon="list.bullet" title="No matching records" message="Try a broader date range or add a new fuel, service, or repair record." actionLabel="Add a record" onAction={() => router.push("/add-record")} /> : loading ? <LoadingState label="Loading history" /> : null}
    renderItem={({ item }) => <HistoryRow item={item} onPress={() => router.push({ pathname: "/record/[type]/[id]", params: { type: item.type, id: item.id } })} />}
  /></ScreenContainer>;
}

function HistoryRow({ item, onPress }: { item: ActivityFeedItem; onPress: () => void }) { const colors = useColors(); const amount = money(item.amountMinor); return <VclCard onPress={onPress} accessibilityLabel={`Open ${item.type} record: ${item.title}`} style={styles.row}><View style={styles.flexCopy}><Text style={[styles.type, { color: colors.primary }]}>{item.type.toUpperCase()}</Text><Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.detail, { color: colors.muted }]}>{item.occurredOn} · {item.odometerKm.toLocaleString("en-IN")} km{item.detail ? ` · ${item.detail}` : ""}</Text></View>{amount ? <Text style={[styles.amount, { color: colors.foreground }]}>{amount}</Text> : null}<IconSymbol name="chevron.right" size={20} color={colors.muted} /></VclCard>; }

const styles = StyleSheet.create({ content: { padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.sm, paddingBottom: layoutTokens.spacing.xxl }, header: { gap: layoutTokens.spacing.md }, center: { flex: 1, justifyContent: "center", padding: layoutTokens.spacing.md }, scope: { fontSize: 12, lineHeight: 17, fontWeight: "600" }, row: { flexDirection: "row", alignItems: "center", gap: 12 }, reminderCard: { flexDirection: "row", alignItems: "center", gap: 12 }, flexCopy: { flex: 1, gap: 3 }, type: { fontSize: 10, letterSpacing: 0.7, fontWeight: "900" }, title: { fontSize: 16, fontWeight: "800" }, detail: { fontSize: 12, lineHeight: 17 }, amount: { fontSize: 14, fontWeight: "800" } });
