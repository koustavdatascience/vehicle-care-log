import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { useLocalDatabase } from "@/components/foundation/local-storage-provider";
import { usePreferences } from "@/components/foundation/preferences-provider";
import { useActiveVehicle } from "@/components/foundation/vehicle-provider";
import { AppHeader } from "@/components/layout/app-header";
import { VehicleSelector } from "@/components/layout/vehicle-selector";
import { DateField } from "@/components/records/date-field";
import { ScreenContainer } from "@/components/screen-container";
import { EmptyState, InlineError, LoadingState } from "@/components/ui/vcl-feedback";
import { VclButton } from "@/components/ui/vcl-button";
import { VclCard } from "@/components/ui/vcl-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { VclSegmentedControl } from "@/components/ui/vcl-segmented-control";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import { formatInstalledAppVersion } from "@/src/config/app-version";
import { validateCustomCsvDateRange } from "@/src/export/date-range";
import { createExpoCsvFileService } from "@/src/export/expo-csv-sharing-adapter";
import { LocalCsvExportService } from "@/src/export/local-csv-export-service";
import { cancelReminderNotification, requestLocalNotificationPermission, syncReminderNotification } from "@/src/notifications/local-notification-adapter";
import { LocalFuelRepository, LocalReminderRepository, LocalRepairRepository, LocalServiceRepository } from "@/src/repositories/local-repositories";
import { rangeForPeriod } from "@/src/reporting/selectors";

type ExportPeriod = "month" | "quarter" | "year" | "all" | "custom";

