import { describe, expect, it } from "vitest";

import type { SqlDatabase } from "../../src/data/database-contract";
import type { VehicleDraft } from "../../src/domain/models";
import { LocalVehicleRepository } from "../../src/repositories/local-repositories";

const vehicleDraft: VehicleDraft = { id: "vehicle-phase5", nickname: "Family car", make: "Tata", model: "Nexon", year: 2024, fuelType: "petrol", registrationLabel: "MH 01 AB 1234", currentOdometerKm: 1200 };

class FakeVehicleDatabase implements SqlDatabase {
  row: Record<string, unknown> | null = null;
  shouldFailWrites = false;

  async execAsync(): Promise<void> {}
  async runAsync(source: string, ...parameters: unknown[]) {
    if (this.shouldFailWrites) throw new Error("storage unavailable");
    if (source.startsWith("INSERT INTO vehicles")) {
      this.row = { id: parameters[0], nickname: parameters[1], make: parameters[2], model: parameters[3], year: parameters[4], fuel_type: parameters[5], registration_label: parameters[6], current_odometer_km: parameters[7], created_at: parameters[8], updated_at: parameters[9], archived_at: null, deleted_at: null, sync_state: "local" };
    } else if (source.startsWith("UPDATE vehicles SET nickname") && this.row) {
      this.row = { ...this.row, nickname: parameters[0], make: parameters[1], model: parameters[2], year: parameters[3], fuel_type: parameters[4], registration_label: parameters[5], current_odometer_km: parameters[6], updated_at: parameters[7], sync_state: "pending" };
    } else if (source.startsWith("UPDATE vehicles SET archived_at") && this.row) {
      this.row = { ...this.row, archived_at: parameters[0], updated_at: parameters[1], sync_state: "pending" };
    }
    return { lastInsertRowId: 1, changes: 1 };
  }
  async getFirstAsync<T>(source: string): Promise<T | null> { return source.startsWith("SELECT * FROM vehicles") && this.row ? this.row as T : null; }
  async getAllAsync<T>(): Promise<T[]> { return this.row?.archived_at || !this.row ? [] : [this.row as T]; }
  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> { return task(); }
}

describe("Phase 5 local vehicle profiles", () => {
  it("creates the first vehicle, retains it across a new repository instance, updates it, and archives it", async () => {
    const database = new FakeVehicleDatabase();
    const firstSession = new LocalVehicleRepository(database);
    await firstSession.create(vehicleDraft);
    expect((await firstSession.listActive()).map((vehicle) => vehicle.id)).toEqual([vehicleDraft.id]);

    const reopenedSession = new LocalVehicleRepository(database);
    expect((await reopenedSession.listActive())[0]?.nickname).toBe("Family car");
    const updated = await reopenedSession.update({ ...vehicleDraft, nickname: "Nexon", currentOdometerKm: 1450 });
    expect(updated.currentOdometerKm).toBe(1450);
    await reopenedSession.archive(vehicleDraft.id);
    expect(await reopenedSession.listActive()).toEqual([]);
  });

  it("returns a recoverable write failure when vehicle storage is unavailable", async () => {
    const database = new FakeVehicleDatabase();
    database.shouldFailWrites = true;
    await expect(new LocalVehicleRepository(database).create(vehicleDraft)).rejects.toMatchObject({ code: "write-failed" });
  });
});
