import type { SqlDatabase } from "../data/database-contract";
import { LocalStorageError } from "../data/database-contract";
import type { FuelDraft, FuelEntry, Vehicle, VehicleDraft, VehicleId } from "../domain/models";
import { buildDuplicateFingerprint, validateDateNotInFuture, validateOdometerProgression, validateVehicleDraft } from "../domain/services";

import type { FuelRepository, VehicleRepository } from "./contracts";

function now(): string {
  return new Date().toISOString();
}

function requireValid(result: ReturnType<typeof validateVehicleDraft> | ReturnType<typeof validateDateNotInFuture> | ReturnType<typeof validateOdometerProgression>): void {
  if (!result.ok) throw new LocalStorageError("write-failed", result.issues.map((entry) => entry.message).join(" "));
}

function rowToVehicle(row: Record<string, unknown>): Vehicle {
  return {
    id: String(row.id), nickname: String(row.nickname), make: String(row.make), model: String(row.model), year: Number(row.year),
    fuelType: row.fuel_type as Vehicle["fuelType"], registrationLabel: row.registration_label as string | null,
    currentOdometerKm: row.current_odometer_km as number | null, createdAt: String(row.created_at), updatedAt: String(row.updated_at),
    archivedAt: row.archived_at as string | null, deletedAt: row.deleted_at as string | null, syncState: row.sync_state as Vehicle["syncState"],
  };
}

function rowToFuel(row: Record<string, unknown>): FuelEntry {
  return {
    id: String(row.id), vehicleId: String(row.vehicle_id), occurredOn: String(row.occurred_on), odometerKm: Number(row.odometer_km),
    quantityMilliLitres: Number(row.quantity_millilitres), cost: { amountMinor: Number(row.total_cost_minor), currency: row.currency as "INR" },
    station: row.station as string | null, note: row.note as string | null, createdAt: String(row.created_at), updatedAt: String(row.updated_at),
    deletedAt: row.deleted_at as string | null, syncState: row.sync_state as FuelEntry["syncState"],
  };
}

export class LocalVehicleRepository implements VehicleRepository {
  constructor(private readonly database: SqlDatabase) {}

  async create(draft: VehicleDraft): Promise<Vehicle> {
    requireValid(validateVehicleDraft(draft));
    const timestamp = now();
    try {
      await this.database.runAsync(
        `INSERT INTO vehicles (id, nickname, make, model, year, fuel_type, registration_label, current_odometer_km, created_at, updated_at, sync_state)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'local')`,
        draft.id, draft.nickname.trim(), draft.make.trim(), draft.model.trim(), draft.year, draft.fuelType, draft.registrationLabel,
        draft.currentOdometerKm, timestamp, timestamp,
      );
      return { ...draft, nickname: draft.nickname.trim(), make: draft.make.trim(), model: draft.model.trim(), createdAt: timestamp, updatedAt: timestamp, archivedAt: null, deletedAt: null, syncState: "local" };
    } catch (error) {
      if (error instanceof LocalStorageError) throw error;
      throw new LocalStorageError("write-failed", "Vehicle could not be saved. Please try again.", error);
    }
  }

  async findById(id: VehicleId): Promise<Vehicle | null> {
    const row = await this.database.getFirstAsync<Record<string, unknown>>("SELECT * FROM vehicles WHERE id = ? AND deleted_at IS NULL", id);
    return row ? rowToVehicle(row) : null;
  }

  async listActive(): Promise<Vehicle[]> {
    const rows = await this.database.getAllAsync<Record<string, unknown>>("SELECT * FROM vehicles WHERE deleted_at IS NULL AND archived_at IS NULL ORDER BY created_at ASC");
    return rows.map(rowToVehicle);
  }

  async softDelete(id: VehicleId): Promise<void> {
    const timestamp = now();
    await this.database.withTransactionAsync(async () => {
      await this.database.runAsync("UPDATE vehicles SET deleted_at = ?, updated_at = ?, sync_state = 'pending' WHERE id = ? AND deleted_at IS NULL", timestamp, timestamp, id);
      await this.database.runAsync("INSERT OR REPLACE INTO sync_metadata (entity_type, entity_id, operation, updated_at) VALUES ('vehicle', ?, 'delete', ?)", id, timestamp);
    });
  }
}

