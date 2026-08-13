import { describe, expect, it } from "vitest";

import { DEFAULT_APP_CONFIG } from "../../src/config/app-config";
import { resolveLaunchState } from "../../src/lib/runtime/launch-state";

describe("launch state", () => {
  it("renders a deterministic empty first-run state without fabricated vehicle data", () => {
    expect(resolveLaunchState(DEFAULT_APP_CONFIG)).toEqual({
      kind: "ready",
      config: DEFAULT_APP_CONFIG,
      isFirstRun: true,
    });
  });

  it("returns a recoverable configuration error when config is missing", () => {
    const state = resolveLaunchState(null);

    expect(state.kind).toBe("configuration-error");
    if (state.kind === "configuration-error") {
      expect(state.message).toContain("App name is missing.");
      expect(state.message).toContain("Data mode must be local-first for the pilot.");
    }
  });

  it("keeps cloud synchronization disabled for the Phase 2 foundation", () => {
    const state = resolveLaunchState(DEFAULT_APP_CONFIG);

    expect(state.kind).toBe("ready");
    if (state.kind === "ready") {
      expect(state.config.supportsCloudSync).toBe(false);
      expect(state.config.dataMode).toBe("local-first");
    }
  });
});
