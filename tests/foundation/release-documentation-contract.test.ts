import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const docs = ["SETUP.md", "MIGRATIONS.md", "SYNC_PROTOCOL.md", "NOTIFICATIONS.md", "PRIVACY.md", "RELEASE.md", "TESTING.md", "phase-10-release-readiness.md"];
const docsRoot = resolve(process.cwd(), "docs");

describe("Phase 10 operational documentation contract", () => {
  it("ships the required setup, operations, privacy, and release guides", () => {
    for (const document of docs) {
      expect(existsSync(resolve(docsRoot, document)), `Expected docs/${document} to exist`).toBe(true);
    }
  });

  it("documents local-first operation, generic sync recovery, backup boundaries, and a closed production gate", () => {
    expect(readFileSync(resolve(docsRoot, "SETUP.md"), "utf8")).toContain("local-first");
    expect(readFileSync(resolve(docsRoot, "MIGRATIONS.md"), "utf8")).toContain("PRAGMA user_version");
    expect(readFileSync(resolve(docsRoot, "SYNC_PROTOCOL.md"), "utf8")).toContain("Sync unavailable. Retry when connectivity returns.");
    expect(readFileSync(resolve(docsRoot, "NOTIFICATIONS.md"), "utf8")).toContain("vehicle-care-reminders");
    expect(readFileSync(resolve(docsRoot, "PRIVACY.md"), "utf8")).toContain("EXPO_PUBLIC_*");
    expect(readFileSync(resolve(docsRoot, "RELEASE.md"), "utf8")).toContain("Publish");
    expect(readFileSync(resolve(docsRoot, "phase-10-release-readiness.md"), "utf8")).toContain("production gate remains closed");
  });
});
