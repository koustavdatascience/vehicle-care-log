import { describe, expect, it } from "vitest";

import type { SqlDatabase } from "../../src/data/database-contract";
import type { RepairDraft, ServiceDraft } from "../../src/domain/models";
import { LocalRepairRepository, LocalServiceRepository } from "../../src/repositories/local-repositories";

const serviceDraft: ServiceDraft = { id: "service-1", vehicleId: "vehicle-a", category: "Oil and filter", occurredOn: "2026-08-12", odometerKm: 46000, provider: "Care Garage", cost: { amountMinor: 350000, currency: "INR" }, note: null, nextDueOn: "2027-02-12", nextDueOdometerKm: 51000 };
const repairDraft: RepairDraft = { id: "repair-1", vehicleId: "vehicle-a", issue: "Brake pad wear", workPerformed: "Replaced front pads", occurredOn: "2026-08-12", odometerKm: 46500, provider: "Care Garage", cost: { amountMinor: 420000, currency: "INR" }, note: null };

class FakeCareDatabase implements SqlDatabase {
  runCalls: Array<{ source: string; parameters: unknown[] }> = [];
  duplicateId: string | null = null;
  shouldFailWrites = false;
  transactionCount = 0;
  lastListVehicleId: string | null = null;

  async execAsync(): Promise<void> {}
  async runAsync(source: string, ...parameters: unknown[]) {
    if (this.shouldFailWrites) throw new Error("storage is full");
    this.runCalls.push({ source, parameters });
    return { lastInsertRowId: this.runCalls.length, changes: 1 };
  }
  async getFirstAsync<T>(source: string): Promise<T | null> {
    if (source.includes("current_odometer_km")) return { current_odometer_km: 45000 } as T;
    if (source.includes("FROM service_records") || source.includes("FROM repair_records")) return this.duplicateId ? ({ id: this.duplicateId } as T) : null;
    return null;
  }
  async getAllAsync<T>(source: string, ...parameters: unknown[]): Promise<T[]> {
    this.lastListVehicleId = String(parameters[0] ?? "");
    if (source.includes("service_records") && parameters[0] === "vehicle-a") return [{ id: "service-a", vehicle_id: "vehicle-a", category: "Oil and filter", occurred_on: "2026-08-12", odometer_km: 46000, provider: null, total_cost_minor: null, currency: null, note: null, next_due_on: null, next_due_odometer_km: null, created_at: "a", updated_at: "a", deleted_at: null, sync_state: "local" }] as T[];
    if (source.includes("service_records") && parameters[0] === "vehicle-b") return [{ id: "service-b", vehicle_id: "vehicle-b", category: "Tyres", occurred_on: "2026-08-11", odometer_km: 23000, provider: null, total_cost_minor: null, currency: null, note: null, next_due_on: null, next_due_odometer_km: null, created_at: "b", updated_at: "b", deleted_at: null, sync_state: "local" }] as T[];
    return [];
  }
  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> { this.transactionCount += 1; return task(); }
}

describe("Phase 5 local service and repair repositories", () => {
  it("writes service and repair records atomically with expense projections and odometer updates", async () => {
    const serviceDatabase = new FakeCareDatabase();
    await new LocalServiceRepository(serviceDatabase).create(serviceDraft, "2026-08-13");
    expect(serviceDatabase.transactionCount).toBe(1);
    expect(serviceDatabase.runCalls.map((call) => call.source)).toEqual(expect.arrayContaining([expect.stringContaining("INSERT INTO service_records"), expect.stringContaining("expense_projections"), expect.stringContaining("UPDATE vehicles")]));

    const repairDatabase = new FakeCareDatabase();
    await new LocalRepairRepository(repairDatabase).create(repairDraft, "2026-08-13");
    expect(repairDatabase.transactionCount).toBe(1);
    expect(repairDatabase.runCalls.map((call) => call.source)).toEqual(expect.arrayContaining([expect.stringContaining("INSERT INTO repair_records"), expect.stringContaining("expense_projections"), expect.stringContaining("UPDATE vehicles")]));
  });

  it("rejects duplicate records before a second write and wraps local storage failures", async () => {
    const duplicateDatabase = new FakeCareDatabase();
    duplicateDatabase.duplicateId = "service-existing";
    await expect(new LocalServiceRepository(duplicateDatabase).create(serviceDraft, "2026-08-13")).rejects.toMatchObject({ code: "write-failed" });
    expect(duplicateDatabase.runCalls).toHaveLength(0);

    const failedDatabase = new FakeCareDatabase();
    failedDatabase.shouldFailWrites = true;
    await expect(new LocalRepairRepository(failedDatabase).create(repairDraft, "2026-08-13")).rejects.toMatchObject({ code: "write-failed" });
  });

  it("keeps service lists scoped to the requested vehicle and soft deletes a repair record", async () => {
    const database = new FakeCareDatabase();
    const repository = new LocalServiceRepository(database);
    expect((await repository.listForVehicle("vehicle-a")).map((record) => record.vehicleId)).toEqual(["vehicle-a"]);
    expect((await repository.listForVehicle("vehicle-b")).map((record) => record.vehicleId)).toEqual(["vehicle-b"]);
    expect(database.lastListVehicleId).toBe("vehicle-b");

    await new LocalRepairRepository(database).softDelete("repair-1");
    expect(database.runCalls.map((call) => call.source)).toEqual(expect.arrayContaining([expect.stringContaining("UPDATE repair_records SET deleted_at"), expect.stringContaining("UPDATE expense_projections SET deleted_at") ]));
  });
});
