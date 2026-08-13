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
import type { ExpenseProjection } from "@/src/domain/models";
import type { ExpenseCategoryTotal } from "@/src/reporting/contracts";
import { LocalReportingRepository } from "@/src/reporting/local-reporting-repository";
import { expenseTotal, rangeForPeriod } from "@/src/reporting/selectors";

type PeriodFilter = "month" | "quarter" | "year" | "all";
type ExpenseRow = { kind: "category"; item: ExpenseCategoryTotal } | { kind: "heading"; id: string } | { kind: "source"; item: ExpenseProjection };
const periodOptions: readonly { label: string; value: PeriodFilter }[] = [{ label: "Month", value: "month" }, { label: "3 months", value: "quarter" }, { label: "Year", value: "year" }, { label: "All", value: "all" }];
function todayIsoDate(): string { return new Date().toISOString().slice(0, 10); }
function money(amountMinor: number): string { return `₹${(amountMinor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function ExpensesScreen() {
  const router = useRouter();
  const database = useLocalDatabase();
  const colors = useColors();
  const { activeVehicle, isLoading: vehiclesLoading, selectVehicle, vehicles } = useActiveVehicle();
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [categoryTotals, setCategoryTotals] = useState<ExpenseCategoryTotal[]>([]);
  const [expenses, setExpenses] = useState<ExpenseProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const range = useMemo(() => rangeForPeriod(todayIsoDate(), period), [period]);

  const load = useCallback(async () => {
    if (!activeVehicle) { setCategoryTotals([]); setExpenses([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const repository = new LocalReportingRepository(database);
      const [totals, projections] = await Promise.all([repository.listExpenseCategoryTotals(activeVehicle.id, range), repository.listExpenses(activeVehicle.id, range)]);
      setCategoryTotals(totals); setExpenses(projections);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Expenses could not be loaded."); } finally { setLoading(false); }
  }, [activeVehicle, database, range]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const rows = useMemo<ExpenseRow[]>(() => [
    ...categoryTotals.map((item) => ({ kind: "category" as const, item })),
    ...(categoryTotals.length > 0 && expenses.length > 0 ? [{ kind: "heading" as const, id: "sources" }] : []),
    ...expenses.map((item) => ({ kind: "source" as const, item })),
  ], [categoryTotals, expenses]);
  const total = expenseTotal(categoryTotals);
  const rangeLabel = period === "all" ? "All available local records" : `${range.startOn} to ${range.endOn}`;

  if (vehiclesLoading) return <ScreenContainer><View style={styles.center}><LoadingState label="Loading vehicles" /></View></ScreenContainer>;
  return <ScreenContainer><FlatList data={rows} keyExtractor={(item) => item.kind === "heading" ? item.id : item.kind === "category" ? `category:${item.item.category}` : `source:${item.item.id}`} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
    ListHeaderComponent={<View style={styles.header}>
      <AppHeader title="Expenses" subtitle="Local spending by vehicle" />
      <VehicleSelector label={activeVehicle?.nickname ?? "No vehicle selected"} helperText={activeVehicle ? "Expense totals include saved fuel, service, and repair costs." : "Select or create a vehicle to view expense reports."} vehicles={vehicles} activeVehicleId={activeVehicle?.id ?? null} onSelectVehicle={(id) => { void selectVehicle(id); }} onManageVehicles={() => router.push("/(tabs)/settings")} />
      {!activeVehicle ? <EmptyState icon="car.fill" title="Choose a vehicle" message="Expense reporting is available after selecting a vehicle profile." actionLabel="Manage vehicles" onAction={() => router.push("/(tabs)/settings")} /> : <>
        <VclSegmentedControl label="Expense period" value={period} options={periodOptions} onChange={setPeriod} />
        <VclCard accessibilityLabel={`Expense summary: ${money(total)} INR for ${rangeLabel}`} style={styles.totalCard}><IconSymbol name="chart.pie.fill" size={24} color={colors.primary} /><View style={styles.copy}><Text style={[styles.label, { color: colors.muted }]}>Total expenses</Text><Text style={[styles.total, { color: colors.foreground }]}>{money(total)}</Text><Text style={[styles.scope, { color: colors.muted }]}>{rangeLabel} · {activeVehicle.nickname} · INR</Text></View></VclCard>
        <Text accessibilityLabel={`Text summary: ${expenses.length} expense records across ${categoryTotals.length} categories, totalling ${money(total)} INR, for ${rangeLabel} and ${activeVehicle.nickname}.`} style={[styles.textAlternative, { color: colors.muted }]}>Text summary: {expenses.length} source records across {categoryTotals.length} categories. Category cards below are the accessible alternative to a spending chart.</Text>
        {error ? <InlineError message={error} /> : null}
        <SectionHeader title="Category totals" />
      </>}
    </View>}
    ListEmptyComponent={activeVehicle && !loading ? <EmptyState icon="chart.pie.fill" title="No expenses in this period" message="Change the period or add a fuel, service, or repair cost to build this report." actionLabel="Add a record" onAction={() => router.push("/add-record")} /> : loading ? <LoadingState label="Loading expense report" /> : null}
    renderItem={({ item }) => item.kind === "heading" ? <SectionHeader title="Source records" /> : item.kind === "category" ? <CategoryRow item={item.item} /> : <SourceRow item={item.item} onPress={() => router.push({ pathname: "/record/[type]/[id]", params: { type: item.item.sourceType, id: item.item.sourceId } })} />}
  /></ScreenContainer>;
}

function CategoryRow({ item }: { item: ExpenseCategoryTotal }) { const colors = useColors(); return <VclCard accessibilityLabel={`${item.category}: ${money(item.amountMinor)} across ${item.recordCount} records`} style={styles.category}><View style={styles.copy}><Text style={[styles.categoryName, { color: colors.foreground }]}>{item.category}</Text><Text style={[styles.scope, { color: colors.muted }]}>{item.recordCount} {item.recordCount === 1 ? "record" : "records"} · INR</Text></View><Text style={[styles.categoryAmount, { color: colors.foreground }]}>{money(item.amountMinor)}</Text></VclCard>; }
function SourceRow({ item, onPress }: { item: ExpenseProjection; onPress: () => void }) { const colors = useColors(); return <VclCard onPress={onPress} accessibilityLabel={`Open ${item.sourceType} expense record: ${item.category}, ${money(item.cost.amountMinor)}`} style={styles.source}><View style={styles.copy}><Text style={[styles.type, { color: colors.primary }]}>{item.sourceType.toUpperCase()}</Text><Text style={[styles.categoryName, { color: colors.foreground }]}>{item.category}</Text><Text style={[styles.scope, { color: colors.muted }]}>{item.occurredOn} · Source record</Text></View><Text style={[styles.categoryAmount, { color: colors.foreground }]}>{money(item.cost.amountMinor)}</Text><IconSymbol name="chevron.right" size={20} color={colors.muted} /></VclCard>; }

const styles = StyleSheet.create({ content: { padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.sm, paddingBottom: layoutTokens.spacing.xxl }, header: { gap: layoutTokens.spacing.md }, center: { flex: 1, justifyContent: "center", padding: layoutTokens.spacing.md }, totalCard: { flexDirection: "row", gap: 14, alignItems: "center" }, copy: { flex: 1, gap: 3 }, label: { fontSize: 13, fontWeight: "700" }, total: { fontSize: 24, fontWeight: "900" }, scope: { fontSize: 12, lineHeight: 17 }, textAlternative: { fontSize: 12, lineHeight: 18 }, category: { flexDirection: "row", alignItems: "center", gap: 12 }, categoryName: { fontSize: 16, fontWeight: "800" }, categoryAmount: { fontSize: 15, fontWeight: "800" }, source: { flexDirection: "row", alignItems: "center", gap: 12 }, type: { fontSize: 10, fontWeight: "900", letterSpacing: 0.7 } });
