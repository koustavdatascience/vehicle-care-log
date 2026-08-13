import { Pressable, StyleSheet, Text, View } from "react-native";

import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

type Segment<T extends string> = { label: string; value: T };
export function VclSegmentedControl<T extends string>({ value, options, onChange, label }: { value: T; options: readonly Segment<T>[]; onChange: (value: T) => void; label: string }) {
  const colors = useColors();
  return <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>{options.map((option) => { const selected = option.value === value; return <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ selected }} onPress={() => onChange(option.value)} style={({ pressed }) => [styles.segment, selected && { backgroundColor: colors.primary }, pressed && styles.pressed]}><Text style={[styles.text, { color: selected ? "#FFFFFF" : colors.muted }]}>{option.label}</Text></Pressable>; })}</View>;
}
const styles = StyleSheet.create({ wrap: { minHeight: layoutTokens.touchTarget, borderWidth: 1, borderRadius: layoutTokens.radius.md, padding: 3, flexDirection: "row" }, segment: { flex: 1, minHeight: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 }, text: { fontSize: 13, fontWeight: "700" }, pressed: { opacity: 0.76 } });
