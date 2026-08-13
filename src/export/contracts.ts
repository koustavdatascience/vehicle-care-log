import type { CurrencyCode, VehicleId } from "../domain/models";
import type { CareRecordType } from "../reporting/contracts";

export const CSV_EXPORT_COLUMNS = [
  "Record type",
  "Date",
  "Odometer (km)",
  "Category or description",
  "Amount (INR)",
  "Fuel (litres)",
  "Next due date",
  "Next due odometer (km)",
] as const;

export type CsvExportColumn = (typeof CSV_EXPORT_COLUMNS)[number];

/**
 * Local-only filters for a single vehicle export. Both date values are inclusive
 * ISO calendar dates when supplied.
 */
export interface CsvExportOptions {
  vehicleId: VehicleId;
  recordTypes: readonly CareRecordType[];
  startOn: string | null;
  endOn: string | null;
}

/**
 * Sanitised spreadsheet row. It purposefully excludes IDs, provider/station
 * names, free-text notes, sync metadata, attachment paths, and account data.
 */
export interface CsvExportRow {
  recordType: CareRecordType;
  occurredOn: string;
  odometerKm: number;
  categoryOrDescription: string;
  amountMinor: number | null;
  currency: CurrencyCode | null;
  fuelMilliLitres: number | null;
  nextDueOn: string | null;
  nextDueOdometerKm: number | null;
}

export type CsvExportResult =
  | { status: "ready"; fileName: string; csv: string; rowCount: number }
  | { status: "empty"; rowCount: 0 };

export const CSV_EXPORT_PRIVACY_BOUNDARY = {
  localOnly: true,
  excludes: [
    "record-id",
    "vehicle-registration",
    "provider-or-station",
    "free-text-note",
    "account-or-owner-identifier",
    "sync-state",
    "attachment-metadata",
    "diagnostic-data",
  ],
} as const;
