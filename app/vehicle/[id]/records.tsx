import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useActiveVehicle } from "@/components/foundation/vehicle-provider";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenContainer } from "@/components/screen-container";
import type { CareRecord, RecordType } from "@/components/records/record-form";
import { EmptyState, InlineError, LoadingState } from "@/components/ui/vcl-feedback";
import { VclButton } from "@/components/ui/vcl-button";
import { VclSegmentedControl } from "@/components/ui/vcl-segmented-control";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import type { VehicleId } from "@/src/domain/models";
import { LocalFuelRepository, LocalRepairRepository, LocalServiceRepository } from "@/src/repositories/local-repositories";
import { useLocalDatabase } from "@/components/foundation/local-storage-provider";

type FilterType = "all" | RecordType;
type TimelineRecord = { type: RecordType; record: CareRecord };
const filterOptions: readonly { label: string; value: FilterType }[] = [{ label: "All", value: "all" }, { label: "Fuel", value: "fuel" }, { label: "Service", value: "service" }, { label: "Repair", value: "repair" }];

function recordTitle(type: RecordType, record: CareRecord): string {
  if (type === "fuel") return "Fuel fill";
  if (type === "service") return (record as Extract<CareRecord, { category: string }>).category;
  return (record as Extract<CareRecord, { issue: string }>).issue;
}

function recordCost(record: CareRecord): string | null {
  const cost = record.cost;
  return cost ? `₹${(cost.amountMinor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null;
}

export default function VehicleRecordsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const vehicleId = (Array.isArray(params.id) ? params.id[0] : params.id) as VehicleId;
  const database = useLocalDatabase();
  const colors = useColors();
  const { vehicles } = useActiveVehicle();
  const vehicle = vehicles.find((entry) => entry.id === vehicleId) ?? null;
  const [filter, setFilter] = useState<FilterType>("all");
  const [records, setRecords] = useState<TimelineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [fuel, service, repair] = await Promise.all([
        new LocalFuelRepository(database).listForVehicle(vehicleId),
        new LocalServiceRepository(database).listForVehicle(vehicleId),
        new LocalRepairRepository(database).listForVehicle(vehicleId),
      ]);
      setRecords([
        ...fuel.map((record) => ({ type: "fuel" as const, record })),
        ...service.map((record) => ({ type: "service" as const, record })),
        ...repair.map((record) => ({ type: "repair" as const, record })),
      ].sort((first, second) => `${second.record.occurredOn}|${second.record.createdAt}`.localeCompare(`${first.record.occurredOn}|${first.record.createdAt}`)));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Vehicle records could not be loaded."); } finally { setLoading(false); }
  }, [database, vehicleId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const visibleRecords = useMemo(() => filter === "all" ? records : records.filter((entry) => entry.type === filter), [filter, records]);
  const openAdd = () => router.push({ pathname: "/add-record", params: { type: filter === "all" ? "" : filter } });

  if (!vehicle) return <ScreenContainer><View style={styles.content}><AppHeader title="Care history" onBack={() => router.back()} /><View style={styles.center}><EmptyState title="Vehicle not available" message="Return to the Vehicles tab and choose an available profile." actionLabel="View vehicles" onAction={() => router.replace("/(tabs)/settings")} /></View></View></ScreenContainer>;

  return <ScreenContainer><View style={styles.content}><AppHeader title="Care history" subtitle={vehicle.nickname} onBack={() => router.back()} action={<VclButton label="Add" icon="plus" onPress={openAdd} />} /><VclSegmentedControl label="Record type filter" value={filter} options={filterOptions} onChange={setFilter} />{error ? <InlineError message={error} /> : null}{loading ? <LoadingState label="Loading vehicle records" /> : <FlatList data={visibleRecords} keyExtractor={(entry) => `${entry.type}:${entry.record.id}`} contentContainerStyle={visibleRecords.length ? styles.list : styles.emptyList} ListEmptyComponent={<EmptyState title={filter === "all" ? "No records yet" : `No ${filter} records`} message="Saved fuel, service, and repair entries will appear here for this vehicle only." actionLabel="Add a record" onAction={openAdd} />} renderItem={({ item }) => { const amount = recordCost(item.record); return <Pressable accessibilityRole="button" accessibilityLabel={`${item.type} record: ${recordTitle(item.type, item.record)}`} onPress={() => router.push({ pathname: "/record/[type]/[id]", params: { type: item.type, id: item.record.id } })} style={({ pressed }) => [styles.row, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}><View style={styles.rowCopy}><Text style={[styles.type, { color: colors.primary }]}>{item.type.toUpperCase()}</Text><Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>{recordTitle(item.type, item.record)}</Text><Text style={[styles.detail, { color: colors.muted }]}>{item.record.occurredOn} · {item.record.odometerKm.toLocaleString("en-IN")} km</Text></View>{amount ? <Text style={[styles.amount, { color: colors.foreground }]}>{amount}</Text> : null}</Pressable>; }} />}</View></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { flex: 1, padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.md }, center: { flex: 1, justifyContent: "center" }, list: { gap: layoutTokens.spacing.sm, paddingBottom: layoutTokens.spacing.xl }, emptyList: { flexGrow: 1, justifyContent: "center" }, row: { minHeight: 82, borderWidth: 1, borderRadius: layoutTokens.radius.lg, padding: layoutTokens.spacing.md, flexDirection: "row", alignItems: "center", gap: 12 }, rowCopy: { flex: 1, gap: 3 }, type: { fontSize: 11, fontWeight: "900", letterSpacing: 0.6 }, title: { fontSize: 16, fontWeight: "800" }, detail: { fontSize: 13, lineHeight: 18 }, amount: { fontSize: 14, fontWeight: "800" }, pressed: { opacity: 0.74 } });
