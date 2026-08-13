export const primaryTabs = [{ route: "index", label: "Dashboard" }, { route: "service", label: "Service" }, { route: "expenses", label: "Expenses" }, { route: "settings", label: "Settings" }] as const;
export const modalRoutes = ["add-record", "reminder/new"] as const;
export const detailRoutes = ["vehicle/[id]", "vehicle/[id]/records", "record/[type]/[id]", "reminders", "reminder/[id]"] as const;
export type PrimaryTabRoute = (typeof primaryTabs)[number]["route"];
export function isPrimaryTabRoute(route: string): route is PrimaryTabRoute { return primaryTabs.some((tab) => tab.route === route); }
