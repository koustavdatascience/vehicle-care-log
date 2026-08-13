import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "app/(tabs)/settings.tsx"), "utf8");

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
});
