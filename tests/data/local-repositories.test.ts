import { describe, expect, it } from "vitest";

import type { SqlDatabase } from "../../src/data/database-contract";
import { LocalStorageError } from "../../src/data/database-contract";
import { seedFuelEntry } from "../../src/data/seed-fixtures";
import { LocalFuelRepository } from "../../src/repositories/local-repositories";

class FakeFuelDatabase implements SqlDatabase {
  runCalls: Array<{ source: string; parameters: unknown[] }> = [];
  duplicateId: string | null = null;
  shouldFailWrites = false;
  transactionCount = 0;

  async execAsync(): Promise<void> {}

  async runAsync(source: string, ...parameters: unknown[]) {
    if (this.shouldFailWrites) throw new Error("storage is full");
    this.runCalls.push({ source, parameters });
    return { lastInsertRowId: this.runCalls.length, changes: 1 };
  }

  async getFirstAsync<T>(source: string): Promise<T | null> {
    if (source.includes("current_odometer_km")) return { current_odometer_km: 46000 } as T;
    if (source.includes("FROM fuel_entries") && source.includes("COALESCE(station")) return this.duplicateId ? ({ id: this.duplicateId } as T) : null;
    return null;
  }

  async getAllAsync<T>(): Promise<T[]> { return []; }

  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> {
    this.transactionCount += 1;
    return task();
  }
}

describe("Phase 4 local fuel repository", () => {
  it("rejects invalid quantity before a transaction starts and leaves no partial writes", async () => {
    const database = new FakeFuelDatabase();
    const repository = new LocalFuelRepository(database);

    await expect(repository.create({ ...seedFuelEntry, quantityMilliLitres: 0 }, "2026-08-13")).rejects.toMatchObject({ code: "write-failed" });
    expect(database.transactionCount).toBe(0);
    expect(database.runCalls).toHaveLength(0);
  });

  it("rejects a duplicate active fuel entry without writing a second expense projection", async () => {
    const database = new FakeFuelDatabase();
    database.duplicateId = "fuel-existing";
    const repository = new LocalFuelRepository(database);

    await expect(repository.create(seedFuelEntry, "2026-08-13")).rejects.toMatchObject({ code: "write-failed" });
    expect(database.transactionCount).toBe(1);
    expect(database.runCalls).toHaveLength(0);
  });

  it("wraps a local storage failure and succeeds transactionally when storage is available", async () => {
    const failingDatabase = new FakeFuelDatabase();
    failingDatabase.shouldFailWrites = true;
    await expect(new LocalFuelRepository(failingDatabase).create(seedFuelEntry, "2026-08-13")).rejects.toMatchObject({ code: "write-failed" });

    const database = new FakeFuelDatabase();
    const saved = await new LocalFuelRepository(database).create(seedFuelEntry, "2026-08-13");
    expect(saved.id).toBe(seedFuelEntry.id);
    expect(database.transactionCount).toBe(1);
    expect(database.runCalls).toHaveLength(4);
    expect(database.runCalls[1].source).toContain("DELETE FROM expense_projections");
    expect(database.runCalls[2].source).toContain("expense_projections");
    expect(database.runCalls[3].source).toContain("UPDATE vehicles");
  });
});
