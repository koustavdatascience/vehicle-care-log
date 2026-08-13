import type { SqlDatabase } from "../data/database-contract";
import { LocalStorageError } from "../data/database-contract";
import type { FuelDraft, FuelEntry, RepairDraft, RepairRecord, ServiceDraft, ServiceRecord, Vehicle, VehicleDraft, VehicleId } from "../domain/models";
import { validateDateNotInFuture, validateOdometerProgression, validateRepairDraft, validateServiceDraft, validateVehicleDraft, type ValidationResult } from "../domain/services";

import type { FuelRepository, RepairRepository, ServiceRepository, VehicleRepository } from "./contracts";

function now(): string {
  return new Date().toISOString();
}

function requireValid(result: ValidationResult): void {
  if (!result.ok) throw new LocalStorageError("write-failed", result.issues.map((entry) => entry.message).join(" "));
}

function nullableText(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
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

function rowToService(row: Record<string, unknown>): ServiceRecord {
  const amountMinor = row.total_cost_minor as number | null;
  return {
    id: String(row.id), vehicleId: String(row.vehicle_id), category: String(row.category), occurredOn: String(row.occurred_on), odometerKm: Number(row.odometer_km),
    provider: row.provider as string | null, cost: amountMinor === null ? null : { amountMinor: Number(amountMinor), currency: row.currency as "INR" },
    note: row.note as string | null, nextDueOn: row.next_due_on as string | null, nextDueOdometerKm: row.next_due_odometer_km as number | null,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at), deletedAt: row.deleted_at as string | null, syncState: row.sync_state as ServiceRecord["syncState"],
  };
}

function rowToRepair(row: Record<string, unknown>): RepairRecord {
  const amountMinor = row.total_cost_minor as number | null;
  return {
    id: String(row.id), vehicleId: String(row.vehicle_id), issue: String(row.issue), workPerformed: row.work_performed as string | null,
    occurredOn: String(row.occurred_on), odometerKm: Number(row.odometer_km), provider: row.provider as string | null,
    cost: amountMinor === null ? null : { amountMinor: Number(amountMinor), currency: row.currency as "INR" }, note: row.note as string | null,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at), deletedAt: row.deleted_at as string | null, syncState: row.sync_state as RepairRecord["syncState"],
  };
}

async function requireActiveVehicle(database: SqlDatabase, vehicleId: VehicleId): Promise<{ current_odometer_km: number | null }> {
  const vehicle = await database.getFirstAsync<{ current_odometer_km: number | null }>("SELECT current_odometer_km FROM vehicles WHERE id = ? AND deleted_at IS NULL AND archived_at IS NULL", vehicleId);
  if (!vehicle) throw new LocalStorageError("write-failed", "Choose an active vehicle before saving a record.");
  return vehicle;
}

async function updateVehicleOdometer(database: SqlDatabase, vehicleId: VehicleId, odometerKm: number, timestamp: string): Promise<void> {
  await database.runAsync(
    "UPDATE vehicles SET current_odometer_km = CASE WHEN current_odometer_km IS NULL OR current_odometer_km < ? THEN ? ELSE current_odometer_km END, updated_at = ? WHERE id = ?",
    odometerKm,
    odometerKm,
    timestamp,
    vehicleId,
  );
}

