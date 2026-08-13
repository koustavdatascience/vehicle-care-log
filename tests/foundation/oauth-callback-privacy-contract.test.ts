import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "app/oauth/callback.tsx"), "utf8");

describe("OAuth callback privacy contract", () => {
  it("uses bounded safe diagnostics and a generic recovery message", () => {
    expect(source).toContain('const AUTH_RECOVERY_MESSAGE = "We could not complete sign-in. Please return to Settings and try again."');
    expect(source).toContain("safeDiagnosticError(event, error)");
    expect(source).toContain('failSafely("oauth.callback_denied")');
    expect(source).toContain('failSafely("oauth.callback_missing_credentials")');
    expect(source).toContain('failSafely("oauth.callback_failed", error)');
    expect(source).toContain("setErrorMessage(AUTH_RECOVERY_MESSAGE)");
    expect(source).not.toContain("console.log");
    expect(source).not.toContain("console.warn");
    expect(source).not.toContain("console.error");
    expect(source).not.toContain("error.message");
  });
});
