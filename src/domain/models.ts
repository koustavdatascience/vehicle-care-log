export type RecordId = string;
export type VehicleId = RecordId;
export type CurrencyCode = "INR";
export type DistanceUnit = "km";
export type FuelUnit = "litre";
export type SyncState = "local" | "pending" | "synced" | "failed";

export interface Money {
  amountMinor: number;
  currency: CurrencyCode;
}

export interface Vehicle {
  id: VehicleId;
  nickname: string;
  make: string;
  model: string;
  year: number;
  fuelType: "petrol" | "diesel" | "electric" | "hybrid" | "other";
  registrationLabel: string | null;
  currentOdometerKm: number | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
  syncState: SyncState;
}

export interface FuelEntry {
  id: RecordId;
  vehicleId: VehicleId;
  occurredOn: string;
  odometerKm: number;
  quantityMilliLitres: number;
  cost: Money;
  station: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncState: SyncState;
}

export interface ServiceRecord {
  id: RecordId;
  vehicleId: VehicleId;
  category: string;
  occurredOn: string;
  odometerKm: number;
  provider: string | null;
  cost: Money | null;
  note: string | null;
  nextDueOn: string | null;
  nextDueOdometerKm: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncState: SyncState;
}

export interface RepairRecord {
  id: RecordId;
  vehicleId: VehicleId;
  issue: string;
  workPerformed: string | null;
  occurredOn: string;
  odometerKm: number;
  provider: string | null;
  cost: Money | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncState: SyncState;
}

export interface Reminder {
  id: RecordId;
  vehicleId: VehicleId;
  title: string;
  dueOn: string | null;
  dueOdometerKm: number | null;
  completedAt: string | null;
  snoozedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncState: SyncState;
}

export interface Attachment {
  id: RecordId;
  recordType: "fuel" | "service" | "repair";
  recordId: RecordId;
  localUri: string;
  mimeType: string;
  createdAt: string;
  deletedAt: string | null;
  syncState: SyncState;
}

export interface ExpenseProjection {
  id: RecordId;
  vehicleId: VehicleId;
  sourceType: "fuel" | "service" | "repair";
  sourceId: RecordId;
  occurredOn: string;
  category: string;
  cost: Money;
  deletedAt: string | null;
}

export type VehicleDraft = Omit<Vehicle, "createdAt" | "updatedAt" | "archivedAt" | "deletedAt" | "syncState">;
export type FuelDraft = Omit<FuelEntry, "createdAt" | "updatedAt" | "deletedAt" | "syncState">;
export type ServiceDraft = Omit<ServiceRecord, "createdAt" | "updatedAt" | "deletedAt" | "syncState">;
export type RepairDraft = Omit<RepairRecord, "createdAt" | "updatedAt" | "deletedAt" | "syncState">;
