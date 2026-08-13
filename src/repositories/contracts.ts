import type { FuelDraft, FuelEntry, Vehicle, VehicleDraft, VehicleId } from "../domain/models";

export interface VehicleRepository {
  create(draft: VehicleDraft): Promise<Vehicle>;
  findById(id: VehicleId): Promise<Vehicle | null>;
  listActive(): Promise<Vehicle[]>;
  softDelete(id: VehicleId): Promise<void>;
}

export interface FuelRepository {
  create(draft: FuelDraft, today: string): Promise<FuelEntry>;
  listForVehicle(vehicleId: VehicleId): Promise<FuelEntry[]>;
  softDelete(id: string): Promise<void>;
}
