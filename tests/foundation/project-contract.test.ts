import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = resolve(__dirname, "../..");

describe("Phase 2 project contract", () => {
  it("keeps the expected route, source, component, test, and documentation boundaries", () => {
    const requiredPaths = [
      "app/(tabs)/index.tsx",
      "components/foundation/project-foundation-screen.tsx",
      "src/config/app-config.ts",
      "src/lib/runtime/launch-state.ts",
      "tests/foundation/app-config.test.ts",
      "docs/development.md",
      "design.md",
      "todo.md",
      ".github/workflows/quality.yml",
    ];

    for (const path of requiredPaths) {
      expect(existsSync(resolve(projectRoot, path)), `Expected ${path} to exist`).toBe(true);
    }
  });

  it("targets portrait use and the provisional iOS 16 and Android 10 support policy", () => {
    const config = readFileSync(resolve(projectRoot, "app.config.ts"), "utf8");

    expect(config).toContain('orientation: "portrait"');
    expect(config).toContain('deploymentTarget: "16.0"');
    expect(config).toContain("minSdkVersion: 29");
  });

  it("does not add account, cloud-sync, deep-link, microphone, or video configuration before their planned phases", () => {
    const config = readFileSync(resolve(projectRoot, "app.config.ts"), "utf8");

    expect(config).not.toContain("intentFilters");
    expect(config).not.toContain("expo-audio");
    expect(config).not.toContain("expo-video");
    expect(config).not.toContain("POST_NOTIFICATIONS");
  });
});
