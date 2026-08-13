import type { SqlDatabase } from "../data/database-contract";
import type { ExpenseProjection, FuelEntry, VehicleId } from "../domain/models";
import type {
  ActivityFeedItem,
  ActivityQuery,
  CareRecordType,
  DateRange,
  DueServiceItem,
  ExpenseCategoryTotal,
  ReportingRepository,
} from "./contracts";

function withDateRange(base: string, range: DateRange, parameters: unknown[]): string {
  let clause = base;
  if (range.startOn) {
    clause += " AND occurred_on >= ?";
    parameters.push(range.startOn);
  }
  if (range.endOn) {
    clause += " AND occurred_on <= ?";
    parameters.push(range.endOn);
  }
  return clause;
}

function rowToExpense(row: Record<string, unknown>): ExpenseProjection {
  return {
    id: String(row.id),
    vehicleId: String(row.vehicle_id),
    sourceType: row.source_type as ExpenseProjection["sourceType"],
    sourceId: String(row.source_id),
    occurredOn: String(row.occurred_on),
    category: String(row.category),
    cost: { amountMinor: Number(row.total_cost_minor), currency: row.currency as "INR" },
    deletedAt: row.deleted_at as string | null,
  };
}

function rowToActivity(row: Record<string, unknown>): ActivityFeedItem {
  const amountMinor = row.amount_minor as number | null;
  return {
    id: String(row.id),
    vehicleId: String(row.vehicle_id),
    type: row.type as CareRecordType,
    occurredOn: String(row.occurred_on),
    odometerKm: Number(row.odometer_km),
    title: String(row.title),
    detail: row.detail as string | null,
    amountMinor: amountMinor === null ? null : Number(amountMinor),
    currency: row.currency === null ? null : (row.currency as "INR"),
    createdAt: String(row.created_at),
  };
}

function rowToFuel(row: Record<string, unknown>): FuelEntry {
  return {
    id: String(row.id),
    vehicleId: String(row.vehicle_id),
    occurredOn: String(row.occurred_on),
    odometerKm: Number(row.odometer_km),
    quantityMilliLitres: Number(row.quantity_millilitres),
    cost: { amountMinor: Number(row.total_cost_minor), currency: row.currency as "INR" },
    station: row.station as string | null,
    note: row.note as string | null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    deletedAt: row.deleted_at as string | null,
    syncState: row.sync_state as FuelEntry["syncState"],
  };
}

export class LocalReportingRepository implements ReportingRepository {
  constructor(private readonly database: SqlDatabase) {}

  async listActivity(query: ActivityQuery): Promise<ActivityFeedItem[]> {
    const types = query.types?.length ? query.types : (["fuel", "service", "repair"] as const);
    const selects: string[] = [];
    const parameters: unknown[] = [];
    for (const type of types) {
      const typeParameters: unknown[] = [query.vehicleId];
      const range = withDateRange("vehicle_id = ? AND deleted_at IS NULL", query, typeParameters);
      if (type === "fuel") {
        selects.push(`SELECT id, vehicle_id, 'fuel' AS type, occurred_on, odometer_km, 'Fuel fill' AS title, station AS detail, total_cost_minor AS amount_minor, currency, created_at FROM fuel_entries WHERE ${range}`);
      } else if (type === "service") {
        if (query.serviceCategory) {
          typeParameters.push(query.serviceCategory);
          selects.push(`SELECT id, vehicle_id, 'service' AS type, occurred_on, odometer_km, category AS title, provider AS detail, total_cost_minor AS amount_minor, currency, created_at FROM service_records WHERE ${range} AND category = ?`);
        } else {
        selects.push(`SELECT id, vehicle_id, 'service' AS type, occurred_on, odometer_km, category AS title, provider AS detail, total_cost_minor AS amount_minor, currency, created_at FROM service_records WHERE ${range}`);
        }
      } else {
        selects.push(`SELECT id, vehicle_id, 'repair' AS type, occurred_on, odometer_km, issue AS title, provider AS detail, total_cost_minor AS amount_minor, currency, created_at FROM repair_records WHERE ${range}`);
      }
      parameters.push(...typeParameters);
    }
    parameters.push(Math.max(1, Math.min(query.limit, 100)));
    const rows = await this.database.getAllAsync<Record<string, unknown>>(`${selects.join(" UNION ALL ")} ORDER BY occurred_on DESC, created_at DESC LIMIT ?`, ...parameters);
    return rows.map(rowToActivity);
  }

  async listFuelEntriesForInsight(vehicleId: VehicleId): Promise<FuelEntry[]> {
    const rows = await this.database.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM fuel_entries WHERE vehicle_id = ? AND deleted_at IS NULL ORDER BY occurred_on DESC, created_at DESC LIMIT 2",
      vehicleId,
    );
    return rows.map(rowToFuel);
  }

  async listServiceCategories(vehicleId: VehicleId, range: DateRange): Promise<string[]> {
    const parameters: unknown[] = [vehicleId];
    const where = withDateRange("vehicle_id = ? AND deleted_at IS NULL", range, parameters);
    const rows = await this.database.getAllAsync<{ category: string }>(`SELECT DISTINCT category FROM service_records WHERE ${where} ORDER BY category COLLATE NOCASE ASC`, ...parameters);
    return rows.map((row) => row.category);
  }

  async listExpenses(vehicleId: VehicleId, range: DateRange): Promise<ExpenseProjection[]> {
    const parameters: unknown[] = [vehicleId];
    const where = withDateRange("vehicle_id = ? AND deleted_at IS NULL", range, parameters);
    const rows = await this.database.getAllAsync<Record<string, unknown>>(`SELECT * FROM expense_projections WHERE ${where} ORDER BY occurred_on DESC, id DESC`, ...parameters);
    return rows.map(rowToExpense);
  }

  async listExpenseCategoryTotals(vehicleId: VehicleId, range: DateRange): Promise<ExpenseCategoryTotal[]> {
    const parameters: unknown[] = [vehicleId];
    const where = withDateRange("vehicle_id = ? AND deleted_at IS NULL", range, parameters);
    const rows = await this.database.getAllAsync<Record<string, unknown>>(
      `SELECT category, currency, SUM(total_cost_minor) AS amount_minor, COUNT(*) AS record_count FROM expense_projections WHERE ${where} GROUP BY category, currency ORDER BY amount_minor DESC, category ASC`,
      ...parameters,
    );
    return rows.map((row) => ({ category: String(row.category), currency: row.currency as "INR", amountMinor: Number(row.amount_minor), recordCount: Number(row.record_count) }));
  }

  async listDueServices(vehicleId: VehicleId, limit: number): Promise<DueServiceItem[]> {
    const rows = await this.database.getAllAsync<Record<string, unknown>>(
      "SELECT id, vehicle_id, category, next_due_on, next_due_odometer_km, occurred_on, odometer_km FROM service_records WHERE vehicle_id = ? AND deleted_at IS NULL AND (next_due_on IS NOT NULL OR next_due_odometer_km IS NOT NULL) ORDER BY COALESCE(next_due_on, '9999-12-31') ASC, COALESCE(next_due_odometer_km, 2147483647) ASC LIMIT ?",
      vehicleId,
      Math.max(1, Math.min(limit, 25)),
    );
    return rows.map((row) => ({
      id: String(row.id), vehicleId: String(row.vehicle_id), category: String(row.category), nextDueOn: row.next_due_on as string | null,
      nextDueOdometerKm: row.next_due_odometer_km === null ? null : Number(row.next_due_odometer_km), occurredOn: String(row.occurred_on), odometerKm: Number(row.odometer_km),
    }));
  }
}
