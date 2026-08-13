import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { VclField } from "@/components/ui/vcl-field";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

function parseIsoDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIsoDate(): string {
  return formatDate(new Date());
}

export function DateField({ label, value, onChange, error, optional = false, maximumDate }: { label: string; value: string | null; onChange: (value: string | null) => void; error?: string; optional?: boolean; maximumDate?: string }) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  if (Platform.OS === "web") {
    return <VclField label={label} value={value ?? ""} onChangeText={(next) => onChange(next || null)} error={error} hint={optional ? "Optional. Use YYYY-MM-DD." : "Use YYYY-MM-DD."} placeholder="YYYY-MM-DD" />;
  }
  const handleChange = (_event: DateTimePickerEvent, next?: Date) => {
    if (Platform.OS === "android") setVisible(false);
    if (next) onChange(formatDate(next));
  };
  return <View style={styles.wrapper}><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={optional ? "Optional date picker" : "Date picker"} onPress={() => setVisible(true)} style={({ pressed }) => [styles.input, { borderColor: error ? colors.error : colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}><Text style={[styles.value, { color: value ? colors.foreground : colors.muted }]}>{value ?? "Select date"}</Text></Pressable>{visible ? <DateTimePicker value={parseIsoDate(value ?? todayIsoDate())} mode="date" display="default" maximumDate={maximumDate ? parseIsoDate(maximumDate) : undefined} onChange={handleChange} /> : null}{optional && value ? <Pressable accessibilityRole="button" accessibilityLabel={`Clear ${label}`} onPress={() => onChange(null)} style={({ pressed }) => [styles.clear, pressed && styles.pressed]}><Text style={[styles.clearText, { color: colors.primary }]}>Clear date</Text></Pressable> : null}{error ? <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.error }]}>{error}</Text> : null}</View>;
}

const styles = StyleSheet.create({ wrapper: { gap: 6 }, label: { fontSize: layoutTokens.typography.label, fontWeight: "700" }, input: { minHeight: layoutTokens.touchTarget, borderWidth: 1, borderRadius: layoutTokens.radius.md, paddingHorizontal: layoutTokens.spacing.sm, justifyContent: "center" }, value: { fontSize: layoutTokens.typography.body }, message: { fontSize: layoutTokens.typography.caption, lineHeight: 18 }, clear: { alignSelf: "flex-start", minHeight: 32, justifyContent: "center" }, clearText: { fontSize: 13, fontWeight: "700" }, pressed: { opacity: 0.72 } });
