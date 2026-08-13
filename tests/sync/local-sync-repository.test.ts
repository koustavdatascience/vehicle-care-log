import { describe, expect, it } from "vitest";

import type { SqlDatabase } from "../../src/data/database-contract";
import type { SyncEnvelope } from "../../src/domain/models";
import { LocalSyncRepository } from "../../src/sync/local-sync-repository";

class FakeSyncDatabase implements SqlDatabase {
  runCalls: Array<{ source: string; parameters: unknown[] }> = [];
  transactionCount = 0;
  account = { account_id: null as string | null, link_decision: null as "upload-device" | "download-cloud" | null, pull_cursor: 0, last_sync_at: null as string | null, last_error: null as string | null };
  pendingVehicleRows: Array<Record<string, unknown>> = [];
  outboxRows: Array<Record<string, unknown>> = [];
  existingRow: Record<string, unknown> | null = null;

  async execAsync(): Promise<void> {}
  async runAsync(source: string, ...parameters: unknown[]) {
    this.runCalls.push({ source, parameters });
    return { lastInsertRowId: this.runCalls.length, changes: 1 };
  }
  async getFirstAsync<T>(source: string): Promise<T | null> {
    if (source.includes("FROM sync_account_state")) return this.account as T;
    if (source.includes("FROM vehicles WHERE id")) return this.existingRow as T | null;
    return null;
  }
  async getAllAsync<T>(source: string): Promise<T[]> {
    if (source.includes("FROM vehicles WHERE sync_state")) return this.pendingVehicleRows as T[];
    if (source.includes("FROM sync_outbox")) return this.outboxRows as T[];
    return [];
  }
  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> { this.transactionCount += 1; return task(); }
}

const remoteVehicle: SyncEnvelope = {
  entityType: "vehicle",
  entityId: "vehicle-remote",
  operation: "upsert",
  updatedAt: "2026-12-01T10:00:00.000Z",
  deletedAt: null,
  payload: { nickname: "Tourer", make: "Tata", model: "Nexon", year: 2026, created_at: "2026-12-01T10:00:00.000Z" },
};

describe("Phase 8 local sync repository", () => {
  it("persists an explicit account decision without making sync mandatory", async () => {
    const database = new FakeSyncDatabase();
    const repository = new LocalSyncRepository(database);

    expect((await repository.getAccountState()).accountId).toBeNull();
    await repository.linkAccount("account-1", "upload-device");
    await repository.clearAccount();

    expect(database.runCalls[0].source).toContain("link_decision");
    expect(database.runCalls[0].parameters).toEqual(["account-1", "upload-device", "account-1"]);
    expect(database.runCalls[1].source).toContain("account_id = NULL");
  });

  it("stages bounded pending local data idempotently and maps deletion envelopes", async () => {
    const database = new FakeSyncDatabase();
    database.pendingVehicleRows = [{ id: "vehicle-local", nickname: "City", updated_at: "2026-10-01T00:00:00.000Z", deleted_at: "2026-10-02T00:00:00.000Z", sync_state: "failed" }];
    database.outboxRows = [{ entity_type: "vehicle", entity_id: "vehicle-local", operation: "delete", payload: '{"nickname":"City"}', updated_at: "2026-10-02T00:00:00.000Z", attempt_count: 1 }];
    const repository = new LocalSyncRepository(database);

    expect(await repository.stagePendingRecords()).toBe(1);
    const due = await repository.listDueOutbox(1, "2026-10-03T00:00:00.000Z");

    expect(database.runCalls[0].source).toContain("ON CONFLICT(entity_type, entity_id)");
    expect(due).toEqual([{ entityType: "vehicle", entityId: "vehicle-local", operation: "delete", updatedAt: "2026-10-02T00:00:00.000Z", deletedAt: "2026-10-02T00:00:00.000Z", payload: { nickname: "City" } }]);
  });

  it("defers offline failures with a bounded retry and retains the recovery reason", async () => {
    const database = new FakeSyncDatabase();
    const repository = new LocalSyncRepository(database);
    await repository.deferFailure("offline", new Date("2026-10-01T10:00:00.000Z"));

    expect(database.runCalls[0].source).toContain("attempt_count = attempt_count + 1");
    expect(database.runCalls[0].parameters[0]).toBe("2026-10-01T10:01:00.000Z");
    expect(database.runCalls[1].source).toContain("last_error");
  });

  it("retains newer unsynced local data as a conflict instead of overwriting it", async () => {
    const database = new FakeSyncDatabase();
    database.existingRow = { id: "vehicle-remote", nickname: "Local City", updated_at: "2026-12-02T10:00:00.000Z", deleted_at: null, sync_state: "pending" };

    await expect(new LocalSyncRepository(database).applyRemote(remoteVehicle)).resolves.toBe("conflict");
    expect(database.runCalls[0].source).toContain("INSERT INTO sync_conflicts");
    expect(database.runCalls.some((call) => call.source.includes("INSERT INTO vehicles"))).toBe(false);
  });

  it("applies newer remote data and persists a pull cursor after recovery", async () => {
    const database = new FakeSyncDatabase();
    const repository = new LocalSyncRepository(database);

    await expect(repository.applyRemote(remoteVehicle)).resolves.toBe("applied");
    await repository.finishPull(12);

    expect(database.runCalls[0].source).toContain("INSERT INTO vehicles");
    expect(database.runCalls[0].parameters).toContain("synced");
    expect(database.runCalls[1].parameters[0]).toBe(12);
  });
});
