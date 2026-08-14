import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { VclIconButton } from "@/components/ui/vcl-icon-button";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

export function AppHeader({ title, subtitle, onBack, action }: { title: string; subtitle?: string; onBack?: () => void; action?: ReactNode }) {
  const colors = useColors(); return <View style={styles.header}><View style={styles.leading}>{onBack ? <VclIconButton icon="arrow.left" label="Go back" onPress={onBack} /> : null}</View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>{title}</Text>{subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}</View><View style={styles.action}>{action}</View></View>;
}
const styles = StyleSheet.create({ header: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 8 }, leading: { minWidth: 44 }, copy: { flex: 1, gap: 3 }, title: { fontSize: layoutTokens.typography.title, fontWeight: "800", letterSpacing: -0.55 }, subtitle: { fontSize: layoutTokens.typography.caption, lineHeight: 18 }, action: { minWidth: 44, alignItems: "flex-end" } });
