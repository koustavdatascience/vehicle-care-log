import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "scripts/load-env.js"), "utf8");

describe("public environment privacy contract", () => {
  it("maps only app and OAuth endpoint metadata to Expo public variables", () => {
    expect(source).toContain('VITE_APP_ID: "EXPO_PUBLIC_APP_ID"');
    expect(source).toContain('VITE_OAUTH_PORTAL_URL: "EXPO_PUBLIC_OAUTH_PORTAL_URL"');
    expect(source).toContain('OAUTH_SERVER_URL: "EXPO_PUBLIC_OAUTH_SERVER_URL"');
    expect(source).not.toContain("EXPO_PUBLIC_OWNER");
    expect(source).not.toContain("OWNER_OPEN_ID");
    expect(source).not.toContain("OWNER_NAME");
  });
});
