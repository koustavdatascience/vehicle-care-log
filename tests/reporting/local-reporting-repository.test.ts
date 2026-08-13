import { describe, expect, it } from "vitest";

import type { SqlDatabase } from "../../src/data/database-contract";
import { LocalReportingRepository } from "../../src/reporting/local-reporting-repository";

class FakeReportingDatabase implements SqlDatabase {
  readonly calls: Array<{ source: string; parameters: unknown[] }> = [];
  shouldFail = false;

  async execAsync(): Promise<void> {}
  async runAsync() { return { lastInsertRowId: 0, changes: 0 }; }
  async getFirstAsync<T>(): Promise<T | null> { return null; }
  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> { return task(); }

  async getAllAsync<T>(source: string, ...parameters: unknown[]): Promise<T[]> {
    this.calls.push({ source, parameters });
    if (this.shouldFail) throw new Error("local database unavailable");
    if (source.includes("UNION ALL") || (source.includes("service_records") && source.includes("AS type"))) return [{ id: "service-1", vehicle_id: "vehicle-1", type: "service", occurred_on: "2026-08-05", odometer_km: 20000, title: "Oil change", detail: "Garage", amount_minor: 250000, currency: "INR", created_at: "2026-08-05" }] as T[];
    if (source.includes("DISTINCT category")) return [{ category: "Oil change" }, { category: "Tyres" }] as T[];
    if (source.includes("SUM(total_cost_minor)")) return [{ category: "Service", currency: "INR", amount_minor: 250000, record_count: 1 }] as T[];
    if (source.includes("FROM expense_projections")) return [{ id: "expense-service-1", vehicle_id: "vehicle-1", source_type: "service", source_id: "service-1", occurred_on: "2026-08-05", category: "Service", total_cost_minor: 250000, currency: "INR", deleted_at: null }] as T[];
    if (source.includes("FROM fuel_entries")) return [{ id: "fuel-1", vehicle_id: "vehicle-1", occurred_on: "2026-08-06", odometer_km: 20100, quantity_millilitres: 25000, total_cost_minor: 260000, currency: "INR", station: null, note: null, created_at: "2026-08-06", updated_at: "2026-08-06", deleted_at: null, sync_state: "local" }] as T[];
    if (source.includes("FROM service_records")) return [{ id: "service-1", vehicle_id: "vehicle-1", category: "Oil change", next_due_on: "2026-11-05", next_due_odometer_km: 25000, occurred_on: "2026-08-05", odometer_km: 20000 }] as T[];
    return [];
  }
}

describe("Phase 6 local reporting repository", () => {
  it("uses bounded active-vehicle activity queries with service category and date parameters", async () => {
    const database = new FakeReportingDatabase();
    const records = await new LocalReportingRepository(database).listActivity({ vehicleId: "vehicle-1", startOn: "2026-08-01", endOn: "2026-08-31", types: ["service"], serviceCategory: "Oil change", limit: 500 });
    expect(records).toEqual([expect.objectContaining({ id: "service-1", type: "service", amountMinor: 250000 })]);
    expect(database.calls[0].source).toContain("service_records");
    expect(database.calls[0].source).toContain("LIMIT ?");
    expect(database.calls[0].parameters).toEqual(["vehicle-1", "2026-08-01", "2026-08-31", "Oil change", 100]);
  });

  it("maps expense categories, source projections, fuel insight, and scheduled service rows from local storage", async () => {
    const database = new FakeReportingDatabase();
    const repository = new LocalReportingRepository(database);
    await expect(repository.listServiceCategories("vehicle-1", { startOn: "2026-08-01", endOn: "2026-08-31" })).resolves.toEqual(["Oil change", "Tyres"]);
    await expect(repository.listExpenseCategoryTotals("vehicle-1", { startOn: null, endOn: null })).resolves.toEqual([{ category: "Service", currency: "INR", amountMinor: 250000, recordCount: 1 }]);
    await expect(repository.listExpenses("vehicle-1", { startOn: null, endOn: null })).resolves.toEqual([expect.objectContaining({ sourceId: "service-1", cost: { amountMinor: 250000, currency: "INR" } })]);
    await expect(repository.listFuelEntriesForInsight("vehicle-1")).resolves.toEqual([expect.objectContaining({ quantityMilliLitres: 25000 })]);
    await expect(repository.listDueServices("vehicle-1", 50)).resolves.toEqual([expect.objectContaining({ nextDueOdometerKm: 25000 })]);
    expect(database.calls.at(-1)?.parameters).toEqual(["vehicle-1", 25]);
  });

  it("surfaces a local read failure rather than replacing unavailable reporting data with a mock total", async () => {
    const database = new FakeReportingDatabase();
    database.shouldFail = true;
    await expect(new LocalReportingRepository(database).listExpenses("vehicle-1", { startOn: null, endOn: null })).rejects.toThrow("local database unavailable");
  });
});
