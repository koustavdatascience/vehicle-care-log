import {
  DEFAULT_APP_CONFIG,
  type PublicAppConfig,
  validatePublicAppConfig,
} from "../../config/app-config";

export type LaunchState =
  | { kind: "ready"; config: PublicAppConfig; isFirstRun: boolean }
  | { kind: "configuration-error"; message: string };

/**
 * Produces a renderable startup state without reading or fabricating vehicle data.
 * Persistence is intentionally introduced in Phase 4, so the foundation is always
 * a first-run state when configuration is valid.
 */
export function resolveLaunchState(
  config: Partial<PublicAppConfig> | null | undefined = DEFAULT_APP_CONFIG,
): LaunchState {
  const result = validatePublicAppConfig(config);

  if (!result.ok) {
    return {
      kind: "configuration-error",
      message: `Vehicle Care Log could not start: ${result.issues.join(" ")}`,
    };
  }

  return { kind: "ready", config: result.value, isFirstRun: true };
}
