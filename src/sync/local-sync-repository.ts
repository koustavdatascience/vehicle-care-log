import type {
  AccountLinkDecision,
  SyncAccountState,
  SyncConflict,
  SyncEntityType,
  SyncEnvelope,
} from "@/src/domain/models";
import type { SqlDatabase } from "@/src/data/database-contract";

type RawRow = Record<string, unknown> & { id: string; updated_at?: string; deleted_at?: string | null; sync_state?: string };
type OutboxRow = { entity_type: SyncEntityType; entity_id: string; operation: "upsert" | "delete"; payload: string; updated_at: string; attempt_count: number };

const entities: readonly { type: SyncEntityType; table: string }[] = [
  { type: "vehicle", table: "vehicles" },
  { type: "fuel", table: "fuel_entries" },
  { type: "service", table: "service_records" },
  { type: "repair", table: "repair_records" },
  { type: "reminder", table: "reminders" },
  { type: "attachment", table: "attachments" },
];
const tableFor = new Map(entities.map((item) => [item.type, item.table]));

function parseRecord(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
}

function toEnvelope(type: SyncEntityType, row: RawRow): SyncEnvelope {
  const { sync_state: _syncState, ...payload } = row;
  const updatedAt = typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString();
  const deletedAt = typeof row.deleted_at === "string" ? row.deleted_at : null;
  return {
    entityType: type,
    entityId: row.id,
    operation: deletedAt ? "delete" : "upsert",
    updatedAt,
    deletedAt,
    payload,
  };
}

function safeColumns(payload: Record<string, unknown>) {
  return Object.keys(payload).filter((key) => /^[a-z_]+$/.test(key));
}

export class LocalSyncRepository {
  constructor(private readonly database: SqlDatabase) {}

  async getAccountState(): Promise<SyncAccountState> {
    const row = await this.database.getFirstAsync<{
      account_id: string | null; link_decision: AccountLinkDecision | null; pull_cursor: number; last_sync_at: string | null; last_error: string | null;
    }>("SELECT account_id, link_decision, pull_cursor, last_sync_at, last_error FROM sync_account_state WHERE singleton = 1");
    return {
      accountId: row?.account_id ?? null,
      linkDecision: row?.link_decision ?? null,
      pullCursor: row?.pull_cursor ?? 0,
      lastSyncAt: row?.last_sync_at ?? null,
      lastError: row?.last_error ?? null,
    };
  }

  async linkAccount(accountId: string, decision: AccountLinkDecision): Promise<void> {
    await this.database.runAsync(
      "UPDATE sync_account_state SET account_id = ?, link_decision = ?, pull_cursor = CASE WHEN account_id = ? THEN pull_cursor ELSE 0 END, last_error = NULL WHERE singleton = 1",
      accountId,
      decision,
      accountId,
    );
  }

  async clearAccount(): Promise<void> {
    await this.database.runAsync(
      "UPDATE sync_account_state SET account_id = NULL, link_decision = NULL, pull_cursor = 0, last_sync_at = NULL, last_error = NULL WHERE singleton = 1",
    );
  }

  /** Creates/updates idempotent queue rows for pending local state without network I/O. */
  async stagePendingRecords(): Promise<number> {
    let count = 0;
    for (const entity of entities) {
      const rows = await this.database.getAllAsync<RawRow>(
        `SELECT * FROM ${entity.table} WHERE sync_state IN ('local', 'pending', 'failed') ORDER BY updated_at ASC LIMIT 100`,
      );
      for (const row of rows) {
        const envelope = toEnvelope(entity.type, row);
        await this.database.runAsync(
          `INSERT INTO sync_outbox (entity_type, entity_id, operation, payload, updated_at, attempt_count, next_retry_at, last_error)
           VALUES (?, ?, ?, ?, ?, 0, NULL, NULL)
           ON CONFLICT(entity_type, entity_id) DO UPDATE SET operation = excluded.operation, payload = excluded.payload, updated_at = excluded.updated_at, next_retry_at = NULL, last_error = NULL`,
          envelope.entityType,
          envelope.entityId,
          envelope.operation,
          JSON.stringify(envelope.payload),
          envelope.updatedAt,
        );
        count += 1;
      }
    }
    return count;
  }