async function replaceExpenseProjection(
  database: SqlDatabase,
  sourceType: "fuel" | "service" | "repair",
  sourceId: string,
  vehicleId: VehicleId,
  occurredOn: string,
  category: string,
  cost: { amountMinor: number; currency: "INR" } | null,
): Promise<void> {
  await database.runAsync("DELETE FROM expense_projections WHERE source_type = ? AND source_id = ?", sourceType, sourceId);
  if (cost !== null) {
    await database.runAsync(
      "INSERT INTO expense_projections (id, vehicle_id, source_type, source_id, occurred_on, category, total_cost_minor, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      `expense:${sourceId}`,
      vehicleId,
      sourceType,
      sourceId,
      occurredOn,
      category,
      cost.amountMinor,
      cost.currency,
    );
  }
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
        draft.id, draft.nickname.trim(), draft.make.trim(), draft.model.trim(), draft.year, draft.fuelType, nullableText(draft.registrationLabel), draft.currentOdometerKm, timestamp, timestamp,
      );
      return { ...draft, nickname: draft.nickname.trim(), make: draft.make.trim(), model: draft.model.trim(), registrationLabel: nullableText(draft.registrationLabel), createdAt: timestamp, updatedAt: timestamp, archivedAt: null, deletedAt: null, syncState: "local" };
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

  async update(draft: VehicleDraft): Promise<Vehicle> {
    requireValid(validateVehicleDraft(draft));
    const timestamp = now();
    try {
      await this.database.runAsync(
        "UPDATE vehicles SET nickname = ?, make = ?, model = ?, year = ?, fuel_type = ?, registration_label = ?, current_odometer_km = ?, updated_at = ?, sync_state = 'pending' WHERE id = ? AND deleted_at IS NULL",
        draft.nickname.trim(), draft.make.trim(), draft.model.trim(), draft.year, draft.fuelType, nullableText(draft.registrationLabel), draft.currentOdometerKm, timestamp, draft.id,
      );
      await this.database.runAsync("INSERT OR REPLACE INTO sync_metadata (entity_type, entity_id, operation, updated_at) VALUES ('vehicle', ?, 'update', ?)", draft.id, timestamp);
      const saved = await this.findById(draft.id);
      if (!saved) throw new LocalStorageError("write-failed", "Vehicle could not be updated.");
      return saved;
    } catch (error) {
      if (error instanceof LocalStorageError) throw error;
      throw new LocalStorageError("write-failed", "Vehicle could not be updated. Please try again.", error);
    }
  }

  async archive(id: VehicleId): Promise<void> {
    const timestamp = now();
    try {
      await this.database.withTransactionAsync(async () => {
        await this.database.runAsync("UPDATE vehicles SET archived_at = ?, updated_at = ?, sync_state = 'pending' WHERE id = ? AND deleted_at IS NULL", timestamp, timestamp, id);
        await this.database.runAsync("INSERT OR REPLACE INTO sync_metadata (entity_type, entity_id, operation, updated_at) VALUES ('vehicle', ?, 'archive', ?)", id, timestamp);
      });
    } catch (error) {
      if (error instanceof LocalStorageError) throw error;
      throw new LocalStorageError("write-failed", "Vehicle could not be archived. Please try again.", error);
    }
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
    if (!Number.isInteger(draft.quantityMilliLitres) || draft.quantityMilliLitres <= 0 || !Number.isInteger(draft.cost.amountMinor) || draft.cost.amountMinor < 0) {
      throw new LocalStorageError("write-failed", "Fuel quantity must be greater than zero and cost cannot be negative.");
    }
    const timestamp = now();
    try {
      await this.database.withTransactionAsync(async () => {
        const vehicle = await requireActiveVehicle(this.database, draft.vehicleId);
        requireValid(validateOdometerProgression(vehicle.current_odometer_km, draft.odometerKm));
        const duplicate = await this.database.getFirstAsync<{ id: string }>(
          "SELECT id FROM fuel_entries WHERE vehicle_id = ? AND occurred_on = ? AND odometer_km = ? AND quantity_millilitres = ? AND total_cost_minor = ? AND COALESCE(station, '') = COALESCE(?, '') AND deleted_at IS NULL AND id != ?",
          draft.vehicleId, draft.occurredOn, draft.odometerKm, draft.quantityMilliLitres, draft.cost.amountMinor, nullableText(draft.station), draft.id,
        );
        if (duplicate) throw new LocalStorageError("write-failed", "This fuel entry appears to be a duplicate.");
        await this.database.runAsync(
          `INSERT INTO fuel_entries (id, vehicle_id, occurred_on, odometer_km, quantity_millilitres, total_cost_minor, currency, station, note, duplicate_fingerprint, created_at, updated_at, sync_state)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'local')`,
          draft.id, draft.vehicleId, draft.occurredOn, draft.odometerKm, draft.quantityMilliLitres, draft.cost.amountMinor, draft.cost.currency, nullableText(draft.station), nullableText(draft.note), `${draft.vehicleId}|${draft.occurredOn}|${draft.odometerKm}|${draft.quantityMilliLitres}|${draft.cost.amountMinor}|${nullableText(draft.station) ?? ""}`.toLowerCase(), timestamp, timestamp,
        );
        await replaceExpenseProjection(this.database, "fuel", draft.id, draft.vehicleId, draft.occurredOn, "Fuel", draft.cost);
        await updateVehicleOdometer(this.database, draft.vehicleId, draft.odometerKm, timestamp);
      });
      return { ...draft, station: nullableText(draft.station), note: nullableText(draft.note), createdAt: timestamp, updatedAt: timestamp, deletedAt: null, syncState: "local" };
    } catch (error) {
      if (error instanceof LocalStorageError) throw error;
      throw new LocalStorageError("write-failed", "Fuel entry could not be saved. Please retry.", error);
    }
  }

  async findById(id: string): Promise<FuelEntry | null> {
    const row = await this.database.getFirstAsync<Record<string, unknown>>("SELECT * FROM fuel_entries WHERE id = ? AND deleted_at IS NULL", id);
    return row ? rowToFuel(row) : null;
  }

  async listForVehicle(vehicleId: VehicleId): Promise<FuelEntry[]> {
    const rows = await this.database.getAllAsync<Record<string, unknown>>("SELECT * FROM fuel_entries WHERE vehicle_id = ? AND deleted_at IS NULL ORDER BY occurred_on DESC, created_at DESC", vehicleId);
    return rows.map(rowToFuel);
  }

  async update(draft: FuelDraft, today: string): Promise<FuelEntry> {
    requireValid(validateDateNotInFuture(draft.occurredOn, today));
    requireValid(validateOdometerProgression(null, draft.odometerKm));
    if (!Number.isInteger(draft.quantityMilliLitres) || draft.quantityMilliLitres <= 0 || !Number.isInteger(draft.cost.amountMinor) || draft.cost.amountMinor < 0) {
      throw new LocalStorageError("write-failed", "Fuel quantity must be greater than zero and cost cannot be negative.");
    }
    const timestamp = now();
    try {
      await this.database.withTransactionAsync(async () => {
        const vehicle = await requireActiveVehicle(this.database, draft.vehicleId);
        requireValid(validateOdometerProgression(vehicle.current_odometer_km, draft.odometerKm));
        const duplicate = await this.database.getFirstAsync<{ id: string }>(
          "SELECT id FROM fuel_entries WHERE vehicle_id = ? AND occurred_on = ? AND odometer_km = ? AND quantity_millilitres = ? AND total_cost_minor = ? AND COALESCE(station, '') = COALESCE(?, '') AND deleted_at IS NULL AND id != ?",
          draft.vehicleId, draft.occurredOn, draft.odometerKm, draft.quantityMilliLitres, draft.cost.amountMinor, nullableText(draft.station), draft.id,
        );
        if (duplicate) throw new LocalStorageError("write-failed", "This fuel entry appears to be a duplicate.");
        await this.database.runAsync(
          "UPDATE fuel_entries SET occurred_on = ?, odometer_km = ?, quantity_millilitres = ?, total_cost_minor = ?, currency = ?, station = ?, note = ?, duplicate_fingerprint = ?, updated_at = ?, sync_state = 'pending' WHERE id = ? AND vehicle_id = ? AND deleted_at IS NULL",
          draft.occurredOn, draft.odometerKm, draft.quantityMilliLitres, draft.cost.amountMinor, draft.cost.currency, nullableText(draft.station), nullableText(draft.note), `${draft.vehicleId}|${draft.occurredOn}|${draft.odometerKm}|${draft.quantityMilliLitres}|${draft.cost.amountMinor}|${nullableText(draft.station) ?? ""}`.toLowerCase(), timestamp, draft.id, draft.vehicleId,
        );
        await replaceExpenseProjection(this.database, "fuel", draft.id, draft.vehicleId, draft.occurredOn, "Fuel", draft.cost);
        await updateVehicleOdometer(this.database, draft.vehicleId, draft.odometerKm, timestamp);
      });
      const saved = await this.findById(draft.id);
      if (!saved) throw new LocalStorageError("write-failed", "Fuel entry could not be updated.");
      return saved;
    } catch (error) {
      if (error instanceof LocalStorageError) throw error;
      throw new LocalStorageError("write-failed", "Fuel entry could not be updated. Please retry.", error);
    }
  }

  async softDelete(id: string): Promise<void> {
    const timestamp = now();
    try {
      await this.database.withTransactionAsync(async () => {
        await this.database.runAsync("UPDATE fuel_entries SET deleted_at = ?, updated_at = ?, sync_state = 'pending' WHERE id = ? AND deleted_at IS NULL", timestamp, timestamp, id);
        await this.database.runAsync("UPDATE expense_projections SET deleted_at = ? WHERE source_type = 'fuel' AND source_id = ?", timestamp, id);
        await this.database.runAsync("INSERT OR REPLACE INTO sync_metadata (entity_type, entity_id, operation, updated_at) VALUES ('fuel', ?, 'delete', ?)", id, timestamp);
      });
    } catch (error) {
      throw new LocalStorageError("write-failed", "Fuel entry could not be deleted. Please retry.", error);
    }
  }
}

