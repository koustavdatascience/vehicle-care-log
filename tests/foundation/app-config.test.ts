import { describe, expect, it } from "vitest";

import { DEFAULT_APP_CONFIG, validatePublicAppConfig } from "../../src/config/app-config";

describe("public app configuration", () => {
  it("accepts the local-first pilot defaults", () => {
    expect(validatePublicAppConfig(DEFAULT_APP_CONFIG)).toEqual({
      ok: true,
      value: DEFAULT_APP_CONFIG,
    });
  });

  it("rejects missing app identity rather than starting with incomplete metadata", () => {
    const result = validatePublicAppConfig({ ...DEFAULT_APP_CONFIG, appName: "", appSlug: "" });

    expect(result).toEqual({
      ok: false,
      issues: ["App name is missing.", "App slug is missing."],
    });
  });

  it("rejects an unsupported environment and premature cloud data mode", () => {
    const result = validatePublicAppConfig({
      ...DEFAULT_APP_CONFIG,
      environment: "preview" as never,
      dataMode: "cloud-first" as never,
    });

    expect(result).toEqual({
      ok: false,
      issues: ["App environment is invalid.", "Data mode must be local-first for the pilot."],
    });
  });

  it("requires an explicit cloud sync capability flag", () => {
    const candidate = { ...DEFAULT_APP_CONFIG } as Partial<typeof DEFAULT_APP_CONFIG>;
    delete candidate.supportsCloudSync;

    expect(validatePublicAppConfig(candidate)).toEqual({
      ok: false,
      issues: ["Cloud sync capability must be explicitly configured."],
    });
  });
});