  async listDueOutbox(limit = 50, now = new Date().toISOString()): Promise<SyncEnvelope[]> {
    const rows = await this.database.getAllAsync<OutboxRow>(
      "SELECT entity_type, entity_id, operation, payload, updated_at, attempt_count FROM sync_outbox WHERE next_retry_at IS NULL OR next_retry_at <= ? ORDER BY updated_at ASC LIMIT ?",
      now,
      limit,
    );
    return rows.map((row) => ({
      entityType: row.entity_type,
      entityId: row.entity_id,
      operation: row.operation,
      updatedAt: row.updated_at,
      deletedAt: row.operation === "delete" ? row.updated_at : null,
      payload: parseRecord(row.payload),
    }));
  }

  async acknowledge(entityType: SyncEntityType, entityId: string): Promise<void> {
    const table = tableFor.get(entityType);
    if (!table) return;
    await this.database.withTransactionAsync(async () => {
      await this.database.runAsync("DELETE FROM sync_outbox WHERE entity_type = ? AND entity_id = ?", entityType, entityId);
      await this.database.runAsync(`UPDATE ${table} SET sync_state = 'synced' WHERE id = ?`, entityId);
    });
  }

  async deferFailure(error: string, now = new Date()): Promise<void> {
    const retryAt = new Date(now.getTime() + 60_000).toISOString();
    await this.database.runAsync(
      "UPDATE sync_outbox SET attempt_count = attempt_count + 1, next_retry_at = ?, last_error = ?",
      retryAt,
      error.slice(0, 500),
    );
    await this.database.runAsync("UPDATE sync_account_state SET last_error = ? WHERE singleton = 1", error.slice(0, 500));
  }

  async recordConflict(local: SyncEnvelope, remote: SyncEnvelope): Promise<void> {
    await this.database.runAsync(
      "INSERT INTO sync_conflicts (entity_type, entity_id, local_payload, remote_payload, detected_at, resolved_at) VALUES (?, ?, ?, ?, ?, NULL)",
      local.entityType,
      local.entityId,
      JSON.stringify(local.payload),
      JSON.stringify(remote.payload),
      new Date().toISOString(),
    );
  }

  async listOpenConflicts(): Promise<SyncConflict[]> {
    const rows = await this.database.getAllAsync<{ id: number; entity_type: SyncEntityType; entity_id: string; local_payload: string; remote_payload: string; detected_at: string }>(
      "SELECT id, entity_type, entity_id, local_payload, remote_payload, detected_at FROM sync_conflicts WHERE resolved_at IS NULL ORDER BY detected_at DESC",
    );
    return rows.map((row) => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      localPayload: parseRecord(row.local_payload),
      remotePayload: parseRecord(row.remote_payload),
      detectedAt: row.detected_at,
    }));
  }

  /** Applies only a newer remote change. A newer unsynced local row is retained and recorded as a conflict. */
  async applyRemote(envelope: SyncEnvelope): Promise<"applied" | "ignored" | "conflict"> {
    const table = tableFor.get(envelope.entityType);
    if (!table) return "ignored";
    const existing = await this.database.getFirstAsync<RawRow>(`SELECT * FROM ${table} WHERE id = ?`, envelope.entityId);
    const localUpdatedAt = typeof existing?.updated_at === "string" ? existing.updated_at : null;
    const locallyChanged = existing && existing.sync_state !== "synced";
    if (localUpdatedAt && localUpdatedAt > envelope.updatedAt && locallyChanged) {
      await this.recordConflict(toEnvelope(envelope.entityType, existing), envelope);
      return "conflict";
    }
    if (localUpdatedAt && localUpdatedAt >= envelope.updatedAt) return "ignored";

    const payload: Record<string, unknown> = {
      ...envelope.payload,
      id: envelope.entityId,
      updated_at: envelope.updatedAt,
      deleted_at: envelope.deletedAt,
      sync_state: "synced",
    };
    const columns = safeColumns(payload);
    if (columns.length === 0) return "ignored";
    const values = columns.map((column) => payload[column] ?? null);
    const updateColumns = columns.filter((column) => column !== "id" && column !== "created_at");
    await this.database.runAsync(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})
       ON CONFLICT(id) DO UPDATE SET ${updateColumns.map((column) => `${column} = excluded.${column}`).join(", ")}`,
      ...values,
    );
    return "applied";
  }

  async finishPull(cursor: number): Promise<void> {
    await this.database.runAsync(
      "UPDATE sync_account_state SET pull_cursor = ?, last_sync_at = ?, last_error = NULL WHERE singleton = 1",
      cursor,
      new Date().toISOString(),
    );
  }
}
