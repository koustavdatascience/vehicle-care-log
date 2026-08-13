import type { CurrencyCode, ExpenseProjection, FuelEntry, VehicleId } from "../domain/models";

export type CareRecordType = "fuel" | "service" | "repair";

export interface DateRange {
  startOn: string | null;
  endOn: string | null;
}

export interface ActivityQuery extends DateRange {
  vehicleId: VehicleId;
  serviceCategory?: string | null;
  types?: readonly CareRecordType[];
  limit: number;
}

export interface ActivityFeedItem {
  id: string;
  vehicleId: VehicleId;
  type: CareRecordType;
  occurredOn: string;
  odometerKm: number;
  title: string;
  detail: string | null;
  amountMinor: number | null;
  currency: CurrencyCode | null;
  createdAt: string;
}

export interface ExpenseCategoryTotal {
  category: string;
  amountMinor: number;
  currency: CurrencyCode;
  recordCount: number;
}

export interface DueServiceItem {
  id: string;
  vehicleId: VehicleId;
  category: string;
  nextDueOn: string | null;
  nextDueOdometerKm: number | null;
  occurredOn: string;
  odometerKm: number;
}

export interface ReportingRepository {
  listActivity(query: ActivityQuery): Promise<ActivityFeedItem[]>;
  listFuelEntriesForInsight(vehicleId: VehicleId): Promise<FuelEntry[]>;
  listServiceCategories(vehicleId: VehicleId, range: DateRange): Promise<string[]>;
  listExpenses(vehicleId: VehicleId, range: DateRange): Promise<ExpenseProjection[]>;
  listExpenseCategoryTotals(vehicleId: VehicleId, range: DateRange): Promise<ExpenseCategoryTotal[]>;
  listDueServices(vehicleId: VehicleId, limit: number): Promise<DueServiceItem[]>;
}