export class LocalServiceRepository implements ServiceRepository {
  constructor(private readonly database: SqlDatabase) {}

  async create(draft: ServiceDraft, today: string): Promise<ServiceRecord> {
    requireValid(validateServiceDraft(draft, today));
    const timestamp = now();
    try {
      await this.database.withTransactionAsync(async () => {
        const vehicle = await requireActiveVehicle(this.database, draft.vehicleId);
        requireValid(validateServiceDraft(draft, today, vehicle.current_odometer_km));
        const duplicate = await this.database.getFirstAsync<{ id: string }>(
          "SELECT id FROM service_records WHERE vehicle_id = ? AND occurred_on = ? AND odometer_km = ? AND category = ? AND COALESCE(provider, '') = COALESCE(?, '') AND COALESCE(total_cost_minor, -1) = COALESCE(?, -1) AND deleted_at IS NULL AND id != ?",
          draft.vehicleId, draft.occurredOn, draft.odometerKm, draft.category.trim(), nullableText(draft.provider), draft.cost?.amountMinor ?? null, draft.id,
        );
        if (duplicate) throw new LocalStorageError("write-failed", "This service record appears to be a duplicate.");
        await this.database.runAsync(
          "INSERT INTO service_records (id, vehicle_id, category, occurred_on, odometer_km, provider, total_cost_minor, currency, note, next_due_on, next_due_odometer_km, created_at, updated_at, sync_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'local')",
          draft.id, draft.vehicleId, draft.category.trim(), draft.occurredOn, draft.odometerKm, nullableText(draft.provider), draft.cost?.amountMinor ?? null, draft.cost?.currency ?? null, nullableText(draft.note), draft.nextDueOn, draft.nextDueOdometerKm, timestamp, timestamp,
        );
        await replaceExpenseProjection(this.database, "service", draft.id, draft.vehicleId, draft.occurredOn, draft.category.trim(), draft.cost);
        await updateVehicleOdometer(this.database, draft.vehicleId, draft.odometerKm, timestamp);
      });
      return { ...draft, category: draft.category.trim(), provider: nullableText(draft.provider), note: nullableText(draft.note), createdAt: timestamp, updatedAt: timestamp, deletedAt: null, syncState: "local" };
    } catch (error) {
      if (error instanceof LocalStorageError) throw error;
      throw new LocalStorageError("write-failed", "Service record could not be saved. Please retry.", error);
    }
  }

