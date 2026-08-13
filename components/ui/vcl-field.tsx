import { Text, TextInput, View, StyleSheet, type TextInputProps } from "react-native";

import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

type VclFieldProps = TextInputProps & { label: string; error?: string; hint?: string };
export function VclField({ label, error, hint, editable = true, ...inputProps }: VclFieldProps) {
  const colors = useColors();
  return <View style={styles.wrapper}><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text><TextInput {...inputProps} editable={editable} accessibilityLabel={label} accessibilityHint={hint ?? error} placeholderTextColor={colors.muted} returnKeyType={inputProps.returnKeyType ?? "done"} style={[styles.input, { color: colors.foreground, borderColor: error ? colors.error : colors.border, backgroundColor: colors.surface }, !editable && styles.disabled, inputProps.style]} />{error ? <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.error }]}>{error}</Text> : hint ? <Text style={[styles.message, { color: colors.muted }]}>{hint}</Text> : null}</View>;
}
const styles = StyleSheet.create({ wrapper: { gap: 6 }, label: { fontSize: layoutTokens.typography.label, fontWeight: "700" }, input: { minHeight: layoutTokens.touchTarget, borderWidth: 1, borderRadius: layoutTokens.radius.md, paddingHorizontal: layoutTokens.spacing.sm, fontSize: layoutTokens.typography.body }, message: { fontSize: layoutTokens.typography.caption, lineHeight: 18 }, disabled: { opacity: 0.55 } });
