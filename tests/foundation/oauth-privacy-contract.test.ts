import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "constants/oauth.ts"), "utf8");

describe("OAuth privacy diagnostics contract", () => {
  it("keeps OAuth launch failures and callback failures out of raw console logs and URL-bearing diagnostics", () => {
    expect(source).toContain('safeDiagnostic("oauth.login_url_unavailable", { hasPortal: Boolean(OAUTH_PORTAL_URL) })');
    expect(source).toContain('safeDiagnosticError("oauth.login_url_open_failed", error)');
    expect(source).not.toContain("console.warn");
    expect(source).not.toContain("console.error");
    expect(source).not.toContain("safeDiagnostic(\"oauth.login_url_unavailable\", { loginUrl");
  });
});
