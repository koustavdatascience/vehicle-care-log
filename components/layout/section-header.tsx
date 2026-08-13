import { StyleSheet, Text, View } from "react-native";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
export function SectionHeader({ title, detail }: { title: string; detail?: string }) { const colors = useColors(); return <View style={styles.row}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>{title}</Text>{detail ? <Text style={[styles.detail, { color: colors.primary }]}>{detail}</Text> : null}</View>; }
const styles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, title: { fontSize: layoutTokens.typography.heading, fontWeight: "800" }, detail: { fontSize: 13, fontWeight: "700" } });