  async findById(id: string): Promise<ServiceRecord | null> {
    const row = await this.database.getFirstAsync<Record<string, unknown>>("SELECT * FROM service_records WHERE id = ? AND deleted_at IS NULL", id);
    return row ? rowToService(row) : null;
  }

  async listForVehicle(vehicleId: VehicleId): Promise<ServiceRecord[]> {
    const rows = await this.database.getAllAsync<Record<string, unknown>>("SELECT * FROM service_records WHERE vehicle_id = ? AND deleted_at IS NULL ORDER BY occurred_on DESC, created_at DESC", vehicleId);
    return rows.map(rowToService);
  }

  async update(draft: ServiceDraft, today: string): Promise<ServiceRecord> {
    requireValid(validateServiceDraft(draft, today));
    const timestamp = now();
    try {
      await this.database.withTransactionAsync(async () => {
        const vehicle = await requireActiveVehicle(this.database, draft.vehicleId);
        requireValid(validateServiceDraft(draft, today, vehicle.current_odometer_km));
        const duplicate = await this.database.getFirstAsync<{ id: string }>(
          "SELECT id FROM service_records WHERE vehicle_id = ? AND occurred_on = ? AND odometer_km = ? AND category = ? AND COALESCE(provider, '') = COALESCE(?, '') AND COALESCE(total_cost_minor, -1) = COALESCE(?, -1) AND deleted_at IS NULL AND id != ?",
          draft.vehicleId, draft.occurredOn, draft.odometerKm, draft.category.trim(), nullableText(draft.provider), draft.cost?.amountMinor ?? null, draft.id,
        );
        if (duplicate) throw new LocalStorageError("write-failed", "This service record appears to be a duplicate.");
        await this.database.runAsync(
          "UPDATE service_records SET category = ?, occurred_on = ?, odometer_km = ?, provider = ?, total_cost_minor = ?, currency = ?, note = ?, next_due_on = ?, next_due_odometer_km = ?, updated_at = ?, sync_state = 'pending' WHERE id = ? AND vehicle_id = ? AND deleted_at IS NULL",
          draft.category.trim(), draft.occurredOn, draft.odometerKm, nullableText(draft.provider), draft.cost?.amountMinor ?? null, draft.cost?.currency ?? null, nullableText(draft.note), draft.nextDueOn, draft.nextDueOdometerKm, timestamp, draft.id, draft.vehicleId,
        );
        await replaceExpenseProjection(this.database, "service", draft.id, draft.vehicleId, draft.occurredOn, draft.category.trim(), draft.cost);
        await updateVehicleOdometer(this.database, draft.vehicleId, draft.odometerKm, timestamp);
      });
      const saved = await this.findById(draft.id);
      if (!saved) throw new LocalStorageError("write-failed", "Service record could not be updated.");
      return saved;
    } catch (error) {
      if (error instanceof LocalStorageError) throw error;
      throw new LocalStorageError("write-failed", "Service record could not be updated. Please retry.", error);
    }
  }

