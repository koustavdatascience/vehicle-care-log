import { describe, expect, it } from "vitest";

import type { SqlDatabase } from "../../src/data/database-contract";
import { LocalStorageError } from "../../src/data/database-contract";
import { LOCAL_SCHEMA_VERSION, migrateDatabase, migrations } from "../../src/data/migrations";

class FakeMigrationDatabase implements SqlDatabase {
  version = 0;
  executed: string[] = [];
  shouldFail = false;

  async execAsync(source: string): Promise<void> {
    if (this.shouldFail) throw new Error("disk is unavailable");
    this.executed.push(source);
    const version = source.match(/PRAGMA user_version = (\d+)/)?.[1];
    if (version) this.version = Number(version);
  }

  async runAsync() { return { lastInsertRowId: 0, changes: 0 }; }

  async getFirstAsync<T>(): Promise<T | null> {
    return { user_version: this.version } as T;
  }

  async getAllAsync<T>(): Promise<T[]> { return []; }

  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> { return task(); }
}

describe("Phase 4 migration contract", () => {
  it("has a monotonic initial migration with the local-first integrity structures", () => {
    expect(LOCAL_SCHEMA_VERSION).toBe(1);
    expect(migrations.map((migration) => migration.version)).toEqual([1]);
    expect(migrations[0].sql).toContain("PRAGMA foreign_keys = ON");
    expect(migrations[0].sql).toContain("expense_projections");
    expect(migrations[0].sql).toContain("sync_metadata");
    expect(migrations[0].sql).toContain("idx_fuel_dedup_active");
  });

  it("creates the full initial schema on a fresh install and is idempotent on restart", async () => {
    const database = new FakeMigrationDatabase();

    expect(await migrateDatabase(database)).toBe(1);
    expect(database.version).toBe(1);
    expect(database.executed.join("\n")).toContain("CREATE TABLE IF NOT EXISTS vehicles");
    const writesAfterFirstLaunch = database.executed.length;
    expect(await migrateDatabase(database)).toBe(1);
    expect(database.executed).toHaveLength(writesAfterFirstLaunch);
  });

  it("wraps unavailable storage failures without leaving a misleading ready state", async () => {
    const database = new FakeMigrationDatabase();
    database.shouldFail = true;

    await expect(migrateDatabase(database)).rejects.toMatchObject({
      code: "migration-failed",
    });
  });
});
