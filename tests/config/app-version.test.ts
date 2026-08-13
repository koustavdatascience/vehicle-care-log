import { describe, expect, it } from "vitest";

import { formatInstalledAppVersion } from "../../src/config/app-version";

describe("formatInstalledAppVersion", () => {
  it("formats a configured semantic version for read-only Settings display", () => {
    expect(formatInstalledAppVersion("1.0.0")).toBe("Version 1.0.0");
  });

  it("trims runtime metadata before formatting", () => {
    expect(formatInstalledAppVersion(" 1.2.3 ")).toBe("Version 1.2.3");
  });

  it("uses an honest unavailable state when runtime metadata is missing", () => {
    expect(formatInstalledAppVersion(undefined)).toBe("Version unavailable");
    expect(formatInstalledAppVersion("   ")).toBe("Version unavailable");
  });
});
