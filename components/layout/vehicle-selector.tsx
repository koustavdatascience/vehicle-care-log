import { Pressable, StyleSheet, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

export function VehicleSelector({ label, helperText, onPress, disabled = false }: { label: string; helperText: string; onPress?: () => void; disabled?: boolean }) {
  const colors = useColors(); return <Pressable accessibilityRole="button" accessibilityLabel="Select vehicle" accessibilityHint={helperText} accessibilityState={{ disabled }} disabled={disabled || !onPress} onPress={onPress} style={({ pressed }) => [styles.selector, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && !disabled && styles.pressed, (disabled || !onPress) && styles.disabled]}><View style={[styles.icon, { backgroundColor: `${colors.primary}16` }]}><IconSymbol name="car.fill" size={20} color={colors.primary} /></View><View style={styles.copy}><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text><Text style={[styles.helper, { color: colors.muted }]}>{helperText}</Text></View><IconSymbol name="chevron.down" size={20} color={colors.muted} /></Pressable>;
}
const styles = StyleSheet.create({ selector: { minHeight: 68, borderWidth: 1, borderRadius: layoutTokens.radius.lg, padding: layoutTokens.spacing.sm, flexDirection: "row", alignItems: "center", gap: 10 }, icon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }, copy: { flex: 1, gap: 2 }, label: { fontSize: 16, fontWeight: "800" }, helper: { fontSize: 13, lineHeight: 18 }, pressed: { opacity: 0.74 }, disabled: { opacity: 0.74 } });
