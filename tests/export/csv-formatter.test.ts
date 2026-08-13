import { describe, expect, it } from "vitest";

import { createCsvExport, formatCsvCell } from "../../src/export/csv-formatter";
import type { CsvExportRow } from "../../src/export/contracts";

const fuelRow: CsvExportRow = {
  recordType: "fuel",
  occurredOn: "2026-08-13",
  odometerKm: 42120,
  categoryOrDescription: "Premium, full tank",
  amountMinor: 542375,
  currency: "INR",
  fuelMilliLitres: 45340,
  nextDueOn: null,
  nextDueOdometerKm: null,
};

describe("CSV formatter", () => {
  it("produces a stable RFC 4180 local export with formatted units", () => {
    expect(createCsvExport([fuelRow], "2026-08-13")).toEqual({
      status: "ready",
      fileName: "vehicle-care-log-export-2026-08-13.csv",
      rowCount: 1,
      csv:
        'Record type,Date,Odometer (km),Category or description,Amount (INR),Fuel (litres),Next due date,Next due odometer (km)\r\n' +
        'fuel,2026-08-13,42120,"Premium, full tank",5423.75,45.34,,\r\n',
    });
  });

  it("returns an explicit empty result instead of creating an empty file", () => {
    expect(createCsvExport([], "2026-08-13")).toEqual({ status: "empty", rowCount: 0 });
  });

  it("quotes delimiters and line breaks and neutralises spreadsheet formulas", () => {
    expect(formatCsvCell('Service "inspection"\ncompleted')).toBe('"Service ""inspection""\ncompleted"');
    expect(formatCsvCell("=HYPERLINK(\"https://example.invalid\")")).toBe('"\'=HYPERLINK(""https://example.invalid"")"');
    expect(formatCsvCell("  +SUM(1,1)")).toBe('"\'  +SUM(1,1)"');
  });
});
