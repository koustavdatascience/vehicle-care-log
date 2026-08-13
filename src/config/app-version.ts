/**
 * Formats a release identifier for read-only display in Settings.
 * It accepts runtime Expo metadata because that value may be unavailable in
 * development clients or incomplete native build metadata.
 */
export function formatInstalledAppVersion(version: string | null | undefined): string {
  const normalized = version?.trim();
  return normalized ? `Version ${normalized}` : "Version unavailable";
}
