export const APP_ENVIRONMENTS = ["development", "staging", "pilot", "production"] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

export type PublicAppConfig = {
  appName: string;
  appSlug: string;
  environment: AppEnvironment;
  dataMode: "local-first";
  supportsCloudSync: boolean;
};

export const DEFAULT_APP_CONFIG: PublicAppConfig = {
  appName: "Vehicle Care Log",
  appSlug: "vehicle-care-log-app",
  environment: "development",
  dataMode: "local-first",
  supportsCloudSync: false,
};

export type ConfigValidationResult =
  | { ok: true; value: PublicAppConfig }
  | { ok: false; issues: string[] };

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isEnvironment(value: unknown): value is AppEnvironment {
  return typeof value === "string" && APP_ENVIRONMENTS.includes(value as AppEnvironment);
}

/**
 * Validates only public, non-secret configuration used by the mobile client.
 * The function is intentionally deterministic so startup failure states can be tested.
 */
export function validatePublicAppConfig(value: Partial<PublicAppConfig> | null | undefined): ConfigValidationResult {
  const issues: string[] = [];

  if (!value || !nonEmptyString(value.appName)) {
    issues.push("App name is missing.");
  }

  if (!value || !nonEmptyString(value.appSlug)) {
    issues.push("App slug is missing.");
  }

  if (!value || !isEnvironment(value.environment)) {
    issues.push("App environment is invalid.");
  }

  if (!value || value.dataMode !== "local-first") {
    issues.push("Data mode must be local-first for the pilot.");
  }

  if (!value || typeof value.supportsCloudSync !== "boolean") {
    issues.push("Cloud sync capability must be explicitly configured.");
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, value: value as PublicAppConfig };
}
