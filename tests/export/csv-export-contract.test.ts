import { describe, expect, it } from "vitest";

import { isGithubNoReplyEmail } from "../../src/export/contribution-attribution";
import {
  CSV_EXPORT_COLUMNS,
  CSV_EXPORT_PRIVACY_BOUNDARY,
  type CsvExportOptions,
  type CsvExportResult,
  type CsvExportRow,
} from "../../src/export/contracts";

describe("CSV export Phase 1 contract", () => {
  it("uses a stable spreadsheet column order and excludes private metadata", () => {
    expect(CSV_EXPORT_COLUMNS).toEqual([
      "Record type",
      "Date",
      "Odometer (km)",
      "Category or description",
      "Amount (INR)",
      "Fuel (litres)",
      "Next due date",
      "Next due odometer (km)",
    ]);

    expect(CSV_EXPORT_PRIVACY_BOUNDARY.localOnly).toBe(true);
    expect(CSV_EXPORT_PRIVACY_BOUNDARY.excludes).toEqual(expect.arrayContaining([
      "record-id",
      "free-text-note",
      "sync-state",
      "attachment-metadata",
      "diagnostic-data",
    ]));
  });

  it("supports single-vehicle, inclusive local date filters and an explicit empty result", () => {
    const options: CsvExportOptions = {
      vehicleId: "vehicle-1",
      recordTypes: ["fuel", "service", "repair"],
      startOn: "2026-01-01",
      endOn: "2026-12-31",
    };
    const row: CsvExportRow = {
      recordType: "service",
      occurredOn: "2026-05-12",
      odometerKm: 24500,
      categoryOrDescription: "Engine oil service",
      amountMinor: 350000,
      currency: "INR",
      fuelMilliLitres: null,
      nextDueOn: "2027-05-12",
      nextDueOdometerKm: 34500,
    };
    const result: CsvExportResult = { status: "empty", rowCount: 0 };

    expect(options.vehicleId).toBe("vehicle-1");
    expect(row.categoryOrDescription).toBe("Engine oil service");
    expect(result).toEqual({ status: "empty", rowCount: 0 });
  });
});

describe("GitHub contribution attribution", () => {
  it("accepts only the authenticated user no-reply email format", () => {
    expect(isGithubNoReplyEmail(
      "305587514+koustavdatascience@users.noreply.github.com",
      "koustavdatascience",
    )).toBe(true);
    expect(isGithubNoReplyEmail("dev-agent@manus.ai", "koustavdatascience")).toBe(false);
    expect(isGithubNoReplyEmail(
      "305587514+another-user@users.noreply.github.com",
      "koustavdatascience",
    )).toBe(false);
  });
});
