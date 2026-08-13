import { describe, expect, it } from "vitest";

import { seedFuelEntry, seedVehicle } from "../../src/data/seed-fixtures";
import type { DueServiceItem, ExpenseCategoryTotal } from "../../src/reporting/contracts";
import { buildDashboardViewModel, buildFuelInsight, buildNextService, expenseTotal, rangeForPeriod } from "../../src/reporting/selectors";

const dueService: DueServiceItem = { id: "service-oil", vehicleId: seedVehicle.id, category: "Oil change", nextDueOn: "2026-08-20", nextDueOdometerKm: null, occurredOn: "2026-06-01", odometerKm: 46000 };

describe("Phase 6 reporting selectors", () => {
  it("creates bounded current-month, rolling-quarter, year, and all-time ranges", () => {
    expect(rangeForPeriod("2026-08-13", "month")).toEqual({ startOn: "2026-08-01", endOn: "2026-08-31" });
    expect(rangeForPeriod("2026-01-03", "quarter")).toEqual({ startOn: "2025-11-01", endOn: "2026-01-31" });
    expect(rangeForPeriod("2026-08-13", "year")).toEqual({ startOn: "2026-01-01", endOn: "2026-12-31" });
    expect(rangeForPeriod("2026-08-13", "all")).toEqual({ startOn: null, endOn: null });
  });

  it("marks a due service as unavailable, upcoming, due soon, or overdue at the correct boundaries", () => {
    expect(buildNextService([], "2026-08-13", 46420).status).toBe("unavailable");
    expect(buildNextService([dueService], "2026-08-13", 46420).status).toBe("due-soon");
    expect(buildNextService([{ ...dueService, nextDueOn: "2026-08-21" }], "2026-08-13", 46420).status).toBe("upcoming");
    expect(buildNextService([{ ...dueService, nextDueOn: "2026-08-12" }], "2026-08-13", 46420).status).toBe("overdue");
    expect(buildNextService([{ ...dueService, nextDueOn: null, nextDueOdometerKm: 46420 }], "2026-08-13", 46420).status).toBe("overdue");
  });

  it("keeps fuel efficiency unavailable until consecutive compatible fill data exists", () => {
    expect(buildFuelInsight([]).efficiencyKmPerLitre).toBeNull();
    expect(buildFuelInsight([{ ...seedFuelEntry, createdAt: "2026-08-01", updatedAt: "2026-08-01", deletedAt: null, syncState: "local" }]).efficiencyKmPerLitre).toBeNull();
    const insight = buildFuelInsight([
      { ...seedFuelEntry, id: "fuel-first", occurredOn: "2026-08-01", odometerKm: 46000, createdAt: "2026-08-01", updatedAt: "2026-08-01", deletedAt: null, syncState: "local" },
      { ...seedFuelEntry, id: "fuel-latest", occurredOn: "2026-08-10", odometerKm: 46420, quantityMilliLitres: 35000, createdAt: "2026-08-10", updatedAt: "2026-08-10", deletedAt: null, syncState: "local" },
    ]);
    expect(insight.efficiencyKmPerLitre).toBe(12);
    expect(insight.label).toBe("12 km/l");
  });

  it("creates accurate zero-data and category total dashboard summaries without invented figures", () => {
    const categories: ExpenseCategoryTotal[] = [{ category: "Fuel", amountMinor: 125050, currency: "INR", recordCount: 2 }, { category: "Service", amountMinor: 340000, currency: "INR", recordCount: 1 }];
    expect(expenseTotal(categories)).toBe(465050);
    const dashboard = buildDashboardViewModel({ vehicle: null, periodExpenseMinor: 0, recentActivity: [], dueServices: [], fuelEntries: [], today: "2026-08-13" });
    expect(dashboard.vehicleName).toBeNull();
    expect(dashboard.periodExpenseMinor).toBe(0);
    expect(dashboard.nextService.status).toBe("unavailable");
    expect(dashboard.fuelInsight.efficiencyKmPerLitre).toBeNull();
  });

  it("keeps dashboard vehicle scope explicit when switching source models", () => {
    const vehicle = { ...seedVehicle, createdAt: "2026-01-01", updatedAt: "2026-01-01", archivedAt: null, deletedAt: null, syncState: "local" as const };
    const dashboard = buildDashboardViewModel({ vehicle, periodExpenseMinor: 100, recentActivity: [], dueServices: [], fuelEntries: [], today: "2026-08-13" });
    expect(dashboard.vehicleName).toBe("Honda City");
    expect(dashboard.currentOdometerKm).toBe(46420);
  });
});
