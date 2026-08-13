import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, headerShown: false, tabBarButton: HapticTab, tabBarStyle: { paddingTop: 7, paddingBottom: bottomPadding, height: tabBarHeight, backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }, tabBarLabelStyle: { fontSize: 11, fontWeight: "700" } }}>
    <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: ({ color }) => <IconSymbol size={23} name="house.fill" color={color} /> }} />
    <Tabs.Screen name="service" options={{ title: "Service", tabBarIcon: ({ color }) => <IconSymbol size={23} name="wrench.and.screwdriver.fill" color={color} /> }} />
    <Tabs.Screen name="expenses" options={{ title: "Expenses", tabBarIcon: ({ color }) => <IconSymbol size={23} name="chart.pie.fill" color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color }) => <IconSymbol size={23} name="gearshape.fill" color={color} /> }} />
  </Tabs>;
}
