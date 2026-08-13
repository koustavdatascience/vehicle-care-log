import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { LocalStorageProvider } from "@/components/foundation/local-storage-provider";
import { SyncProvider } from "@/components/foundation/sync-provider";
import { VehicleProvider } from "@/components/foundation/vehicle-provider";
import { PreferencesProvider } from "@/components/foundation/preferences-provider";
import { AppErrorBoundary } from "@/components/foundation/app-error-boundary";
import { notificationReminderId } from "@/src/notifications/reminder-notification-policy";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

function NotificationResponseRouter() {
  const router = useRouter();
  useEffect(() => {
    if (Platform.OS === "web") return;
    const openReminder = (response: Notifications.NotificationResponse | null) => {
      const reminderId = notificationReminderId(response?.notification.request.content.data);
      if (reminderId) router.push({ pathname: "/reminder/[id]", params: { id: reminderId } });
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(openReminder);
    void Notifications.getLastNotificationResponseAsync().then(openReminder).catch(() => undefined);
    return () => subscription.remove();
  }, [router]);
  return null;
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <LocalStorageProvider>
            <PreferencesProvider>
              <SyncProvider>
                <VehicleProvider>
                  <NotificationResponseRouter />
                  <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="add-record" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
                  <Stack.Screen name="vehicle/[id]" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="vehicle/[id]/records" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="record/[type]/[id]" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="reminders" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="reminder/new" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
                  <Stack.Screen name="reminder/[id]" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="oauth/callback" />
                  </Stack>
                  <StatusBar style="auto" />
                </VehicleProvider>
              </SyncProvider>
            </PreferencesProvider>
          </LocalStorageProvider>
        </QueryClientProvider>
      </trpc.Provider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
