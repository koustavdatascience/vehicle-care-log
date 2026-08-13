import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { useActiveVehicle } from "@/components/foundation/vehicle-provider";
import { AppHeader } from "@/components/layout/app-header";
import { RecordForm, type RecordType } from "@/components/records/record-form";
import { ScreenContainer } from "@/components/screen-container";
import { EmptyState, StatusBanner } from "@/components/ui/vcl-feedback";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

const options: readonly { type: RecordType; label: string; detail: string }[] = [
  { type: "fuel", label: "Fuel fill", detail: "Log litres, cost, station, and odometer." },
  { type: "service", label: "Service", detail: "Track scheduled and preventive vehicle care." },
  { type: "repair", label: "Repair", detail: "Record an issue, the work completed, and cost." },
];

function isRecordType(value: string | undefined): value is RecordType {
  return value === "fuel" || value === "service" || value === "repair";
}

export default function AddRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string | string[] }>();
  const requestedType = Array.isArray(params.type) ? params.type[0] : params.type;
  const [type, setType] = useState<RecordType | null>(isRecordType(requestedType) ? requestedType : null);
  const colors = useColors();
  const { activeVehicle } = useActiveVehicle();

  if (!activeVehicle) {
    return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.empty}><AppHeader title="Add a record" subtitle="Choose what you would like to log" onBack={() => router.back()} /><EmptyState title="Choose a vehicle first" message="Fuel, service, and repair records are always kept with a vehicle profile." actionLabel="Add vehicle" onAction={() => router.replace({ pathname: "/vehicle/[id]", params: { id: "new" } })} /></View></ScreenContainer>;
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppHeader title={type ? `Add ${type === "fuel" ? "fuel fill" : type}` : "Add a record"} subtitle={activeVehicle.nickname} onBack={() => type ? setType(null) : router.back()} />
        {!type ? <>
          <StatusBanner title={`Logging for ${activeVehicle.nickname}`} message={`${activeVehicle.make} ${activeVehicle.model}. Change the active vehicle from the dashboard or Vehicles tab.`} />
          <FlatList
            data={options}
            keyExtractor={(entry) => entry.type}
            scrollEnabled={false}
            contentContainerStyle={styles.options}
            renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Add ${item.label}`} accessibilityHint={item.detail} onPress={() => setType(item.type)} style={({ pressed }) => [styles.option, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{item.label}</Text><Text style={[styles.optionDetail, { color: colors.muted }]}>{item.detail}</Text></Pressable>}
          />
        </> : <RecordForm type={type} vehicleId={activeVehicle.id} onCancel={() => setType(null)} onSaved={(record) => router.replace({ pathname: "/record/[type]/[id]", params: { type, id: record.id } })} />}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ content: { padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.lg, paddingBottom: layoutTokens.spacing.xl }, empty: { flex: 1, padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.lg }, options: { gap: layoutTokens.spacing.sm }, option: { minHeight: 92, borderWidth: 1, borderRadius: layoutTokens.radius.lg, padding: layoutTokens.spacing.md, justifyContent: "center", gap: 4 }, optionTitle: { fontSize: 17, fontWeight: "800" }, optionDetail: { fontSize: 14, lineHeight: 20 }, pressed: { opacity: 0.74 } });
