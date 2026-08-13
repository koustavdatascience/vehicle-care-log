import type { ExpenseProjection, FuelEntry, Money, Reminder, RepairRecord, ServiceRecord, Vehicle } from "./models";

export type ValidationCode =
  | "required"
  | "invalid-date"
  | "future-date"
  | "negative-value"
  | "invalid-value"
  | "odometer-regression"
  | "invalid-year";

export interface ValidationIssue {
  field: string;
  code: ValidationCode;
  message: string;
}

export type ValidationResult = { ok: true } | { ok: false; issues: ValidationIssue[] };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function issue(field: string, code: ValidationCode, message: string): ValidationIssue {
  return { field, code, message };
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  return !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}

export function validateDateNotInFuture(value: string, today: string): ValidationResult {
  if (!isValidIsoDate(value)) return { ok: false, issues: [issue("occurredOn", "invalid-date", "Enter a valid date.")] };
  if (value > today) return { ok: false, issues: [issue("occurredOn", "future-date", "A care record cannot be dated in the future.")] };
  return { ok: true };
}

export function validateNonNegativeInteger(field: string, value: number): ValidationResult {
  if (!Number.isInteger(value) || value < 0) {
    return { ok: false, issues: [issue(field, "negative-value", "Enter a whole number that is zero or greater.")] };
  }
  return { ok: true };
}

export function validateVehicleDraft(vehicle: Pick<Vehicle, "nickname" | "make" | "model" | "year" | "currentOdometerKm">): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!vehicle.nickname.trim()) issues.push(issue("nickname", "required", "Enter a vehicle name."));
  if (!vehicle.make.trim()) issues.push(issue("make", "required", "Enter the vehicle make."));
  if (!vehicle.model.trim()) issues.push(issue("model", "required", "Enter the vehicle model."));
  if (!Number.isInteger(vehicle.year) || vehicle.year < 1886 || vehicle.year > new Date().getFullYear() + 1) {
    issues.push(issue("year", "invalid-year", "Enter a valid model year."));
  }
  if (vehicle.currentOdometerKm !== null) {
    const mileage = validateNonNegativeInteger("currentOdometerKm", vehicle.currentOdometerKm);
    if (!mileage.ok) issues.push(...mileage.issues);
  }
  return issues.length ? { ok: false, issues } : { ok: true };
}

export function validateOdometerProgression(previousKm: number | null, nextKm: number): ValidationResult {
  const base = validateNonNegativeInteger("odometerKm", nextKm);
  if (!base.ok) return base;
  if (previousKm !== null && nextKm < previousKm) {
    return { ok: false, issues: [issue("odometerKm", "odometer-regression", "Odometer reading cannot be lower than the previous saved reading.")] };
  }
  return { ok: true };
}

export function validateMoney(value: Money | null): ValidationResult {
  if (value === null) return { ok: true };
  if (!Number.isInteger(value.amountMinor) || value.amountMinor < 0) {
    return { ok: false, issues: [issue("cost", "negative-value", "Cost must be zero or greater.")] };
  }
  return { ok: true };
}

export function validateServiceDraft(
  service: Pick<ServiceRecord, "category" | "occurredOn" | "odometerKm" | "cost" | "nextDueOn" | "nextDueOdometerKm">,
  today: string,
  previousOdometerKm: number | null = null,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!service.category.trim()) issues.push(issue("category", "required", "Enter a service category."));

  const occurrence = validateDateNotInFuture(service.occurredOn, today);
  if (!occurrence.ok) issues.push(...occurrence.issues);

  const odometer = validateOdometerProgression(previousOdometerKm, service.odometerKm);
  if (!odometer.ok) issues.push(...odometer.issues);

  const cost = validateMoney(service.cost);
  if (!cost.ok) issues.push(...cost.issues);

  if (service.nextDueOn !== null) {
    if (!isValidIsoDate(service.nextDueOn)) {
      issues.push(issue("nextDueOn", "invalid-date", "Enter a valid next due date."));
    } else if (isValidIsoDate(service.occurredOn) && service.nextDueOn < service.occurredOn) {
      issues.push(issue("nextDueOn", "invalid-value", "The next due date cannot be before the service date."));
    }
  }

  if (service.nextDueOdometerKm !== null) {
    const nextOdometer = validateNonNegativeInteger("nextDueOdometerKm", service.nextDueOdometerKm);
    if (!nextOdometer.ok) issues.push(...nextOdometer.issues);
    else if (service.nextDueOdometerKm < service.odometerKm) {
      issues.push(issue("nextDueOdometerKm", "invalid-value", "The next due mileage cannot be below the service mileage."));
    }
  }

  return issues.length ? { ok: false, issues } : { ok: true };
}

export function validateRepairDraft(
  repair: Pick<RepairRecord, "issue" | "occurredOn" | "odometerKm" | "cost">,
  today: string,
  previousOdometerKm: number | null = null,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!repair.issue.trim()) issues.push(issue("issue", "required", "Describe the problem or repair."));

  const occurrence = validateDateNotInFuture(repair.occurredOn, today);
  if (!occurrence.ok) issues.push(...occurrence.issues);

  const odometer = validateOdometerProgression(previousOdometerKm, repair.odometerKm);
  if (!odometer.ok) issues.push(...odometer.issues);

  const cost = validateMoney(repair.cost);
  if (!cost.ok) issues.push(...cost.issues);

  return issues.length ? { ok: false, issues } : { ok: true };
}

export function calculateExpenseTotal(entries: readonly ExpenseProjection[], currency: Money["currency"] = "INR"): Money {
  return {
    currency,
    amountMinor: entries.filter((entry) => entry.deletedAt === null && entry.cost.currency === currency).reduce((total, entry) => total + entry.cost.amountMinor, 0),
  };
}

export function calculateFuelEfficiency(previous: FuelEntry | null, current: FuelEntry | null): number | null {
  if (!previous || !current || current.odometerKm <= previous.odometerKm || current.quantityMilliLitres <= 0) return null;
  const kilometres = current.odometerKm - previous.odometerKm;
  const litres = current.quantityMilliLitres / 1000;
  return Number((kilometres / litres).toFixed(2));
}

export type ReminderStatus = "complete" | "overdue" | "due-soon" | "upcoming" | "unavailable";

export function getReminderStatus(reminder: Reminder, today: string, leadDays = 7): ReminderStatus {
  if (reminder.completedAt) return "complete";
  if (!reminder.dueOn) return "unavailable";
  if (reminder.dueOn < today) return "overdue";
  const due = Date.parse(`${reminder.dueOn}T00:00:00.000Z`);
  const current = Date.parse(`${today}T00:00:00.000Z`);
  return due - current <= leadDays * 86_400_000 ? "due-soon" : "upcoming";
}

export function kilometresToMiles(km: number): number {
  return Number((km * 0.621371).toFixed(2));
}

export function buildDuplicateFingerprint(parts: readonly (string | number | null)[]): string {
  return parts.map((part) => String(part ?? "").trim().toLowerCase()).join("|");
}