export class LocalFuelRepository implements FuelRepository {
  constructor(private readonly database: SqlDatabase) {}

  async create(draft: FuelDraft, today: string): Promise<FuelEntry> {
    requireValid(validateDateNotInFuture(draft.occurredOn, today));
    requireValid(validateOdometerProgression(null, draft.odometerKm));
    if (!Number.isInteger(draft.quantityMilliLitres) || draft.quantityMilliLitres <= 0 || draft.cost.amountMinor < 0) {
      throw new LocalStorageError("write-failed", "Fuel quantity must be greater than zero and cost cannot be negative.");
    }
    const fingerprint = buildDuplicateFingerprint([draft.vehicleId, draft.occurredOn, draft.odometerKm, draft.quantityMilliLitres, draft.cost.amountMinor, draft.station]);
    const timestamp = now();
    try {
      await this.database.withTransactionAsync(async () => {
        const vehicle = await this.database.getFirstAsync<{ current_odometer_km: number | null }>("SELECT current_odometer_km FROM vehicles WHERE id = ? AND deleted_at IS NULL", draft.vehicleId);
        if (!vehicle) throw new LocalStorageError("write-failed", "Choose an active vehicle before saving fuel.");
        requireValid(validateOdometerProgression(vehicle.current_odometer_km, draft.odometerKm));
        const duplicate = await this.database.getFirstAsync<{ id: string }>("SELECT id FROM fuel_entries WHERE duplicate_fingerprint = ? AND deleted_at IS NULL", fingerprint);
        if (duplicate) throw new LocalStorageError("write-failed", "This fuel entry appears to be a duplicate.");
        await this.database.runAsync(
          `INSERT INTO fuel_entries (id, vehicle_id, occurred_on, odometer_km, quantity_millilitres, total_cost_minor, currency, station, note, duplicate_fingerprint, created_at, updated_at, sync_state)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'local')`,
          draft.id, draft.vehicleId, draft.occurredOn, draft.odometerKm, draft.quantityMilliLitres, draft.cost.amountMinor, draft.cost.currency,
          draft.station, draft.note, fingerprint, timestamp, timestamp,
        );
        await this.database.runAsync(
          "INSERT INTO expense_projections (id, vehicle_id, source_type, source_id, occurred_on, category, total_cost_minor, currency) VALUES (?, ?, 'fuel', ?, ?, 'Fuel', ?, ?)",
          `expense:${draft.id}`, draft.vehicleId, draft.id, draft.occurredOn, draft.cost.amountMinor, draft.cost.currency,
        );
        await this.database.runAsync("UPDATE vehicles SET current_odometer_km = ?, updated_at = ? WHERE id = ?", draft.odometerKm, timestamp, draft.vehicleId);
      });
      return { ...draft, createdAt: timestamp, updatedAt: timestamp, deletedAt: null, syncState: "local" };
    } catch (error) {
      if (error instanceof LocalStorageError) throw error;
      throw new LocalStorageError("write-failed", "Fuel entry could not be saved. Please retry.", error);
    }
  }

  async listForVehicle(vehicleId: VehicleId): Promise<FuelEntry[]> {
    const rows = await this.database.getAllAsync<Record<string, unknown>>("SELECT * FROM fuel_entries WHERE vehicle_id = ? AND deleted_at IS NULL ORDER BY occurred_on DESC, created_at DESC", vehicleId);
    return rows.map(rowToFuel);
  }

  async softDelete(id: string): Promise<void> {
    const timestamp = now();
    await this.database.withTransactionAsync(async () => {
      await this.database.runAsync("UPDATE fuel_entries SET deleted_at = ?, updated_at = ?, sync_state = 'pending' WHERE id = ? AND deleted_at IS NULL", timestamp, timestamp, id);
      await this.database.runAsync("UPDATE expense_projections SET deleted_at = ? WHERE source_type = 'fuel' AND source_id = ?", timestamp, id);
      await this.database.runAsync("INSERT OR REPLACE INTO sync_metadata (entity_type, entity_id, operation, updated_at) VALUES ('fuel', ?, 'delete', ?)", id, timestamp);
    });
  }
}
