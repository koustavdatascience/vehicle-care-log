import type { FuelDraft, VehicleDraft } from "../domain/models";

export const seedVehicle: VehicleDraft = {
  id: "vehicle-honda-city",
  nickname: "Honda City",
  make: "Honda",
  model: "City",
  year: 2020,
  fuelType: "petrol",
  registrationLabel: "KA 01 AB 1234",
  currentOdometerKm: 46420,
};

export const seedFuelEntry: FuelDraft = {
  id: "fuel-2025-06-01",
  vehicleId: seedVehicle.id,
  occurredOn: "2025-06-01",
  odometerKm: 46420,
  quantityMilliLitres: 42000,
  cost: { amountMinor: 420000, currency: "INR" },
  station: "City Fuel",
  note: null,
};
