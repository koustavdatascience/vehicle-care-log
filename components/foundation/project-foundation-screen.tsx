import { Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { resolveLaunchState } from "@/src/lib/runtime/launch-state";

export function ProjectFoundationScreen() {
  const launchState = resolveLaunchState();

  if (launchState.kind === "configuration-error") {
    return (
      <ScreenContainer className="justify-center p-6" edges={["top", "bottom", "left", "right"]}>
        <View className="gap-3 rounded-2xl border border-error bg-surface p-5">
          <Text accessibilityRole="header" className="text-xl font-semibold text-error">
            Startup needs attention
          </Text>
          <Text className="text-base leading-6 text-foreground">{launchState.message}</Text>
          <Text className="text-sm leading-5 text-muted">
            Check the non-secret public configuration and restart the app.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="justify-center p-6" edges={["top", "bottom", "left", "right"]}>
      <View className="gap-6">
        <View className="gap-2">
          <Text accessibilityRole="header" className="text-3xl font-bold tracking-tight text-foreground">
            {launchState.config.appName}
          </Text>
          <Text className="text-base leading-6 text-muted">
            Your local vehicle-care workspace is ready.
          </Text>
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-surface p-5">
          <Text className="text-lg font-semibold text-foreground">No vehicles yet</Text>
          <Text className="text-base leading-6 text-muted">
            Vehicle setup, records, and reminders are added in the next product phases. No example vehicle or expense data has been created.
          </Text>
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium text-foreground">Pilot data mode</Text>
          <Text className="text-sm leading-5 text-muted">
            Data stays on this device during the local-first pilot. Cloud backup and account sync are not enabled.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
