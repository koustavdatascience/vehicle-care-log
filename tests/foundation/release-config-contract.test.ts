import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const easConfig = JSON.parse(readFileSync(resolve(process.cwd(), "eas.json"), "utf8"));
const appConfig = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");
const oauthConfig = readFileSync(resolve(process.cwd(), "constants/oauth.ts"), "utf8");

describe("Phase 10 release configuration contract", () => {
  it("defines separated development, staging, pilot, and production build profiles", () => {
    expect(Object.keys(easConfig.build)).toEqual(["development", "staging", "pilot", "production"]);
    expect(easConfig.build.development.developmentClient).toBe(true);
    expect(easConfig.build.staging.distribution).toBe("internal");
    expect(easConfig.build.pilot.distribution).toBe("internal");
    expect(easConfig.build.production.autoIncrement).toBe(true);
  });

  it("pins the native identifiers, versioning, local notification metadata, and branded deep-link scheme", () => {
    expect(appConfig).toContain('const rawBundleId = "com.app.vehiclecarelogapp"');
    expect(appConfig).toContain('const DEEP_LINK_SCHEME = "vehiclecarelog"');
    expect(appConfig).toContain('runtimeVersion: { policy: "appVersion" }');
    expect(appConfig).toContain('buildNumber: "1"');
    expect(appConfig).toContain("versionCode: 1");
    expect(appConfig).toContain('permissions: ["POST_NOTIFICATIONS", "SCHEDULE_EXACT_ALARM"]');
    expect(appConfig).toContain('"defaultChannel": "vehicle-care-reminders"');
    expect(appConfig).toContain('"enableBackgroundRemoteNotifications": false');
    expect(oauthConfig).toContain('const DEEP_LINK_SCHEME = "vehiclecarelog"');
  });

  it("keeps all public build profile environments explicit and never places credentials in the file", () => {
    for (const profile of Object.values(easConfig.build) as Array<{ env?: Record<string, string> }>) {
      expect(profile.env?.EXPO_PUBLIC_APP_ENV).toMatch(/^(development|staging|pilot|production)$/);
    }
    expect(JSON.stringify(easConfig)).not.toMatch(/token|secret|password|privateKey/i);
  });
});
