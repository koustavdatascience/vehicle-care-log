import { describe, expect, it } from "vitest";

import { validateCustomCsvDateRange } from "../../src/export/date-range";

describe("validateCustomCsvDateRange", () => {
  it("preserves inclusive, fully specified calendar boundaries", () => {
    expect(validateCustomCsvDateRange({ startOn: "2026-03-01", endOn: "2026-03-31" })).toEqual({ ok: true, range: { startOn: "2026-03-01", endOn: "2026-03-31" }, startError: undefined, endError: undefined });
  });

  it("supports open-ended start-only, end-only, and all-history custom ranges", () => {
    expect(validateCustomCsvDateRange({ startOn: "2026-03-01", endOn: null }).range).toEqual({ startOn: "2026-03-01", endOn: null });
    expect(validateCustomCsvDateRange({ startOn: null, endOn: "2026-03-31" }).range).toEqual({ startOn: null, endOn: "2026-03-31" });
    expect(validateCustomCsvDateRange({ startOn: null, endOn: null }).range).toEqual({ startOn: null, endOn: null });
  });

  it("rejects impossible calendar dates rather than allowing JavaScript date rollover", () => {
    expect(validateCustomCsvDateRange({ startOn: "2026-02-30", endOn: null })).toMatchObject({ ok: false, startError: "Choose a valid start date.", range: null });
    expect(validateCustomCsvDateRange({ startOn: null, endOn: "2026-13-01" })).toMatchObject({ ok: false, endError: "Choose a valid end date.", range: null });
  });

  it("rejects an end boundary that is earlier than the start boundary", () => {
    expect(validateCustomCsvDateRange({ startOn: "2026-04-01", endOn: "2026-03-31" })).toMatchObject({ ok: false, endError: "The end date cannot be before the start date.", range: null });
  });
});