const exportPeriodOptions: readonly { label: string; value: ExportPeriod }[] = [
  { label: "Month", value: "month" },
  { label: "3 months", value: "quarter" },
  { label: "Year", value: "year" },
  { label: "All", value: "all" },
  { label: "Custom", value: "custom" },
];

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const database = useLocalDatabase();
  const reminderRepository = useMemo(() => new LocalReminderRepository(database), [database]);
  const csvExportService = useMemo(() => new LocalCsvExportService(new LocalFuelRepository(database), new LocalServiceRepository(database), new LocalRepairRepository(database)), [database]);
  const csvFileService = useMemo(() => createExpoCsvFileService(), []);
  const { preferences, error: preferencesError, isLoading: preferencesLoading, updatePreferences } = usePreferences();
  const { activeVehicleId, error, isLoading, selectVehicle, vehicles } = useActiveVehicle();
  const installedVersion = formatInstalledAppVersion(Constants.nativeAppVersion ?? Constants.expoConfig?.version);
  const [notificationNotice, setNotificationNotice] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [exportVehicleId, setExportVehicleId] = useState<string | null>(activeVehicleId);
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>("all");
  const [customExportStartOn, setCustomExportStartOn] = useState<string | null>(null);
  const [customExportEndOn, setCustomExportEndOn] = useState<string | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const exportVehicle = vehicles.find((vehicle) => vehicle.id === exportVehicleId) ?? vehicles.find((vehicle) => vehicle.id === activeVehicleId) ?? null;
  const customExportRange = useMemo(() => validateCustomCsvDateRange({ startOn: customExportStartOn, endOn: customExportEndOn }), [customExportEndOn, customExportStartOn]);
  const exportRange = useMemo(() => exportPeriod === "custom" ? customExportRange.range : rangeForPeriod(todayIsoDate(), exportPeriod), [customExportRange.range, exportPeriod]);
  const openNew = () => router.push({ pathname: "/vehicle/[id]", params: { id: "new" } });

  const syncNotifications = async (enabled: boolean, requestPermission: boolean) => {
    setRescheduling(true);
    setNotificationNotice(null);
    try {
      if (enabled && requestPermission) {
        const permission = await requestLocalNotificationPermission();
        if (permission !== "granted") {
          setNotificationNotice(permission === "denied" ? "Notifications are denied. Enable them in device settings, then retry." : "Local notifications are unavailable on this platform.");
          return;
        }
      }
      let touched = 0;
      for (const vehicle of vehicles) {
        const reminders = enabled ? await reminderRepository.listOpenForVehicle(vehicle.id) : await reminderRepository.listForVehicle(vehicle.id);
        for (const reminder of reminders) {
          if (enabled) {
            const notificationId = await syncReminderNotification(reminder, true);
            await reminderRepository.setNotificationId(reminder.id, notificationId);
          } else {
            await cancelReminderNotification(reminder.notificationId);
            await reminderRepository.setNotificationId(reminder.id, null);
          }
          touched += 1;
        }
      }
      setNotificationNotice(enabled ? `Local notification schedule refreshed for ${touched} open reminder${touched === 1 ? "" : "s"}.` : `Cleared scheduled notifications for ${touched} reminder${touched === 1 ? "" : "s"}.`);
    } catch {
      setNotificationNotice("Settings were saved, but notifications could not be refreshed. Retry when the device is available.");
    } finally {
      setRescheduling(false);
    }
  };

  const changeNotifications = async (enabled: boolean) => {
    try {
      await updatePreferences({ notificationEnabled: enabled });
      await syncNotifications(enabled, enabled);
    } catch {
      setNotificationNotice("Notification preference could not be saved. Please retry.");
    }
  };

  const exportCsv = async () => {
    if (!exportVehicle) {
      setExportNotice("Choose a vehicle before exporting a local report.");
      return;
    }
    if (exportPeriod === "custom" && (!customExportRange.ok || !exportRange)) {
      setExportNotice("Select a valid date range before exporting a local report.");
      return;
    }
    const selectedRange = exportRange ?? { startOn: null, endOn: null };
    setExportingCsv(true);
    setExportNotice(null);
    try {
      const result = await csvExportService.create({ vehicleId: exportVehicle.id, recordTypes: ["fuel", "service", "repair"], ...selectedRange });
      const outcome = await csvFileService.share(result);
      if (outcome.status === "shared") setExportNotice(`${outcome.rowCount} local record${outcome.rowCount === 1 ? " was" : "s were"} prepared for sharing. Exported files may be visible to the app you choose.`);
      else if (outcome.status === "empty") setExportNotice("No local fuel, service, or repair records match this date range.");
      else if (outcome.status === "unavailable") setExportNotice("CSV sharing is unavailable on this platform. Use a supported device to export the local report.");
      else setExportNotice("The local CSV report could not be prepared. Please retry.");
    } catch {
      setExportNotice("The local CSV report could not be prepared. Please retry.");
    } finally {
      setExportingCsv(false);
    }
  };

  const header = <View style={styles.header}>
    <AppHeader title="My garage" subtitle="Everything stays on this device" />
    <VclCard style={styles.garageSummary}>
      <View style={[styles.summaryIcon, { backgroundColor: `${colors.primary}16` }]}><IconSymbol name="car.fill" size={22} color={colors.primary} /></View>
      <View style={styles.summaryCopy}>
        <Text style={[styles.summaryTitle, { color: colors.foreground }]}>{vehicles.length === 0 ? "Ready when you are" : `${vehicles.length} saved vehicle${vehicles.length === 1 ? "" : "s"}`}</Text>
        <Text style={[styles.detail, { color: colors.muted }]}>Keep fuel, services, repairs, reminders, and reports together.</Text>
      </View>
    </VclCard>
    <VclButton label="Add vehicle" icon="plus" onPress={openNew} />
    <VclCard style={styles.preferencesCard}>
      <Text style={[styles.preferenceTitle, { color: colors.foreground }]}>Reminders & notifications</Text>
      <View style={styles.settingRow}>
        <View style={styles.rowCopy}>
          <Text style={[styles.settingLabel, { color: colors.foreground }]}>Local reminder notifications</Text>
          <Text style={[styles.detail, { color: colors.muted }]}>Schedule on this device. No account or internet connection is required.</Text>
        </View>
        <Switch value={preferences.notificationEnabled} onValueChange={(enabled) => { void changeNotifications(enabled); }} disabled={preferencesLoading || rescheduling} trackColor={{ false: colors.border, true: colors.primary }} accessibilityLabel="Enable local reminder notifications" />
      </View>
      <VclButton label={rescheduling ? "Refreshing notifications" : "Refresh notification schedule"} variant="secondary" onPress={() => { void syncNotifications(preferences.notificationEnabled, preferences.notificationEnabled); }} disabled={rescheduling} />
      {notificationNotice ? <Text style={[styles.notice, { color: colors.muted }]} accessibilityLiveRegion="polite">{notificationNotice}</Text> : null}
      {preferencesError ? <InlineError message={preferencesError} /> : null}
    </VclCard>
    <VclCard style={styles.preferencesCard}>
      <Text style={[styles.preferenceTitle, { color: colors.foreground }]}>Display & units</Text>
      <Text style={[styles.detail, { color: colors.muted }]}>Currency: INR · Distance: km · Fuel: litres</Text>
      <VclSegmentedControl label="Appearance" value={preferences.themePreference} options={[{ label: "System", value: "system" }, { label: "Light", value: "light" }, { label: "Dark", value: "dark" }]} onChange={(themePreference) => { void updatePreferences({ themePreference }); }} />
    </VclCard>
    <VclCard style={styles.versionCard} accessibilityLabel={`Installed app ${installedVersion}`}>
      <Text style={[styles.settingLabel, { color: colors.foreground }]}>App version</Text>
      <Text style={[styles.detail, { color: colors.muted }]}>{installedVersion}</Text>
    </VclCard>
    <VclCard style={styles.preferencesCard}>
      <Text style={[styles.preferenceTitle, { color: colors.foreground }]}>Local CSV report</Text>
      <Text style={[styles.detail, { color: colors.muted }]} accessibilityLabel="Local-only report. It is created on this device, then may be copied by the app you choose from the share sheet.">Create a spreadsheet-friendly fuel, service, and repair report. It is created on this device, then may be copied by the app you choose in the share sheet.</Text>
      <VehicleSelector label={exportVehicle?.nickname ?? "Choose a vehicle"} helperText="The report includes only this vehicle's selected local records." vehicles={vehicles} activeVehicleId={exportVehicle?.id ?? null} onSelectVehicle={(id) => setExportVehicleId(id)} onManageVehicles={() => router.push("/(tabs)/settings")} disabled={exportingCsv} />
      <VclSegmentedControl label="CSV date range" value={exportPeriod} options={exportPeriodOptions} onChange={(nextPeriod) => { setExportPeriod(nextPeriod); setExportNotice(null); }} />
      {exportPeriod === "custom" ? <View style={styles.customDateRange}><Text style={[styles.detail, { color: colors.muted }]}>Choose an optional inclusive start or end date. Leave either date clear to include the remaining local history.</Text><DateField label="CSV export start date" value={customExportStartOn} onChange={setCustomExportStartOn} optional maximumDate={customExportEndOn ?? undefined} error={customExportRange.startError} /><DateField label="CSV export end date" value={customExportEndOn} onChange={setCustomExportEndOn} optional minimumDate={customExportStartOn ?? undefined} error={customExportRange.endError} /></View> : null}
      <VclButton label={exportingCsv ? "Preparing CSV report" : "Export CSV report"} variant="secondary" onPress={() => { void exportCsv(); }} disabled={exportingCsv || !exportVehicle || (exportPeriod === "custom" && !customExportRange.ok)} accessibilityHint="Creates a local CSV report and opens the device share sheet." />
      {exportNotice ? <Text style={[styles.notice, { color: colors.muted }]} accessibilityRole="alert" accessibilityLiveRegion="polite">{exportNotice}</Text> : null}
    </VclCard>
    {error ? <InlineError message={error} /> : null}
    <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Your vehicles</Text>
  </View>;

  return <ScreenContainer><FlatList data={isLoading ? [] : vehicles} keyExtractor={(vehicle) => vehicle.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ListHeaderComponent={header} ListEmptyComponent={isLoading ? <LoadingState label="Loading locally saved vehicles" /> : <EmptyState icon="car.fill" title="Add your first vehicle" message="Create a vehicle profile to start logging fuel, service, and repairs." actionLabel="Add vehicle" onAction={openNew} />} renderItem={({ item }) => {
    const selected = item.id === activeVehicleId;
    return <Pressable accessibilityRole="button" accessibilityLabel={`${item.nickname}, ${selected ? "active vehicle" : "select vehicle"}`} onPress={() => { void selectVehicle(item.id); router.push({ pathname: "/vehicle/[id]", params: { id: item.id } }); }} style={({ pressed }) => [styles.row, layoutTokens.elevation.card, { borderColor: selected ? colors.primary : colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}>
      <View style={[styles.vehicleAvatar, { backgroundColor: `${colors.primary}14` }]}><IconSymbol name="car.fill" size={20} color={colors.primary} /></View>
      <View style={styles.rowCopy}>
        <Text style={[styles.title, { color: colors.foreground }]}>{item.nickname}</Text>
        <Text style={[styles.detail, { color: colors.muted }]}>{item.make} {item.model} · {item.year}</Text>
        {item.currentOdometerKm !== null ? <Text style={[styles.detail, { color: colors.muted }]}>{item.currentOdometerKm.toLocaleString("en-IN")} km</Text> : null}
      </View>
      {selected ? <View style={[styles.activePill, { backgroundColor: `${colors.primary}14` }]}><Text style={[styles.active, { color: colors.primary }]}>Active</Text></View> : <IconSymbol name="chevron.right" size={20} color={colors.muted} />}
    </Pressable>;
  }} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.sm, paddingBottom: layoutTokens.spacing.xxl },
  header: { gap: layoutTokens.spacing.md, paddingBottom: layoutTokens.spacing.sm },
  garageSummary: { flexDirection: "row", alignItems: "center", gap: layoutTokens.spacing.sm },
  summaryIcon: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  summaryCopy: { flex: 1, gap: 3 },
  summaryTitle: { fontSize: 16, fontWeight: "800" },
  preferencesCard: { gap: layoutTokens.spacing.md },
  customDateRange: { gap: layoutTokens.spacing.sm },
  versionCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: layoutTokens.spacing.sm },
  preferenceTitle: { fontSize: 16, fontWeight: "800" },
  settingRow: { flexDirection: "row", gap: layoutTokens.spacing.sm, alignItems: "center" },
  settingLabel: { fontSize: 14, fontWeight: "800" },
  notice: { fontSize: 13, lineHeight: 19 },
  sectionTitle: { fontSize: layoutTokens.typography.heading, fontWeight: "800", letterSpacing: -0.2, paddingTop: layoutTokens.spacing.xs },
  row: { minHeight: 88, borderWidth: StyleSheet.hairlineWidth, borderRadius: layoutTokens.radius.lg, padding: layoutTokens.spacing.md, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: layoutTokens.spacing.sm },
  vehicleAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  rowCopy: { flex: 1, gap: 3 },
  title: { fontSize: 17, fontWeight: "800" },
  detail: { fontSize: 14, lineHeight: 20 },
  activePill: { borderRadius: layoutTokens.radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  active: { fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
