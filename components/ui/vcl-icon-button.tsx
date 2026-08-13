import type { ComponentProps } from "react";
import { Pressable, StyleSheet } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

type IconName = ComponentProps<typeof IconSymbol>["name"];
export function VclIconButton({ icon, label, onPress, disabled = false }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.button, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && !disabled && styles.pressed, disabled && styles.disabled]}><IconSymbol name={icon} size={20} color={colors.primary} /></Pressable>;
}
const styles = StyleSheet.create({ button: { width: layoutTokens.touchTarget, height: layoutTokens.touchTarget, borderRadius: layoutTokens.radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" }, pressed: { opacity: 0.7 }, disabled: { opacity: 0.45 } });
