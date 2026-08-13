import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import type { SqlDatabase } from "@/src/data/database-contract";
import type { Attachment } from "@/src/domain/models";

type AttachmentRecordType = Attachment["recordType"];

type UploadClient = {
  attachments: {
    createUploadIntent: { mutate(input: { attachmentId: string; recordType: "fuel" | "service" | "repair"; recordId: string; fileName: string; mimeType: string; byteSize: number }): Promise<{ objectKey: string; uploadUrl: string }> };
    completeUpload: { mutate(input: { attachmentId: string }): Promise<unknown> };
  };
};

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapAttachment(row: {
  id: string; record_type: AttachmentRecordType; record_id: string; local_uri: string; mime_type: string; file_name: string | null; byte_size: number | null; remote_key: string | null; upload_status: Attachment["uploadStatus"]; created_at: string; deleted_at: string | null;
}): Attachment {
  return {
    id: row.id,
    recordType: row.record_type,
    recordId: row.record_id,
    localUri: row.local_uri,
    mimeType: row.mime_type,
    fileName: row.file_name,
    byteSize: row.byte_size,
    remoteKey: row.remote_key,
    uploadStatus: row.upload_status,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    syncState: "pending",
  };
}

export async function listAttachments(database: SqlDatabase, recordType: AttachmentRecordType, recordId: string): Promise<Attachment[]> {
  const rows = await database.getAllAsync<Parameters<typeof mapAttachment>[0]>(
    "SELECT id, record_type, record_id, local_uri, mime_type, file_name, byte_size, remote_key, upload_status, created_at, deleted_at FROM attachments WHERE record_type = ? AND record_id = ? AND deleted_at IS NULL ORDER BY created_at DESC",
    recordType,
    recordId,
  );
  return rows.map(mapAttachment);
}

export async function pickAndQueueAttachment(database: SqlDatabase, recordType: AttachmentRecordType, recordId: string): Promise<Attachment | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: ["image/*", "application/pdf"],
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > 20 * 1024 * 1024) throw new Error("Choose a file smaller than 20 MB.");
  const now = new Date().toISOString();
  const attachment: Attachment = {
    id: newId("attachment"),
    recordType,
    recordId,
    localUri: asset.uri,
    mimeType: asset.mimeType ?? "application/octet-stream",
    fileName: asset.name ?? "attachment",
    byteSize: asset.size ?? null,
    remoteKey: null,
    uploadStatus: "queued",
    createdAt: now,
    deletedAt: null,
    syncState: "pending",
  };
  await database.runAsync(
    "INSERT INTO attachments (id, record_type, record_id, local_uri, mime_type, created_at, deleted_at, sync_state, file_name, byte_size, remote_key, upload_status) VALUES (?, ?, ?, ?, ?, ?, NULL, 'pending', ?, ?, NULL, 'queued')",
    attachment.id,
    attachment.recordType,
    attachment.recordId,
    attachment.localUri,
    attachment.mimeType,
    attachment.createdAt,
    attachment.fileName,
    attachment.byteSize,
  );
  return attachment;
}

export async function uploadQueuedAttachment(database: SqlDatabase, client: UploadClient, attachment: Attachment): Promise<void> {
  if (!attachment.fileName || !attachment.byteSize) throw new Error("This attachment is missing its file metadata.");
  await database.runAsync("UPDATE attachments SET upload_status = 'uploading' WHERE id = ?", attachment.id);
  try {
    const intent = await client.attachments.createUploadIntent.mutate({
      attachmentId: attachment.id,
      recordType: attachment.recordType,
      recordId: attachment.recordId,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      byteSize: attachment.byteSize,
    });
    const source = await fetch(attachment.localUri);
    const body = await source.blob();
    const response = await fetch(intent.uploadUrl, { method: "PUT", headers: { "Content-Type": attachment.mimeType }, body });
    if (!response.ok) throw new Error("Attachment upload was not accepted.");
    await client.attachments.completeUpload.mutate({ attachmentId: attachment.id });
    await database.runAsync("UPDATE attachments SET remote_key = ?, upload_status = 'uploaded', sync_state = 'pending' WHERE id = ?", intent.objectKey, attachment.id);
  } catch (error) {
    await database.runAsync("UPDATE attachments SET upload_status = 'failed' WHERE id = ?", attachment.id);
    throw error;
  }
}

const backupTables = ["vehicles", "fuel_entries", "service_records", "repair_records", "reminders", "attachments"] as const;

export async function exportPortableBackup(database: SqlDatabase): Promise<{ uri: string; shared: boolean }> {
  const records = Object.fromEntries(await Promise.all(backupTables.map(async (table) => [table, await database.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table}`)])));
  const content = JSON.stringify({ format: "vehicle-care-log.backup.v1", createdAt: new Date().toISOString(), records }, null, 2);
  const directory = FileSystem.documentDirectory;
  if (!directory) throw new Error("Portable backups are unavailable in this browser. Use the signed-in backup option instead.");
  const uri = `${directory}vehicle-care-log-backup-${new Date().toISOString().slice(0, 10)}.json`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  const shared = await Sharing.isAvailableAsync();
  if (shared) await Sharing.shareAsync(uri, { dialogTitle: "Export Vehicle Care Log backup", mimeType: "application/json" });
  return { uri, shared };
}
