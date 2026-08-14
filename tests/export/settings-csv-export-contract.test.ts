import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "app/(tabs)/settings.tsx"), "utf8");
const documentation = readFileSync(resolve(process.cwd(), "docs/CSV_EXPORT.md"), "utf8");

describe("Phase 3 Settings CSV export contract", () => {
  it("keeps export scoped to a selected local vehicle with an accessible share action", () => {
    expect(source).toContain("Local CSV report");
    expect(source).toContain("LocalCsvExportService");
    expect(source).toContain("vehicleId: exportVehicle.id");
    expect(source).toContain('recordTypes: ["fuel", "service", "repair"]');
    expect(source).toContain('label={exportingCsv ? "Preparing CSV report" : "Export CSV report"}');
    expect(source).toContain('accessibilityHint="Creates a local CSV report and opens the device share sheet."');
  });

  it("uses bounded recovery messages rather than raw native errors", () => {
    expect(source).toContain("The local CSV report could not be prepared. Please retry.");
    expect(source).toContain('accessibilityRole="alert"');
    expect(source).not.toContain("error.message");
    expect(source).not.toContain("console.error");
  });

  it("offers an accessible, locally validated custom inclusive date range", () => {
    expect(source).toContain('label: "Custom", value: "custom"');
    expect(source).toContain('exportPeriod === "custom"');
    expect(source).toContain('label="CSV export start date"');
    expect(source).toContain('label="CSV export end date"');
    expect(source).toContain("validateCustomCsvDateRange");
    expect(source).toContain("minimumDate={customExportStartOn ?? undefined}");
    expect(documentation).toContain("custom inclusive date range");
  });

  it("explains the selected sharing destination and documents temporary-file handling", () => {
    expect(source).toContain("then may be copied by the app you choose from the share sheet");
    expect(documentation).toContain("If file creation or sharing fails after a report was written, the app attempts to delete that partial cached file");
    expect(documentation).toContain("does not require an account, cloud sync, an AI service, or an internet connection");
  });
});
