import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useLocalDatabase } from "@/components/foundation/local-storage-provider";
import { useSync } from "@/components/foundation/sync-provider";
import { useActiveVehicle } from "@/components/foundation/vehicle-provider";
import { AppHeader } from "@/components/layout/app-header";
import { RecordForm, type CareRecord, type RecordType } from "@/components/records/record-form";
import { ScreenContainer } from "@/components/screen-container";
import { ConfirmationSurface, EmptyState, InlineError, LoadingState } from "@/components/ui/vcl-feedback";
import { VclButton } from "@/components/ui/vcl-button";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import { LocalFuelRepository, LocalRepairRepository, LocalServiceRepository } from "@/src/repositories/local-repositories";
import { listAttachments, pickAndQueueAttachment, uploadQueuedAttachment } from "@/src/sync/attachment-and-backup-service";
import { createTRPCClient } from "@/lib/trpc";
import type { Attachment } from "@/src/domain/models";

function isRecordType(value: string | undefined): value is RecordType {
  return value === "fuel" || value === "service" || value === "repair";
}

function formatMoney(amountMinor: number): string {
  return `₹${(amountMinor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RecordDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type: string | string[]; id: string | string[] }>();
  const typeValue = Array.isArray(params.type) ? params.type[0] : params.type;
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const database = useLocalDatabase();
  const colors = useColors();
  const { activeVehicle } = useActiveVehicle();
  const { status: syncStatus } = useSync();
  const client = useMemo(() => createTRPCClient(), []);
  const type = isRecordType(typeValue) ? typeValue : null;
  const [record, setRecord] = useState<CareRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!type || !id) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const found = type === "fuel" ? await new LocalFuelRepository(database).findById(id) : type === "service" ? await new LocalServiceRepository(database).findById(id) : await new LocalRepairRepository(database).findById(id);
      setRecord(found);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Record could not be loaded."); } finally { setLoading(false); }
  }, [database, id, type]);

  useEffect(() => { void load(); }, [load]);
  const deleteRecord = async () => {
    if (!type || !id || !record) return;
    setDeleting(true); setError(null);
    try {
      if (type === "fuel") await new LocalFuelRepository(database).softDelete(id);
      else if (type === "service") await new LocalServiceRepository(database).softDelete(id);
      else await new LocalRepairRepository(database).softDelete(id);
      router.replace({ pathname: "/vehicle/[id]/records", params: { id: record.vehicleId } });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Record could not be deleted."); } finally { setDeleting(false); setConfirmDelete(false); }
  };

  if (!type || !id) return <ScreenContainer><View style={styles.center}><EmptyState title="Record not available" message="This record link is incomplete." /></View></ScreenContainer>;
  if (loading) return <ScreenContainer><View style={styles.center}><LoadingState label="Loading record" /></View></ScreenContainer>;
  if (!record) return <ScreenContainer><View style={styles.center}><EmptyState title="Record not available" message="It may have been deleted or is not stored on this device." actionLabel="Go back" onAction={() => router.back()} /></View></ScreenContainer>;

  const isActiveVehicleRecord = activeVehicle?.id === record.vehicleId;
  return <ScreenContainer><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><AppHeader title={editing ? `Edit ${type}` : `${type[0].toUpperCase()}${type.slice(1)} record`} subtitle={isActiveVehicleRecord ? activeVehicle?.nickname : "Saved vehicle-care record"} onBack={() => editing ? setEditing(false) : router.back()} />{error ? <InlineError message={error} /> : null}{editing ? <RecordForm type={type} vehicleId={record.vehicleId} existing={record} onCancel={() => setEditing(false)} onSaved={(saved) => { setRecord(saved); setEditing(false); }} /> : <><RecordDetails type={type} record={record} colors={colors} /><AttachmentSection database={database} client={client} recordType={type} recordId={record.id} syncReady={syncStatus === "ready"} /><VclButton label="Edit record" icon="pencil" onPress={() => setEditing(true)} /><VclButton label="Delete record" icon="trash" variant="ghost" onPress={() => setConfirmDelete(true)} disabled={deleting} />{confirmDelete ? <ConfirmationSurface title="Delete this record?" message="The entry will be removed from visible history and its expense projection will be excluded from totals."><VclButton label="Delete record" icon="trash" onPress={() => { void deleteRecord(); }} loading={deleting} /><VclButton label="Keep record" variant="secondary" onPress={() => setConfirmDelete(false)} disabled={deleting} /></ConfirmationSurface> : null}</>}</ScrollView></ScreenContainer>;
}

function AttachmentSection({ database, client, recordType, recordId, syncReady }: { database: ReturnType<typeof useLocalDatabase>; client: ReturnType<typeof createTRPCClient>; recordType: RecordType; recordId: string; syncReady: boolean }) {
  const colors = useColors();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reload = useCallback(async () => setAttachments(await listAttachments(database, recordType, recordId)), [database, recordId, recordType]);
  useEffect(() => { void reload(); }, [reload]);
  const add = async () => {
    setBusy(true); setMessage(null);
    try {
      const item = await pickAndQueueAttachment(database, recordType, recordId);
      if (item && syncReady) await uploadQueuedAttachment(database, client, item);
      await reload();
      if (item && !syncReady) setMessage("Saved on this device. Link an account to upload a protected cloud copy.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Attachment could not be saved."); } finally { setBusy(false); }
  };
  const retry = async (attachment: Attachment) => {
    setBusy(true); setMessage(null);
    try { await uploadQueuedAttachment(database, client, attachment); await reload(); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Upload will remain queued."); } finally { setBusy(false); }
  };
  return <View style={[styles.attachmentCard, { borderColor: colors.border, backgroundColor: colors.surface }]}><Text style={[styles.attachmentTitle, { color: colors.foreground }]}>Attachments</Text><Text style={[styles.attachmentHint, { color: colors.muted }]}>Photos and PDFs are saved locally first. Files are limited to 20 MB.</Text>{attachments.map((attachment) => <View key={attachment.id} style={styles.attachmentRow}><Text style={[styles.attachmentName, { color: colors.foreground }]} numberOfLines={1}>{attachment.fileName ?? "Attachment"}</Text><Text style={[styles.attachmentStatus, { color: colors.muted }]}>{attachment.uploadStatus === "uploaded" ? "Backed up" : attachment.uploadStatus === "failed" ? "Upload failed" : "On this device"}</Text>{syncReady && attachment.uploadStatus !== "uploaded" ? <VclButton label="Retry upload" variant="ghost" onPress={() => { void retry(attachment); }} disabled={busy} /> : null}</View>)}{message ? <Text style={[styles.attachmentHint, { color: colors.muted }]}>{message}</Text> : null}<VclButton label="Add attachment" icon="plus" onPress={() => { void add(); }} loading={busy} /></View>;
}

function RecordDetails({ type, record, colors }: { type: RecordType; record: CareRecord; colors: ReturnType<typeof useColors> }) {
  const details: [string, string][] = [["Date", record.occurredOn], ["Odometer", `${record.odometerKm.toLocaleString("en-IN")} km`]];
  if (type === "fuel" && "quantityMilliLitres" in record) { details.push(["Quantity", `${record.quantityMilliLitres / 1000} litres`], ["Cost", formatMoney(record.cost.amountMinor)], ["Station", record.station ?? "Not recorded"], ["Note", record.note ?? "Not recorded"]); }
  if (type === "service" && "category" in record) { details.push(["Category", record.category], ["Provider", record.provider ?? "Not recorded"], ["Cost", record.cost ? formatMoney(record.cost.amountMinor) : "Not recorded"], ["Next due date", record.nextDueOn ?? "Not set"], ["Next due mileage", record.nextDueOdometerKm === null ? "Not set" : `${record.nextDueOdometerKm.toLocaleString("en-IN")} km`], ["Note", record.note ?? "Not recorded"]); }
  if (type === "repair" && "issue" in record) { details.push(["Issue", record.issue], ["Work performed", record.workPerformed ?? "Not recorded"], ["Provider", record.provider ?? "Not recorded"], ["Cost", record.cost ? formatMoney(record.cost.amountMinor) : "Not recorded"], ["Note", record.note ?? "Not recorded"]); }
  return <View style={[styles.detailCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>{details.map(([label, value]) => <View key={label} style={styles.detailRow}><Text style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text></View>)}</View>;
}

const styles = StyleSheet.create({ content: { padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.md, paddingBottom: layoutTokens.spacing.xl }, center: { flex: 1, justifyContent: "center", padding: layoutTokens.spacing.md }, detailCard: { borderWidth: 1, borderRadius: layoutTokens.radius.lg, padding: layoutTokens.spacing.md, gap: 14 }, detailRow: { gap: 3 }, detailLabel: { fontSize: 13, fontWeight: "700" }, detailValue: { fontSize: 16, lineHeight: 22 }, attachmentCard: { borderWidth: 1, borderRadius: layoutTokens.radius.lg, gap: 8, padding: layoutTokens.spacing.md }, attachmentTitle: { fontSize: 17, fontWeight: "700" }, attachmentHint: { fontSize: 13, lineHeight: 19 }, attachmentRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#D8E0EA", gap: 3, paddingTop: 10 }, attachmentName: { fontSize: 15, fontWeight: "600" }, attachmentStatus: { fontSize: 13 } });
