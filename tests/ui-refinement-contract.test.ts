import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("UI refinement contract", () => {
  it("keeps vehicle management in one vertically scrolling FlatList with all controls in its header", () => {
    const settings = source("app/(tabs)/settings.tsx");
    expect((settings.match(/<FlatList/g) ?? [])).toHaveLength(1);
    expect(settings).toContain("ListHeaderComponent={header}");
    expect(settings).toContain("showsVerticalScrollIndicator={false}");
    expect(settings).toContain("<Text accessibilityRole=\"header\" style={[styles.sectionTitle");
  });

  it("keeps the primary dashboard and garage language local-first without a linked backup account control", () => {
    const home = source("app/(tabs)/index.tsx");
    const settings = source("app/(tabs)/settings.tsx");
    expect(home).toContain("Your records stay on this device");
    expect(settings).not.toMatch(/linked backup|link backup|connect account|backup account/i);
  });

  it("uses a short app-shell reveal that disables animation for reduced-motion users", () => {
    const shell = source("components/foundation/app-opening-transition.tsx");
    const layout = source("app/_layout.tsx");
    expect(shell).toContain("useReducedMotion");
    expect(shell).toContain("reducedMotion ? 1");
    expect(shell).toContain("duration: 260");
    expect(shell).toContain("translateY: (1 - progress.value) * 8");
    expect(layout).toContain("<AppOpeningTransition>");
  });
});
