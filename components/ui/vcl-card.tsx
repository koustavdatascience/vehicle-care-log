import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

type VclCardProps = { children: ReactNode; onPress?: () => void; accessibilityLabel?: string; disabled?: boolean; style?: StyleProp<ViewStyle>; testID?: string };

export function VclCard({ children, onPress, accessibilityLabel, disabled = false, style, testID }: VclCardProps) {
  const colors = useColors();
  const baseStyle = [styles.card, layoutTokens.elevation.card, { backgroundColor: colors.surface, borderColor: colors.border }, style];
  if (!onPress) return <View testID={testID} style={baseStyle}>{children}</View>;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [baseStyle, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>{children}</Pressable>;
}

const styles = StyleSheet.create({ card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: layoutTokens.radius.lg, padding: layoutTokens.spacing.md }, pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] }, disabled: { opacity: 0.5 } });
