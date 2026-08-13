import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useActiveVehicle } from "@/components/foundation/vehicle-provider";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenContainer } from "@/components/screen-container";
import { EmptyState, InlineError, LoadingState } from "@/components/ui/vcl-feedback";
import { VclButton } from "@/components/ui/vcl-button";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activeVehicleId, error, isLoading, selectVehicle, vehicles } = useActiveVehicle();
  const openNew = () => router.push({ pathname: "/vehicle/[id]", params: { id: "new" } });

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppHeader title="Vehicles" subtitle="Profiles stored on this device" />
        <View style={styles.actions}>
          <VclButton label="Add vehicle" icon="plus" onPress={openNew} />
        </View>
        {error ? <InlineError message={error} /> : null}
        {isLoading ? (
          <LoadingState label="Loading locally saved vehicles" />
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={(vehicle) => vehicle.id}
            contentContainerStyle={vehicles.length ? styles.list : styles.emptyList}
            ListEmptyComponent={<EmptyState title="Add your first vehicle" message="Create a vehicle profile to start logging fuel, service, and repairs." actionLabel="Add vehicle" onAction={openNew} />}
            renderItem={({ item }) => {
              const selected = item.id === activeVehicleId;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.nickname}, ${selected ? "active vehicle" : "select vehicle"}`}
                  onPress={() => {
                    void selectVehicle(item.id);
                    router.push({ pathname: "/vehicle/[id]", params: { id: item.id } });
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    { borderColor: selected ? colors.primary : colors.border, backgroundColor: colors.surface },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.rowCopy}>
                    <Text style={[styles.title, { color: colors.foreground }]}>{item.nickname}</Text>
                    <Text style={[styles.detail, { color: colors.muted }]}>{item.make} {item.model} · {item.year}</Text>
                    {item.currentOdometerKm !== null ? <Text style={[styles.detail, { color: colors.muted }]}>{item.currentOdometerKm.toLocaleString("en-IN")} km</Text> : null}
                  </View>
                  {selected ? <Text style={[styles.active, { color: colors.primary }]}>Active</Text> : null}
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.md },
  actions: { alignSelf: "flex-start" },
  list: { gap: layoutTokens.spacing.sm, paddingBottom: layoutTokens.spacing.xl },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  row: { minHeight: 88, borderWidth: 1, borderRadius: layoutTokens.radius.lg, padding: layoutTokens.spacing.md, flexDirection: "row", alignItems: "center", gap: 12 },
  rowCopy: { flex: 1, gap: 3 },
  title: { fontSize: 17, fontWeight: "800" },
  detail: { fontSize: 14, lineHeight: 20 },
  active: { fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
