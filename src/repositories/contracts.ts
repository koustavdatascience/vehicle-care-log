import type { FuelDraft, FuelEntry, RepairDraft, RepairRecord, ServiceDraft, ServiceRecord, Vehicle, VehicleDraft, VehicleId } from "../domain/models";

export interface VehicleRepository {
  create(draft: VehicleDraft): Promise<Vehicle>;
  findById(id: VehicleId): Promise<Vehicle | null>;
  listActive(): Promise<Vehicle[]>;
  update(draft: VehicleDraft): Promise<Vehicle>;
  archive(id: VehicleId): Promise<void>;
  softDelete(id: VehicleId): Promise<void>;
}

export interface FuelRepository {
  create(draft: FuelDraft, today: string): Promise<FuelEntry>;
  findById(id: string): Promise<FuelEntry | null>;
  listForVehicle(vehicleId: VehicleId): Promise<FuelEntry[]>;
  update(draft: FuelDraft, today: string): Promise<FuelEntry>;
  softDelete(id: string): Promise<void>;
}

export interface ServiceRepository {
  create(draft: ServiceDraft, today: string): Promise<ServiceRecord>;
  findById(id: string): Promise<ServiceRecord | null>;
  listForVehicle(vehicleId: VehicleId): Promise<ServiceRecord[]>;
  update(draft: ServiceDraft, today: string): Promise<ServiceRecord>;
  softDelete(id: string): Promise<void>;
}

export interface RepairRepository {
  create(draft: RepairDraft, today: string): Promise<RepairRecord>;
  findById(id: string): Promise<RepairRecord | null>;
  listForVehicle(vehicleId: VehicleId): Promise<RepairRecord[]>;
  update(draft: RepairDraft, today: string): Promise<RepairRecord>;
  softDelete(id: string): Promise<void>;
}
