import { describe, expect, it } from "vitest";

import { calculateExpenseTotal, calculateFuelEfficiency, getReminderStatus, validateDateNotInFuture, validateOdometerProgression, validateVehicleDraft } from "../../src/domain/services";
import { seedFuelEntry, seedVehicle } from "../../src/data/seed-fixtures";

describe("Phase 4 domain services", () => {
  it("rejects missing vehicle identity, negative mileage, invalid years, and future record dates", () => {
    const invalidVehicle = validateVehicleDraft({ ...seedVehicle, nickname: "", year: 1700, currentOdometerKm: -1 });
    expect(invalidVehicle.ok).toBe(false);
    expect(validateDateNotInFuture("2027-01-01", "2026-08-13").ok).toBe(false);
  });

  it("rejects odometer regressions and treats unavailable fuel efficiency as incomplete data", () => {
    expect(validateOdometerProgression(1000, 999).ok).toBe(false);
    expect(calculateFuelEfficiency(null, { ...seedFuelEntry, createdAt: "", updatedAt: "", deletedAt: null, syncState: "local" })).toBeNull();
  });

  it("calculates only active expense projections and handles due-soon versus overdue boundaries", () => {
    expect(calculateExpenseTotal([{ id: "expense-1", vehicleId: seedVehicle.id, sourceType: "fuel", sourceId: "fuel-1", occurredOn: "2026-08-01", category: "Fuel", cost: { amountMinor: 420000, currency: "INR" }, deletedAt: null }]).amountMinor).toBe(420000);
    const reminder = { id: "reminder-1", vehicleId: seedVehicle.id, title: "Oil change", dueOn: "2026-08-20", dueOdometerKm: null, completedAt: null, snoozedUntil: null, createdAt: "", updatedAt: "", deletedAt: null, syncState: "local" as const };
    expect(getReminderStatus(reminder, "2026-08-13")).toBe("due-soon");
    expect(getReminderStatus({ ...reminder, dueOn: "2026-08-12" }, "2026-08-13")).toBe("overdue");
  });
});
