import { afterEach, describe, expect, it, vi } from "vitest";

import { recordSafeAnalytics } from "../../src/diagnostics/safe-analytics";

describe("safe analytics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("records a namespaced product event with sensitive attributes redacted in development", () => {
    vi.stubGlobal("__DEV__", true);
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);

    recordSafeAnalytics("sync_completed", {
      hadConflict: false,
      recordCount: 4,
      accountId: "private-account-id",
      attachmentUri: "file:///private/receipt.jpg",
    });

    expect(log).toHaveBeenCalledWith("[VCL:analytics.sync_completed]", {
      hadConflict: false,
      recordCount: 4,
      accountId: "[redacted]",
      attachmentUri: "[redacted]",
    });
  });

  it("does not emit product telemetry outside development", () => {
    vi.stubGlobal("__DEV__", false);
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);

    recordSafeAnalytics("backup_exported", { shared: true });

    expect(log).not.toHaveBeenCalled();
  });
});
