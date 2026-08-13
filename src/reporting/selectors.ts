import { calculateFuelEfficiency } from "../domain/services";
import type { FuelEntry, Vehicle } from "../domain/models";
import type { ActivityFeedItem, DueServiceItem, ExpenseCategoryTotal } from "./contracts";

export interface DashboardViewModel {
  vehicleName: string | null;
  currentOdometerKm: number | null;
  periodExpenseMinor: number;
  expenseCurrency: "INR";
  recentActivity: readonly ActivityFeedItem[];
  nextService: { label: string; detail: string; status: "overdue" | "due-soon" | "upcoming" | "unavailable" };
  fuelInsight: { label: string; detail: string; efficiencyKmPerLitre: number | null };
}

export function monthRange(today: string): { startOn: string; endOn: string } {
  const [year, month] = today.split("-").map(Number);
  const finalDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { startOn: `${year}-${String(month).padStart(2, "0")}-01`, endOn: `${year}-${String(month).padStart(2, "0")}-${String(finalDay).padStart(2, "0")}` };
}

export function rangeForPeriod(today: string, period: "month" | "quarter" | "year" | "all"): { startOn: string | null; endOn: string | null } {
  if (period === "all") return { startOn: null, endOn: null };
  const [year, month] = today.split("-").map(Number);
  if (period === "month") return monthRange(today);
  if (period === "year") return { startOn: `${year}-01-01`, endOn: `${year}-12-31` };
  const endDate = new Date(Date.UTC(year, month - 1, 1));
  const startDate = new Date(Date.UTC(year, month - 3, 1));
  const lastDay = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth() + 1, 0)).getUTCDate();
  return {
    startOn: `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, "0")}-01`,
    endOn: `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function buildNextService(dueServices: readonly DueServiceItem[], today: string, currentOdometerKm: number | null): DashboardViewModel["nextService"] {
  const candidate = dueServices.find((entry) => entry.nextDueOn !== null || entry.nextDueOdometerKm !== null);
  if (!candidate) return { label: "No service due", detail: "Add a next-due date or mileage to a service record.", status: "unavailable" };
  const dateOverdue = candidate.nextDueOn !== null && candidate.nextDueOn < today;
  const mileageOverdue = currentOdometerKm !== null && candidate.nextDueOdometerKm !== null && currentOdometerKm >= candidate.nextDueOdometerKm;
  const dateSoon = candidate.nextDueOn !== null && candidate.nextDueOn >= today && candidate.nextDueOn <= addDays(today, 7);
  const mileageSoon = currentOdometerKm !== null && candidate.nextDueOdometerKm !== null && candidate.nextDueOdometerKm - currentOdometerKm <= 500;
  const detail = candidate.nextDueOn ? `Due ${candidate.nextDueOn}` : `Due at ${candidate.nextDueOdometerKm?.toLocaleString("en-IN")} km`;
  if (dateOverdue || mileageOverdue) return { label: candidate.category, detail, status: "overdue" };
  if (dateSoon || mileageSoon) return { label: candidate.category, detail, status: "due-soon" };
  return { label: candidate.category, detail, status: "upcoming" };
}

export function buildFuelInsight(fuelEntries: readonly FuelEntry[]): DashboardViewModel["fuelInsight"] {
  const { current, previous } = latestFuelPair(fuelEntries);
  const efficiencyKmPerLitre = calculateFuelEfficiency(previous, current);
  if (!current) return { label: "No fuel data", detail: "Add a fuel record to start tracking fills.", efficiencyKmPerLitre: null };
  if (efficiencyKmPerLitre === null) return { label: "Fuel efficiency unavailable", detail: "Add a compatible consecutive fuel record to calculate km/l.", efficiencyKmPerLitre: null };
  return { label: `${efficiencyKmPerLitre.toLocaleString("en-IN")} km/l`, detail: `Based on the latest two fills through ${current.occurredOn}.`, efficiencyKmPerLitre };
}

/** Keeps dashboard fuel insight linear even when a local database contains years of fills. */
function latestFuelPair(fuelEntries: readonly FuelEntry[]): { current: FuelEntry | null; previous: FuelEntry | null } {
  let current: FuelEntry | null = null;
  let previous: FuelEntry | null = null;
  for (const entry of fuelEntries) {
    if (current === null || fuelSortKey(entry) > fuelSortKey(current)) {
      previous = current;
      current = entry;
    } else if (previous === null || fuelSortKey(entry) > fuelSortKey(previous)) {
      previous = entry;
    }
  }
  return { current, previous };
}

function fuelSortKey(entry: FuelEntry): string {
  return `${entry.occurredOn}|${entry.createdAt}|${entry.id}`;
}

export function buildDashboardViewModel(input: {
  vehicle: Vehicle | null;
  periodExpenseMinor: number;
  recentActivity: readonly ActivityFeedItem[];
  dueServices: readonly DueServiceItem[];
  fuelEntries: readonly FuelEntry[];
  today: string;
}): DashboardViewModel {
  return {
    vehicleName: input.vehicle?.nickname ?? null,
    currentOdometerKm: input.vehicle?.currentOdometerKm ?? null,
    periodExpenseMinor: input.periodExpenseMinor,
    expenseCurrency: "INR",
    recentActivity: input.recentActivity,
    nextService: buildNextService(input.dueServices, input.today, input.vehicle?.currentOdometerKm ?? null),
    fuelInsight: buildFuelInsight(input.fuelEntries),
  };
}

export function expenseTotal(categoryTotals: readonly ExpenseCategoryTotal[]): number {
  return categoryTotals.reduce((total, entry) => total + entry.amountMinor, 0);
}

function addDays(isoDate: string, count: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
