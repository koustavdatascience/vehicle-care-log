import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "components/foundation/app-error-boundary.tsx"), "utf8");

describe("Phase 9 global recovery boundary contract", () => {
  it("uses a polite alert recovery surface without exposing exception text", () => {
    expect(source).toContain('accessibilityRole="alert"');
    expect(source).toContain("safeDiagnosticError(\"ui.render_failure\", error)");
    expect(source).toContain("Your locally saved vehicle records remain unchanged. Please try again.");
    expect(source).toContain('label="Try again"');
    expect(source).not.toContain("error.message");
  });
});
