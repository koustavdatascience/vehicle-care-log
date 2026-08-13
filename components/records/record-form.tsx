import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useLocalDatabase } from "@/components/foundation/local-storage-provider";
import { DateField, todayIsoDate } from "@/components/records/date-field";
import { InlineError } from "@/components/ui/vcl-feedback";
import { VclButton } from "@/components/ui/vcl-button";
import { VclField } from "@/components/ui/vcl-field";
import { layoutTokens } from "@/constants/design-tokens";
import type { FuelDraft, FuelEntry, RepairDraft, RepairRecord, ServiceDraft, ServiceRecord, VehicleId } from "@/src/domain/models";
import { LocalFuelRepository, LocalRepairRepository, LocalServiceRepository } from "@/src/repositories/local-repositories";

export type RecordType = "fuel" | "service" | "repair";
export type CareRecord = FuelEntry | ServiceRecord | RepairRecord;

type RecordFormProps = {
  type: RecordType;
  vehicleId: VehicleId;
  existing?: CareRecord | null;
  onCancel: () => void;
  onSaved: (record: CareRecord) => void;
};

function createId(type: RecordType): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseInteger(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseRupees(value: string, required: boolean): number | null | undefined {
  const normalized = value.trim();
  if (!normalized) return required ? undefined : null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return undefined;
  const rupees = Number(normalized);
  if (!Number.isFinite(rupees) || rupees < 0) return undefined;
  return Math.round(rupees * 100);
}

function parseLitres(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,3})?$/.test(normalized)) return null;
  const litres = Number(normalized);
  const millilitres = Math.round(litres * 1000);
  return Number.isSafeInteger(millilitres) && millilitres > 0 ? millilitres : null;
}

function asFuel(existing: CareRecord | null | undefined): FuelEntry | null {
  return existing && "quantityMilliLitres" in existing ? existing : null;
}

function asService(existing: CareRecord | null | undefined): ServiceRecord | null {
  return existing && "category" in existing ? existing : null;
}

function asRepair(existing: CareRecord | null | undefined): RepairRecord | null {
  return existing && "issue" in existing ? existing : null;
}

export function RecordForm({ type, vehicleId, existing, onCancel, onSaved }: RecordFormProps) {
  if (type === "fuel") return <FuelForm vehicleId={vehicleId} existing={asFuel(existing)} onCancel={onCancel} onSaved={onSaved} />;
  if (type === "service") return <ServiceForm vehicleId={vehicleId} existing={asService(existing)} onCancel={onCancel} onSaved={onSaved} />;
  return <RepairForm vehicleId={vehicleId} existing={asRepair(existing)} onCancel={onCancel} onSaved={onSaved} />;
}

