import type { ComponentProps } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

type IconName = ComponentProps<typeof IconSymbol>["name"];
type ButtonVariant = "primary" | "secondary" | "ghost";
type VclButtonProps = { label: string; onPress?: () => void; icon?: IconName; variant?: ButtonVariant; disabled?: boolean; loading?: boolean; accessibilityHint?: string; testID?: string };

export function VclButton({ label, onPress, icon, variant = "primary", disabled = false, loading = false, accessibilityHint, testID }: VclButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;
  const visual = variant === "secondary" ? { background: colors.surface, border: colors.border, text: colors.foreground } : variant === "ghost" ? { background: "transparent", border: "transparent", text: colors.primary } : { background: colors.primary, border: colors.primary, text: "#FFFFFF" };
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={accessibilityHint} accessibilityState={{ disabled: isDisabled, busy: loading }} disabled={isDisabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: visual.background, borderColor: visual.border }, pressed && !isDisabled && styles.pressed, isDisabled && styles.disabled]}><View style={styles.content}>{loading ? <ActivityIndicator color={visual.text} size="small" /> : icon ? <IconSymbol name={icon} size={18} color={visual.text} /> : null}<Text style={[styles.label, { color: visual.text }]}>{label}</Text></View></Pressable>;
}

const styles = StyleSheet.create({ button: { minHeight: layoutTokens.touchTarget, borderWidth: 1, borderRadius: layoutTokens.radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: layoutTokens.spacing.md }, content: { flexDirection: "row", gap: 8, alignItems: "center" }, label: { fontSize: layoutTokens.typography.label, fontWeight: "700" }, pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] }, disabled: { opacity: 0.48 } });
