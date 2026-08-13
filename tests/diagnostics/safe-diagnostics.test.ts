import { describe, expect, it } from "vitest";

import { sanitizeDiagnosticAttributes } from "../../src/diagnostics/safe-diagnostics";

describe("safe diagnostics", () => {
  it("keeps operational signals while redacting account, location, free-text, and credential fields", () => {
    expect(sanitizeDiagnosticAttributes({
      status: 503,
      retry: true,
      token: "secret-token",
      endpoint: "/records/123",
      attachmentUri: "file:///private/receipt.jpg",
      note: "Garage payment details",
      email: "driver@example.test",
    })).toEqual({
      status: 503,
      retry: true,
      token: "[redacted]",
      endpoint: "/records/123",
      attachmentUri: "[redacted]",
      note: "[redacted]",
      email: "[redacted]",
    });
  });

  it("redacts sensitive key names regardless of case and preserves null operational values", () => {
    expect(sanitizeDiagnosticAttributes({ Authorization: "Bearer x", Cookie: "session=x", attempt: null })).toEqual({
      Authorization: "[redacted]",
      Cookie: "[redacted]",
      attempt: null,
    });
  });
});
