import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/layout/app-header";
import { useActiveVehicle } from "@/components/foundation/vehicle-provider";
import { SectionHeader } from "@/components/layout/section-header";
import { VehicleSelector } from "@/components/layout/vehicle-selector";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { EmptyState, StatusBanner } from "@/components/ui/vcl-feedback";
import { VclCard } from "@/components/ui/vcl-card";
import { VclIconButton } from "@/components/ui/vcl-icon-button";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

const quickActions = [{ label: "Fuel", icon: "creditcard.fill" as const }, { label: "Service", icon: "wrench.and.screwdriver.fill" as const }, { label: "Repair", icon: "car.fill" as const }, { label: "Reminder", icon: "bell.fill" as const }];

export default function HomeScreen() {
  const router = useRouter();
  const { activeVehicle, selectVehicle, vehicles } = useActiveVehicle();
  return <ScreenContainer><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <AppHeader title="Vehicle Care Log" subtitle="Your local vehicle-care workspace" action={<VclIconButton icon="plus.circle.fill" label="Open add record menu" onPress={() => router.push("/add-record")} />} />
    <VehicleSelector label={activeVehicle?.nickname ?? "No vehicle selected"} helperText={activeVehicle ? `${activeVehicle.make} ${activeVehicle.model} · ${activeVehicle.year}` : "Add a vehicle to start recording care activity."} vehicles={vehicles} activeVehicleId={activeVehicle?.id ?? null} onSelectVehicle={(id) => { void selectVehicle(id); }} onManageVehicles={() => router.push("/(tabs)/settings")} />
    <StatusBanner title="Pilot data mode" message="Records remain on this device. Cloud backup and account sync are not enabled." />
    <SectionHeader title="Care overview" />
    <View style={styles.summaryGrid}><SummaryCard icon="clock.fill" label="Next service" value="No schedule" /><SummaryCard icon="chart.pie.fill" label="This period" value="No expenses" /></View>
    <SectionHeader title="Quick actions" />
    <View style={styles.quickGrid}>{quickActions.map((action) => <QuickAction key={action.label} {...action} />)}</View>
    <SectionHeader title="Recent activity" />
    <EmptyState icon="list.bullet" title="No records yet" message="Once you add a vehicle, fuel fills, services, repairs, and reminders will appear here." actionLabel="Open add menu" onAction={() => router.push("/add-record")} />
  </ScrollView></ScreenContainer>;
}

function SummaryCard({ icon, label, value }: { icon: "clock.fill" | "chart.pie.fill"; label: string; value: string }) { const colors = useColors(); return <VclCard style={styles.summaryCard}><IconSymbol name={icon} size={20} color={colors.primary} /><Text style={[styles.summaryLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.summaryValue, { color: colors.foreground }]}>{value}</Text></VclCard>; }
function QuickAction({ icon, label }: { icon: (typeof quickActions)[number]["icon"]; label: string }) { const colors = useColors(); return <VclCard disabled accessibilityLabel={`${label} is unavailable until a vehicle is added`} style={styles.quickAction}><IconSymbol name={icon} size={22} color={colors.muted} /><Text style={[styles.quickLabel, { color: colors.muted }]}>{label}</Text></VclCard>; }
const styles = StyleSheet.create({ content: { padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.lg, paddingBottom: layoutTokens.spacing.xxl }, summaryGrid: { flexDirection: "row", gap: layoutTokens.spacing.sm }, summaryCard: { flex: 1, minHeight: 124, gap: 8 }, summaryLabel: { fontSize: 13, fontWeight: "600" }, summaryValue: { fontSize: 17, fontWeight: "800" }, quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: layoutTokens.spacing.sm }, quickAction: { width: "48%", minHeight: 92, alignItems: "center", justifyContent: "center", gap: 8 }, quickLabel: { fontSize: 13, fontWeight: "700" } });