  async softDelete(id: string): Promise<void> {
    const timestamp = now();
    try {
      await this.database.withTransactionAsync(async () => {
        await this.database.runAsync("UPDATE service_records SET deleted_at = ?, updated_at = ?, sync_state = 'pending' WHERE id = ? AND deleted_at IS NULL", timestamp, timestamp, id);
        await this.database.runAsync("UPDATE expense_projections SET deleted_at = ? WHERE source_type = 'service' AND source_id = ?", timestamp, id);
        await this.database.runAsync("INSERT OR REPLACE INTO sync_metadata (entity_type, entity_id, operation, updated_at) VALUES ('service', ?, 'delete', ?)", id, timestamp);
      });
    } catch (error) {
      throw new LocalStorageError("write-failed", "Service record could not be deleted. Please retry.", error);
    }
  }
}

export class LocalRepairRepository implements RepairRepository {
  constructor(private readonly database: SqlDatabase) {}

  async create(draft: RepairDraft, today: string): Promise<RepairRecord> {
    requireValid(validateRepairDraft(draft, today));
    const timestamp = now();
    try {
      await this.database.withTransactionAsync(async () => {
        const vehicle = await requireActiveVehicle(this.database, draft.vehicleId);
        requireValid(validateRepairDraft(draft, today, vehicle.current_odometer_km));
        const duplicate = await this.database.getFirstAsync<{ id: string }>(
          "SELECT id FROM repair_records WHERE vehicle_id = ? AND occurred_on = ? AND odometer_km = ? AND issue = ? AND COALESCE(provider, '') = COALESCE(?, '') AND COALESCE(total_cost_minor, -1) = COALESCE(?, -1) AND deleted_at IS NULL AND id != ?",
          draft.vehicleId, draft.occurredOn, draft.odometerKm, draft.issue.trim(), nullableText(draft.provider), draft.cost?.amountMinor ?? null, draft.id,
        );
        if (duplicate) throw new LocalStorageError("write-failed", "This repair record appears to be a duplicate.");
        await this.database.runAsync(
          "INSERT INTO repair_records (id, vehicle_id, issue, work_performed, occurred_on, odometer_km, provider, total_cost_minor, currency, note, created_at, updated_at, sync_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'local')",
          draft.id, draft.vehicleId, draft.issue.trim(), nullableText(draft.workPerformed), draft.occurredOn, draft.odometerKm, nullableText(draft.provider), draft.cost?.amountMinor ?? null, draft.cost?.currency ?? null, nullableText(draft.note), timestamp, timestamp,
        );
        await replaceExpenseProjection(this.database, "repair", draft.id, draft.vehicleId, draft.occurredOn, "Repair", draft.cost);
        await updateVehicleOdometer(this.database, draft.vehicleId, draft.odometerKm, timestamp);
      });
      return { ...draft, issue: draft.issue.trim(), workPerformed: nullableText(draft.workPerformed), provider: nullableText(draft.provider), note: nullableText(draft.note), createdAt: timestamp, updatedAt: timestamp, deletedAt: null, syncState: "local" };
    } catch (error) {
      if (error instanceof LocalStorageError) throw error;
      throw new LocalStorageError("write-failed", "Repair record could not be saved. Please retry.", error);
    }
  }