function FuelForm({ vehicleId, existing, onCancel, onSaved }: { vehicleId: VehicleId; existing: FuelEntry | null; onCancel: () => void; onSaved: (record: FuelEntry) => void }) {
  const database = useLocalDatabase();
  const repository = useMemo(() => new LocalFuelRepository(database), [database]);
  const [occurredOn, setOccurredOn] = useState(existing?.occurredOn ?? todayIsoDate());
  const [odometerKm, setOdometerKm] = useState(existing ? String(existing.odometerKm) : "");
  const [litres, setLitres] = useState(existing ? String(existing.quantityMilliLitres / 1000) : "");
  const [cost, setCost] = useState(existing ? String(existing.cost.amountMinor / 100) : "");
  const [station, setStation] = useState(existing?.station ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const parsedOdometer = parseInteger(odometerKm);
    const quantityMilliLitres = parseLitres(litres);
    const amountMinor = parseRupees(cost, true);
    if (parsedOdometer === null || quantityMilliLitres === null || amountMinor === null || amountMinor === undefined) {
      setError("Enter a valid odometer reading, fuel quantity, and non-negative cost.");
      return;
    }
    const draft: FuelDraft = { id: existing?.id ?? createId("fuel"), vehicleId, occurredOn, odometerKm: parsedOdometer, quantityMilliLitres, cost: { amountMinor, currency: "INR" }, station: station.trim() || null, note: note.trim() || null };
    setSaving(true); setError(null);
    try {
      const saved = existing ? await repository.update(draft, todayIsoDate()) : await repository.create(draft, todayIsoDate());
      onSaved(saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Fuel entry could not be saved.");
    } finally { setSaving(false); }
  };
  return <View style={styles.form}>{error ? <InlineError message={error} /> : null}<DateField label="Date" value={occurredOn} onChange={(value) => setOccurredOn(value ?? todayIsoDate())} maximumDate={todayIsoDate()} /><VclField label="Odometer (km)" value={odometerKm} onChangeText={setOdometerKm} placeholder="e.g. 42500" keyboardType="number-pad" /><VclField label="Quantity (litres)" value={litres} onChangeText={setLitres} placeholder="e.g. 35.5" keyboardType="decimal-pad" /><VclField label="Cost (₹)" value={cost} onChangeText={setCost} placeholder="e.g. 2500.00" keyboardType="decimal-pad" /><VclField label="Station" value={station} onChangeText={setStation} placeholder="Optional" /><VclField label="Note" value={note} onChangeText={setNote} placeholder="Optional" multiline /><FormActions label={existing ? "Save fuel changes" : "Save fuel fill"} saving={saving} onCancel={onCancel} onSave={save} /></View>;
}

function ServiceForm({ vehicleId, existing, onCancel, onSaved }: { vehicleId: VehicleId; existing: ServiceRecord | null; onCancel: () => void; onSaved: (record: ServiceRecord) => void }) {
  const database = useLocalDatabase();
  const repository = useMemo(() => new LocalServiceRepository(database), [database]);
  const [occurredOn, setOccurredOn] = useState(existing?.occurredOn ?? todayIsoDate());
  const [odometerKm, setOdometerKm] = useState(existing ? String(existing.odometerKm) : "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [provider, setProvider] = useState(existing?.provider ?? "");
  const [cost, setCost] = useState(existing?.cost ? String(existing.cost.amountMinor / 100) : "");
  const [nextDueOn, setNextDueOn] = useState<string | null>(existing?.nextDueOn ?? null);
  const [nextDueOdometerKm, setNextDueOdometerKm] = useState(existing?.nextDueOdometerKm === null || existing?.nextDueOdometerKm === undefined ? "" : String(existing.nextDueOdometerKm));
  const [note, setNote] = useState(existing?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const parsedOdometer = parseInteger(odometerKm);
    const amountMinor = parseRupees(cost, false);
    const nextOdometer = nextDueOdometerKm.trim() ? parseInteger(nextDueOdometerKm) : null;
    if (!category.trim() || parsedOdometer === null || amountMinor === undefined || (nextDueOdometerKm.trim() && nextOdometer === null)) {
      setError("Enter a service category, a valid odometer reading, and valid optional cost and due mileage.");
      return;
    }
    const draft: ServiceDraft = { id: existing?.id ?? createId("service"), vehicleId, category: category.trim(), occurredOn, odometerKm: parsedOdometer, provider: provider.trim() || null, cost: amountMinor === null ? null : { amountMinor, currency: "INR" }, note: note.trim() || null, nextDueOn, nextDueOdometerKm: nextOdometer };
    setSaving(true); setError(null);
    try {
      const saved = existing ? await repository.update(draft, todayIsoDate()) : await repository.create(draft, todayIsoDate());
      onSaved(saved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Service record could not be saved."); } finally { setSaving(false); }
  };
  return <View style={styles.form}>{error ? <InlineError message={error} /> : null}<DateField label="Service date" value={occurredOn} onChange={(value) => setOccurredOn(value ?? todayIsoDate())} maximumDate={todayIsoDate()} /><VclField label="Odometer (km)" value={odometerKm} onChangeText={setOdometerKm} placeholder="e.g. 42500" keyboardType="number-pad" /><VclField label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Oil and filter" /><VclField label="Provider" value={provider} onChangeText={setProvider} placeholder="Optional" /><VclField label="Cost (₹)" value={cost} onChangeText={setCost} placeholder="Optional" keyboardType="decimal-pad" /><DateField label="Next due date" value={nextDueOn} onChange={setNextDueOn} optional /><VclField label="Next due odometer (km)" value={nextDueOdometerKm} onChangeText={setNextDueOdometerKm} placeholder="Optional" keyboardType="number-pad" /><VclField label="Note" value={note} onChangeText={setNote} placeholder="Optional" multiline /><FormActions label={existing ? "Save service changes" : "Save service"} saving={saving} onCancel={onCancel} onSave={save} /></View>;
}

function RepairForm({ vehicleId, existing, onCancel, onSaved }: { vehicleId: VehicleId; existing: RepairRecord | null; onCancel: () => void; onSaved: (record: RepairRecord) => void }) {
  const database = useLocalDatabase();
  const repository = useMemo(() => new LocalRepairRepository(database), [database]);
  const [occurredOn, setOccurredOn] = useState(existing?.occurredOn ?? todayIsoDate());
  const [odometerKm, setOdometerKm] = useState(existing ? String(existing.odometerKm) : "");
  const [issue, setIssue] = useState(existing?.issue ?? "");
  const [workPerformed, setWorkPerformed] = useState(existing?.workPerformed ?? "");
  const [provider, setProvider] = useState(existing?.provider ?? "");
  const [cost, setCost] = useState(existing?.cost ? String(existing.cost.amountMinor / 100) : "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const parsedOdometer = parseInteger(odometerKm);
    const amountMinor = parseRupees(cost, false);
    if (!issue.trim() || parsedOdometer === null || amountMinor === undefined) {
      setError("Describe the issue and enter valid odometer and optional cost values.");
      return;
    }
    const draft: RepairDraft = { id: existing?.id ?? createId("repair"), vehicleId, issue: issue.trim(), workPerformed: workPerformed.trim() || null, occurredOn, odometerKm: parsedOdometer, provider: provider.trim() || null, cost: amountMinor === null ? null : { amountMinor, currency: "INR" }, note: note.trim() || null };
    setSaving(true); setError(null);
    try {
      const saved = existing ? await repository.update(draft, todayIsoDate()) : await repository.create(draft, todayIsoDate());
      onSaved(saved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Repair record could not be saved."); } finally { setSaving(false); }
  };
  return <View style={styles.form}>{error ? <InlineError message={error} /> : null}<DateField label="Repair date" value={occurredOn} onChange={(value) => setOccurredOn(value ?? todayIsoDate())} maximumDate={todayIsoDate()} /><VclField label="Odometer (km)" value={odometerKm} onChangeText={setOdometerKm} placeholder="e.g. 42500" keyboardType="number-pad" /><VclField label="Issue" value={issue} onChangeText={setIssue} placeholder="e.g. Brake noise" multiline /><VclField label="Work performed" value={workPerformed} onChangeText={setWorkPerformed} placeholder="Optional" multiline /><VclField label="Provider" value={provider} onChangeText={setProvider} placeholder="Optional" /><VclField label="Cost (₹)" value={cost} onChangeText={setCost} placeholder="Optional" keyboardType="decimal-pad" /><VclField label="Note" value={note} onChangeText={setNote} placeholder="Optional" multiline /><FormActions label={existing ? "Save repair changes" : "Save repair"} saving={saving} onCancel={onCancel} onSave={save} /></View>;
}

function FormActions({ label, saving, onCancel, onSave }: { label: string; saving: boolean; onCancel: () => void; onSave: () => void }) {
  return <View style={styles.actions}><VclButton label={label} icon="checkmark" onPress={onSave} loading={saving} /><VclButton label="Cancel" variant="secondary" onPress={onCancel} disabled={saving} /></View>;
}

const styles = StyleSheet.create({ form: { gap: layoutTokens.spacing.md }, actions: { gap: layoutTokens.spacing.sm, marginTop: layoutTokens.spacing.xs } });
