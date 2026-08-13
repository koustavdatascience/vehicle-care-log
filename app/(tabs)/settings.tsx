import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { useLocalDatabase } from "@/components/foundation/local-storage-provider";
import { usePreferences } from "@/components/foundation/preferences-provider";
import { useSync } from "@/components/foundation/sync-provider";
import { useActiveVehicle } from "@/components/foundation/vehicle-provider";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenContainer } from "@/components/screen-container";
import { EmptyState, InlineError, LoadingState } from "@/components/ui/vcl-feedback";
import { VclButton } from "@/components/ui/vcl-button";
import { VclCard } from "@/components/ui/vcl-card";
import { VclSegmentedControl } from "@/components/ui/vcl-segmented-control";
import { layoutTokens } from "@/constants/design-tokens";
import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { recordSafeAnalytics } from "@/src/diagnostics/safe-analytics";
import { safeDiagnosticError } from "@/src/diagnostics/safe-diagnostics";
import { cancelReminderNotification, requestLocalNotificationPermission, syncReminderNotification } from "@/src/notifications/local-notification-adapter";
import { LocalReminderRepository } from "@/src/repositories/local-repositories";
import { exportPortableBackup } from "@/src/sync/attachment-and-backup-service";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const database = useLocalDatabase();
  const reminderRepository = useMemo(() => new LocalReminderRepository(database), [database]);
  const { preferences, error: preferencesError, isLoading: preferencesLoading, updatePreferences } = usePreferences();
  const { activeVehicleId, error, isLoading, selectVehicle, vehicles } = useActiveVehicle();
  const { user } = useAuth();
  const { account, status: syncStatus, message: syncMessage, syncNow, setLocalOnly } = useSync();
  const [notificationNotice, setNotificationNotice] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const openNew = () => router.push({ pathname: "/vehicle/[id]", params: { id: "new" } });
  const syncNotifications = async (enabled: boolean, requestPermission: boolean) => {
    setRescheduling(true); setNotificationNotice(null);
    try {
      if (enabled && requestPermission) {
        const permission = await requestLocalNotificationPermission();
        if (permission !== "granted") { setNotificationNotice(permission === "denied" ? "Notifications are denied. Enable them in device settings, then retry." : "Local notifications are unavailable on this platform."); return; }
      }
      let touched = 0;
      for (const vehicle of vehicles) {
        const reminders = enabled ? await reminderRepository.listOpenForVehicle(vehicle.id) : await reminderRepository.listForVehicle(vehicle.id);
        for (const reminder of reminders) {
          if (enabled) { const notificationId = await syncReminderNotification(reminder, true); await reminderRepository.setNotificationId(reminder.id, notificationId); }
          else { await cancelReminderNotification(reminder.notificationId); await reminderRepository.setNotificationId(reminder.id, null); }
          touched += 1;
        }
      }
      setNotificationNotice(enabled ? `Local notification schedule refreshed for ${touched} open reminder${touched === 1 ? "" : "s"}.` : `Cleared scheduled notifications for ${touched} reminder${touched === 1 ? "" : "s"}.`);
    } catch { setNotificationNotice("Settings were saved, but notifications could not be refreshed. Retry when the device is available."); } finally { setRescheduling(false); }
  };
  const changeNotifications = async (enabled: boolean) => {
    try { await updatePreferences({ notificationEnabled: enabled }); await syncNotifications(enabled, enabled); } catch { setNotificationNotice("Notification preference could not be saved. Please retry."); }
  };
  const exportBackup = async () => {
    setBackingUp(true); setBackupNotice(null);
    try {
      const result = await exportPortableBackup(database);
      setBackupNotice(result.shared ? "Backup created and opened in the device share sheet." : "Backup created locally. Sharing is unavailable on this device.");
      recordSafeAnalytics("backup_exported", { shared: result.shared });
    } catch (cause) {
      safeDiagnosticError("backup.export_failed", cause);
      recordSafeAnalytics("backup_export_failed");
      setBackupNotice("Backup could not be created. Your records remain on this device; please try again.");
    } finally { setBackingUp(false); }
  };
  const beginAccountLink = async () => {
    try { await startOAuthLogin(); } catch { setBackupNotice("The account-link page could not be opened. Your records remain stored locally."); }
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppHeader title="Vehicles" subtitle="Profiles stored on this device" />
        <VclCard style={styles.preferencesCard}>
          <Text style={[styles.preferenceTitle, { color: colors.foreground }]}>Reminders & notifications</Text>
          <View style={styles.settingRow}><View style={styles.rowCopy}><Text style={[styles.settingLabel, { color: colors.foreground }]}>Local reminder notifications</Text><Text style={[styles.detail, { color: colors.muted }]}>Schedule on this device. No account or internet connection is required.</Text></View><Switch value={preferences.notificationEnabled} onValueChange={(enabled) => { void changeNotifications(enabled); }} disabled={preferencesLoading || rescheduling} trackColor={{ false: colors.border, true: colors.primary }} accessibilityLabel="Enable local reminder notifications" /></View>
          <VclButton label={rescheduling ? "Refreshing notifications" : "Refresh notification schedule"} variant="secondary" onPress={() => { void syncNotifications(preferences.notificationEnabled, preferences.notificationEnabled); }} disabled={rescheduling} />
          {notificationNotice ? <Text style={[styles.notice, { color: colors.muted }]} accessibilityLiveRegion="polite">{notificationNotice}</Text> : null}
          {preferencesError ? <InlineError message={preferencesError} /> : null}
        </VclCard>
        <VclCard style={styles.preferencesCard}>
          <Text style={[styles.preferenceTitle, { color: colors.foreground }]}>Backup & sync</Text>
          <Text style={[styles.detail, { color: colors.muted }]}>Optional cloud backup. Your vehicle care records always work on this device, including offline.</Text>
          <Text style={[styles.syncState, { color: syncStatus === "ready" ? colors.success : syncStatus === "conflict" || syncStatus === "offline" ? colors.warning : colors.muted }]}>Status: {syncStatus === "local-only" ? "local only" : syncStatus}</Text>
          {account.lastSyncAt ? <Text style={[styles.detail, { color: colors.muted }]}>Last backup: {new Date(account.lastSyncAt).toLocaleString("en-IN")}</Text> : null}
          {!user ? <VclButton label="Link optional backup account" onPress={() => { void beginAccountLink(); }} /> : <><VclButton label="Back up this device now" onPress={() => { void syncNow("upload-device"); }} /><VclButton label="Restore account copy" variant="secondary" onPress={() => { void syncNow("download-cloud"); }} /></>}
          {user ? <VclButton label="Keep data on this device only" variant="ghost" onPress={() => { void setLocalOnly(); }} /> : null}
          {syncMessage ? <Text style={[styles.notice, { color: colors.muted }]} accessibilityLiveRegion="polite">{syncMessage}</Text> : null}
          <VclButton label={backingUp ? "Preparing backup" : "Export portable backup"} variant="secondary" onPress={() => { void exportBackup(); }} loading={backingUp} />
          {backupNotice ? <Text style={[styles.notice, { color: colors.muted }]} accessibilityLiveRegion="polite">{backupNotice}</Text> : null}
        </VclCard>
        <VclCard style={styles.preferencesCard}>
          <Text style={[styles.preferenceTitle, { color: colors.foreground }]}>Display & units</Text>
          <Text style={[styles.detail, { color: colors.muted }]}>Currency: INR · Distance: km · Fuel: litres</Text>
          <VclSegmentedControl label="Appearance" value={preferences.themePreference} options={[{ label: "System", value: "system" }, { label: "Light", value: "light" }, { label: "Dark", value: "dark" }]} onChange={(themePreference) => { void updatePreferences({ themePreference }); }} />
        </VclCard>
        <View style={styles.actions}>
          <VclButton label="Add vehicle" icon="plus" onPress={openNew} />
        </View>
        {error ? <InlineError message={error} /> : null}
        {isLoading ? (
          <LoadingState label="Loading locally saved vehicles" />
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={(vehicle) => vehicle.id}
            contentContainerStyle={vehicles.length ? styles.list : styles.emptyList}
            ListEmptyComponent={<EmptyState title="Add your first vehicle" message="Create a vehicle profile to start logging fuel, service, and repairs." actionLabel="Add vehicle" onAction={openNew} />}
            renderItem={({ item }) => {
              const selected = item.id === activeVehicleId;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.nickname}, ${selected ? "active vehicle" : "select vehicle"}`}
                  onPress={() => {
                    void selectVehicle(item.id);
                    router.push({ pathname: "/vehicle/[id]", params: { id: item.id } });
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    { borderColor: selected ? colors.primary : colors.border, backgroundColor: colors.surface },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.rowCopy}>
                    <Text style={[styles.title, { color: colors.foreground }]}>{item.nickname}</Text>
                    <Text style={[styles.detail, { color: colors.muted }]}>{item.make} {item.model} · {item.year}</Text>
                    {item.currentOdometerKm !== null ? <Text style={[styles.detail, { color: colors.muted }]}>{item.currentOdometerKm.toLocaleString("en-IN")} km</Text> : null}
                  </View>
                  {selected ? <Text style={[styles.active, { color: colors.primary }]}>Active</Text> : null}
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.md },
  preferencesCard: { gap: layoutTokens.spacing.md },
  preferenceTitle: { fontSize: 16, fontWeight: "800" },
  settingRow: { flexDirection: "row", gap: layoutTokens.spacing.sm, alignItems: "center" },
  settingLabel: { fontSize: 14, fontWeight: "800" },
  notice: { fontSize: 13, lineHeight: 19 },
  syncState: { fontSize: 14, fontWeight: "800", textTransform: "capitalize" },
  actions: { alignSelf: "flex-start" },
  list: { gap: layoutTokens.spacing.sm, paddingBottom: layoutTokens.spacing.xl },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  row: { minHeight: 88, borderWidth: 1, borderRadius: layoutTokens.radius.lg, padding: layoutTokens.spacing.md, flexDirection: "row", alignItems: "center", gap: 12 },
  rowCopy: { flex: 1, gap: 3 },
  title: { fontSize: 17, fontWeight: "800" },
  detail: { fontSize: 14, lineHeight: 20 },
  active: { fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