  async findById(id: string): Promise<RepairRecord | null> {
    const row = await this.database.getFirstAsync<Record<string, unknown>>("SELECT * FROM repair_records WHERE id = ? AND deleted_at IS NULL", id);
    return row ? rowToRepair(row) : null;
  }

  async listForVehicle(vehicleId: VehicleId): Promise<RepairRecord[]> {
    const rows = await this.database.getAllAsync<Record<string, unknown>>("SELECT * FROM repair_records WHERE vehicle_id = ? AND deleted_at IS NULL ORDER BY occurred_on DESC, created_at DESC", vehicleId);
    return rows.map(rowToRepair);
  }

  async update(draft: RepairDraft, today: string): Promise<RepairRecord> {
    requireValid(validateRepairDraft(draft, today));
    const timestamp = now();
    try {
      await this.database.withTransactionAsync(async () => {
        const vehicle = await requireActiveVehicle(this.database, draft.vehicleId);
        requireValid(validateRepairDraft(draft, today, vehicle.current_odometer_km));
        const duplicate = await this.database.getFirstAsync<{ id: string }>(
          "SELECT id FROM repair_records WHERE vehicle_id = ? AND occurred_on = ? AND odometer_km = ? AND issue = ? AND COALESCE(provider, '') = COALESCE(?, '') AND COALESCE(total_cost_minor, -1) = COALESCE(?, -1) AND deleted_at IS NULL AND id != ?",
          draft.vehicleId, draft.occurredOn, draft.odometerKm, draft.issue.trim(), nullableText(draft.provider), draft.cost?.amountMinor ?? null, draft.id,
        );
        if (duplicate) throw new LocalStorageError("write-failed", "This repair record appears to be a duplicate.");
        await this.database.runAsync(
          "UPDATE repair_records SET issue = ?, work_performed = ?, occurred_on = ?, odometer_km = ?, provider = ?, total_cost_minor = ?, currency = ?, note = ?, updated_at = ?, sync_state = 'pending' WHERE id = ? AND vehicle_id = ? AND deleted_at IS NULL",
          draft.issue.trim(), nullableText(draft.workPerformed), draft.occurredOn, draft.odometerKm, nullableText(draft.provider), draft.cost?.amountMinor ?? null, draft.cost?.currency ?? null, nullableText(draft.note), timestamp, draft.id, draft.vehicleId,
        );
        await replaceExpenseProjection(this.database, "repair", draft.id, draft.vehicleId, draft.occurredOn, "Repair", draft.cost);
        await updateVehicleOdometer(this.database, draft.vehicleId, draft.odometerKm, timestamp);
      });
      const saved = await this.findById(draft.id);
      if (!saved) throw new LocalStorageError("write-failed", "Repair record could not be updated.");
      return saved;
    } catch (error) {
      if (error instanceof LocalStorageError) throw error;
      throw new LocalStorageError("write-failed", "Repair record could not be updated. Please retry.", error);
    }
  }

  async softDelete(id: string): Promise<void> {
    const timestamp = now();
    try {
      await this.database.withTransactionAsync(async () => {
        await this.database.runAsync("UPDATE repair_records SET deleted_at = ?, updated_at = ?, sync_state = 'pending' WHERE id = ? AND deleted_at IS NULL", timestamp, timestamp, id);
        await this.database.runAsync("UPDATE expense_projections SET deleted_at = ? WHERE source_type = 'repair' AND source_id = ?", timestamp, id);
        await this.database.runAsync("INSERT OR REPLACE INTO sync_metadata (entity_type, entity_id, operation, updated_at) VALUES ('repair', ?, 'delete', ?)", id, timestamp);
      });
    } catch (error) {
      throw new LocalStorageError("write-failed", "Repair record could not be deleted. Please retry.", error);
    }
  }
}
