import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useActiveVehicle } from "@/components/foundation/vehicle-provider";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenContainer } from "@/components/screen-container";
import { ConfirmationSurface, EmptyState, InlineError, LoadingState } from "@/components/ui/vcl-feedback";
import { VclButton } from "@/components/ui/vcl-button";
import { VclField } from "@/components/ui/vcl-field";
import { VclSegmentedControl } from "@/components/ui/vcl-segmented-control";
import { layoutTokens } from "@/constants/design-tokens";
import type { Vehicle, VehicleDraft } from "@/src/domain/models";
import { validateVehicleDraft } from "@/src/domain/services";

type FuelType = Vehicle["fuelType"];
type FormState = { nickname: string; make: string; model: string; year: string; fuelType: FuelType; registrationLabel: string; currentOdometerKm: string };
type FieldErrors = Partial<Record<keyof FormState, string>>;

const fuelOptions: readonly { label: string; value: FuelType }[] = [
  { label: "Petrol", value: "petrol" },
  { label: "Diesel", value: "diesel" },
  { label: "EV", value: "electric" },
  { label: "Hybrid", value: "hybrid" },
  { label: "Other", value: "other" },
];

function newForm(): FormState {
  return { nickname: "", make: "", model: "", year: "", fuelType: "petrol", registrationLabel: "", currentOdometerKm: "" };
}

function vehicleForm(vehicle: Vehicle): FormState {
  return {
    nickname: vehicle.nickname,
    make: vehicle.make,
    model: vehicle.model,
    year: String(vehicle.year),
    fuelType: vehicle.fuelType,
    registrationLabel: vehicle.registrationLabel ?? "",
    currentOdometerKm: vehicle.currentOdometerKm === null ? "" : String(vehicle.currentOdometerKm),
  };
}

function createId(): string {
  return `vehicle-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function VehicleDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const vehicleId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isNew = vehicleId === "new";
  const { activeVehicleId, archiveVehicle, createVehicle, isLoading, selectVehicle, updateVehicle, vehicles } = useActiveVehicle();
  const vehicle = useMemo(() => isNew ? null : vehicles.find((entry) => entry.id === vehicleId) ?? null, [isNew, vehicleId, vehicles]);
  const [form, setForm] = useState<FormState>(newForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    setForm(vehicle ? vehicleForm(vehicle) : newForm());
    setErrors({});
    setSaveError(null);
  }, [vehicle]);

  const setValue = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const save = async () => {
    const year = Number(form.year);
    const odometer = form.currentOdometerKm.trim() ? Number(form.currentOdometerKm) : null;
    const draft: VehicleDraft = {
      id: vehicle?.id ?? createId(),
      nickname: form.nickname,
      make: form.make,
      model: form.model,
      year,
      fuelType: form.fuelType,
      registrationLabel: form.registrationLabel.trim() || null,
      currentOdometerKm: odometer,
    };
    const result = validateVehicleDraft(draft);
    if (!result.ok) {
      setErrors(Object.fromEntries(result.issues.map((issue) => [issue.field, issue.message])) as FieldErrors);
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const saved = isNew ? await createVehicle(draft) : await updateVehicle(draft);
      await selectVehicle(saved.id);
      router.replace({ pathname: "/vehicle/[id]", params: { id: saved.id } });
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Vehicle could not be saved. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const archive = async () => {
    if (!vehicle) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await archiveVehicle(vehicle.id);
      router.replace("/(tabs)/settings");
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Vehicle could not be archived. Please try again.");
    } finally {
      setIsSaving(false);
      setConfirmArchive(false);
    }
  };

  if (isLoading) {
    return <ScreenContainer><View style={styles.center}><LoadingState label="Loading vehicle profile" /></View></ScreenContainer>;
  }

  if (!isNew && !vehicle) {
    return <ScreenContainer><View style={styles.content}><AppHeader title="Vehicle" onBack={() => router.back()} /><View style={styles.center}><EmptyState title="Vehicle not available" message="This profile may have been archived or removed from local storage." actionLabel="View vehicles" onAction={() => router.replace("/(tabs)/settings")} /></View></View></ScreenContainer>;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppHeader title={isNew ? "New vehicle" : "Vehicle profile"} subtitle={isNew ? "Add the vehicle you care for" : activeVehicleId === vehicle?.id ? "Your active vehicle" : "Update this local profile"} onBack={() => router.back()} />
        <View style={styles.form}>
          {saveError ? <InlineError message={saveError} /> : null}
          <VclField label="Vehicle name" value={form.nickname} onChangeText={(value) => setValue("nickname", value)} error={errors.nickname} placeholder="e.g. Family car" />
          <VclField label="Make" value={form.make} onChangeText={(value) => setValue("make", value)} error={errors.make} placeholder="e.g. Tata" />
          <VclField label="Model" value={form.model} onChangeText={(value) => setValue("model", value)} error={errors.model} placeholder="e.g. Nexon" />
          <VclField label="Model year" value={form.year} onChangeText={(value) => setValue("year", value)} error={errors.year} placeholder="YYYY" keyboardType="number-pad" maxLength={4} />
          <View style={styles.segmentField}><Text style={styles.segmentLabel}>Fuel type</Text><VclSegmentedControl label="Fuel type" value={form.fuelType} options={fuelOptions} onChange={(value) => setValue("fuelType", value)} /></View>
          <VclField label="Registration" value={form.registrationLabel} onChangeText={(value) => setValue("registrationLabel", value)} placeholder="Optional" autoCapitalize="characters" />
          <VclField label="Current odometer (km)" value={form.currentOdometerKm} onChangeText={(value) => setValue("currentOdometerKm", value)} error={errors.currentOdometerKm} placeholder="Optional" keyboardType="number-pad" />
          <VclButton label={isNew ? "Save vehicle" : "Save changes"} icon="checkmark" onPress={() => { void save(); }} loading={isSaving} />
          {!isNew && vehicle ? <VclButton label={activeVehicleId === vehicle.id ? "Active vehicle" : "Make active"} icon="car.fill" variant="secondary" disabled={activeVehicleId === vehicle.id} onPress={() => { void selectVehicle(vehicle.id); }} /> : null}
          {!isNew && vehicle ? <VclButton label="View care history" icon="list.bullet" variant="secondary" onPress={() => router.push({ pathname: "/vehicle/[id]/records", params: { id: vehicle.id } })} /> : null}
          {!isNew && vehicle ? <VclButton label="Archive vehicle" icon="archivebox" variant="ghost" disabled={isSaving} onPress={() => setConfirmArchive(true)} /> : null}
          {confirmArchive && vehicle ? <ConfirmationSurface title="Archive this vehicle?" message="Its records remain on this device but the vehicle will no longer be selectable for new entries."><VclButton label="Archive vehicle" icon="archivebox" onPress={() => { void archive(); }} loading={isSaving} /><VclButton label="Keep vehicle" variant="secondary" onPress={() => setConfirmArchive(false)} disabled={isSaving} /></ConfirmationSurface> : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.lg, paddingBottom: layoutTokens.spacing.xl },
  center: { flex: 1, justifyContent: "center", padding: layoutTokens.spacing.md },
  form: { gap: layoutTokens.spacing.md },
  segmentField: { gap: 6 },
  segmentLabel: { fontSize: layoutTokens.typography.label, fontWeight: "700" },
});
