import { describe, expect, it } from "vitest";

import { LocalCsvExportService } from "../../src/export/local-csv-export-service";

const fuel = [{ id: "fuel-z", vehicleId: "vehicle-a", occurredOn: "2026-03-02", odometerKm: 110, quantityMilliLitres: 42500, cost: { amountMinor: 451250, currency: "INR" as const }, station: "Private station", note: "Private fuel note", createdAt: "2026-03-02T00:00:00.000Z", updatedAt: "2026-03-02T00:00:00.000Z", deletedAt: null, syncState: "local" as const }];
const service = [{ id: "service-a", vehicleId: "vehicle-a", category: "Engine oil", occurredOn: "2026-03-01", odometerKm: 100, provider: "Private garage", cost: { amountMinor: 150000, currency: "INR" as const }, note: "Private service note", nextDueOn: "2026-09-01", nextDueOdometerKm: 5000, createdAt: "2026-03-01T00:00:00.000Z", updatedAt: "2026-03-01T00:00:00.000Z", deletedAt: null, syncState: "local" as const }];
const repair = [{ id: "repair-b", vehicleId: "vehicle-a", issue: "Brake pads", workPerformed: "Private repair detail", occurredOn: "2026-03-01", odometerKm: 100, provider: "Private garage", cost: null, note: "Private repair note", createdAt: "2026-03-01T00:00:00.000Z", updatedAt: "2026-03-01T00:00:00.000Z", deletedAt: null, syncState: "local" as const }];

function serviceUnderTest() {
  return new LocalCsvExportService({ listForVehicle: async () => fuel }, { listForVehicle: async () => service }, { listForVehicle: async () => repair }, () => "2026-03-03");
}

describe("LocalCsvExportService", () => {
  it("sorts a selected vehicle's local rows and omits private record fields", async () => {
    const result = await serviceUnderTest().create({ vehicleId: "vehicle-a", recordTypes: ["fuel", "service", "repair"], startOn: "2026-03-01", endOn: "2026-03-02" });
    expect(result).toMatchObject({ status: "ready", rowCount: 3 });
    if (result.status === "ready") {
      expect(result.csv).toContain("service,2026-03-01,100,Engine oil,1500.00,,2026-09-01,5000");
      expect(result.csv).toContain("repair,2026-03-01,100,Brake pads,,,,");
      expect(result.csv).toContain("fuel,2026-03-02,110,Fuel fill,4512.50,42.5,,");
      expect(result.csv).not.toContain("Private");
      expect(result.csv).not.toContain("fuel-z");
    }
  });

  it("does not ask excluded record sources for data and reports an empty inclusive range", async () => {
    let serviceCalls = 0;
    const exportService = new LocalCsvExportService(
      { listForVehicle: async () => fuel },
      { listForVehicle: async () => { serviceCalls += 1; return service; } },
      { listForVehicle: async () => repair },
      () => "2026-03-03",
    );
    await expect(exportService.create({ vehicleId: "vehicle-a", recordTypes: ["fuel"], startOn: "2026-04-01", endOn: "2026-04-30" })).resolves.toEqual({ status: "empty", rowCount: 0 });
    expect(serviceCalls).toBe(0);
  });
});
