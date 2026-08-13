import type { FuelEntry, RepairRecord, ServiceRecord, VehicleId } from "../domain/models";
import type { CareRecordType } from "../reporting/contracts";
import { createCsvExport } from "./csv-formatter";
import type { CsvExportOptions, CsvExportResult, CsvExportRow } from "./contracts";

interface VehicleRecordSource<TRecord> {
  listForVehicle(vehicleId: VehicleId): Promise<TRecord[]>;
}

type SortableCsvRow = CsvExportRow & { readonly stableId: string };

function isWithinInclusiveRange(occurredOn: string, options: CsvExportOptions): boolean {
  return (!options.startOn || occurredOn >= options.startOn) && (!options.endOn || occurredOn <= options.endOn);
}

function sortRows(left: SortableCsvRow, right: SortableCsvRow): number {
  return left.occurredOn.localeCompare(right.occurredOn)
    || left.odometerKm - right.odometerKm
    || left.stableId.localeCompare(right.stableId);
}

function fuelToRow(record: FuelEntry): SortableCsvRow {
  return {
    stableId: record.id,
    recordType: "fuel",
    occurredOn: record.occurredOn,
    odometerKm: record.odometerKm,
    categoryOrDescription: "Fuel fill",
    amountMinor: record.cost.amountMinor,
    currency: record.cost.currency,
    fuelMilliLitres: record.quantityMilliLitres,
    nextDueOn: null,
    nextDueOdometerKm: null,
  };
}

function serviceToRow(record: ServiceRecord): SortableCsvRow {
  return {
    stableId: record.id,
    recordType: "service",
    occurredOn: record.occurredOn,
    odometerKm: record.odometerKm,
    categoryOrDescription: record.category,
    amountMinor: record.cost?.amountMinor ?? null,
    currency: record.cost?.currency ?? null,
    fuelMilliLitres: null,
    nextDueOn: record.nextDueOn,
    nextDueOdometerKm: record.nextDueOdometerKm,
  };
}

function repairToRow(record: RepairRecord): SortableCsvRow {
  return {
    stableId: record.id,
    recordType: "repair",
    occurredOn: record.occurredOn,
    odometerKm: record.odometerKm,
    categoryOrDescription: record.issue,
    amountMinor: record.cost?.amountMinor ?? null,
    currency: record.cost?.currency ?? null,
    fuelMilliLitres: null,
    nextDueOn: null,
    nextDueOdometerKm: null,
  };
}

/**
 * Loads only a selected vehicle's local records and emits the sanitised rows
 * accepted by the CSV formatter. It deliberately never returns providers,
 * stations, notes, sync metadata, paths, or account data.
 */
export class LocalCsvExportService {
  constructor(
    private readonly fuelRepository: VehicleRecordSource<FuelEntry>,
    private readonly serviceRepository: VehicleRecordSource<ServiceRecord>,
    private readonly repairRepository: VehicleRecordSource<RepairRecord>,
    private readonly today: () => string = () => new Date().toISOString().slice(0, 10),
  ) {}

  async create(options: CsvExportOptions): Promise<CsvExportResult> {
    const requested = new Set<CareRecordType>(options.recordTypes);
    const [fuel, service, repair] = await Promise.all([
      requested.has("fuel") ? this.fuelRepository.listForVehicle(options.vehicleId) : Promise.resolve([]),
      requested.has("service") ? this.serviceRepository.listForVehicle(options.vehicleId) : Promise.resolve([]),
      requested.has("repair") ? this.repairRepository.listForVehicle(options.vehicleId) : Promise.resolve([]),
    ]);

    const rows = [
      ...fuel.map(fuelToRow),
      ...service.map(serviceToRow),
      ...repair.map(repairToRow),
    ]
      .filter((row) => isWithinInclusiveRange(row.occurredOn, options))
      .sort(sortRows)
      .map(({ stableId: _stableId, ...row }) => row);

    return createCsvExport(rows, this.today());
  }
}
