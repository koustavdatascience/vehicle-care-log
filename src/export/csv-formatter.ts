import { CSV_EXPORT_COLUMNS, type CsvExportResult, type CsvExportRow } from "./contracts";

const FORMULA_PREFIX = /^[=+\-@]/;
const CSV_LINE_ENDING = "\r\n";

function formatAmount(amountMinor: number | null): string {
  return amountMinor === null ? "" : (amountMinor / 100).toFixed(2);
}

function formatFuelLitres(fuelMilliLitres: number | null): string {
  if (fuelMilliLitres === null) {
    return "";
  }

  return (fuelMilliLitres / 1000).toFixed(3).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

/**
 * Serialises a cell using RFC 4180-compatible quoting and neutralises values
 * which spreadsheet software could interpret as formulas on import.
 */
export function formatCsvCell(value: string | number | null): string {
  if (value === null) {
    return "";
  }

  const text = String(value);
  const safeText = FORMULA_PREFIX.test(text.trimStart()) ? `'${text}` : text;
  const requiresQuotes = /[",\r\n]/.test(safeText);

  return requiresQuotes ? `"${safeText.replaceAll('"', '""')}"` : safeText;
}

function toCells(row: CsvExportRow): readonly (string | number | null)[] {
  return [
    row.recordType,
    row.occurredOn,
    row.odometerKm,
    row.categoryOrDescription,
    formatAmount(row.amountMinor),
    formatFuelLitres(row.fuelMilliLitres),
    row.nextDueOn,
    row.nextDueOdometerKm,
  ];
}

/**
 * Produces a stable, device-local care-history CSV. Callers provide only
 * sanitised export rows from the contract boundary; this formatter never
 * receives database IDs, notes, account information, sync state, or paths.
 */
export function createCsvExport(rows: readonly CsvExportRow[], exportedOn: string): CsvExportResult {
  if (rows.length === 0) {
    return { status: "empty", rowCount: 0 };
  }

  const csvLines = [
    CSV_EXPORT_COLUMNS.map(formatCsvCell).join(","),
    ...rows.map((row) => toCells(row).map(formatCsvCell).join(",")),
  ];

  return {
    status: "ready",
    fileName: `vehicle-care-log-export-${exportedOn}.csv`,
    csv: `${csvLines.join(CSV_LINE_ENDING)}${CSV_LINE_ENDING}`,
    rowCount: rows.length,
  };
}
