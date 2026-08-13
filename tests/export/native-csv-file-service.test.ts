import { describe, expect, it, vi } from "vitest";

import { NativeCsvFileService } from "../../src/export/native-csv-file-service";

const ready = { status: "ready" as const, fileName: "vehicle-care-log-export-2026-03-03.csv", csv: "header\r\n", rowCount: 1 };

describe("NativeCsvFileService", () => {
  it("writes a disposable cached file then opens the native CSV share sheet", async () => {
    const writeAsStringAsync = vi.fn().mockResolvedValue(undefined);
    const deleteAsync = vi.fn().mockResolvedValue(undefined);
    const shareAsync = vi.fn().mockResolvedValue(undefined);
    const service = new NativeCsvFileService({ cacheDirectory: "file:///cache/", writeAsStringAsync, deleteAsync }, { isAvailableAsync: vi.fn().mockResolvedValue(true), shareAsync }, "android");
    await expect(service.share(ready)).resolves.toEqual({ status: "shared", rowCount: 1 });
    expect(writeAsStringAsync).toHaveBeenCalledWith("file:///cache/vehicle-care-log-export-2026-03-03.csv", "header\r\n", { encoding: "utf8" });
    expect(shareAsync).toHaveBeenCalledWith("file:///cache/vehicle-care-log-export-2026-03-03.csv", expect.objectContaining({ mimeType: "text/csv" }));
    expect(deleteAsync).not.toHaveBeenCalled();
  });

  it("reports empty, unavailable, and write failures without exposing native details", async () => {
    const unavailable = new NativeCsvFileService({ cacheDirectory: null, writeAsStringAsync: vi.fn() }, { isAvailableAsync: vi.fn(), shareAsync: vi.fn() }, "android");
    await expect(unavailable.share({ status: "empty", rowCount: 0 })).resolves.toEqual({ status: "empty" });
    await expect(unavailable.share(ready)).resolves.toEqual({ status: "unavailable" });
    const deleteAsync = vi.fn().mockResolvedValue(undefined);
    const broken = new NativeCsvFileService({ cacheDirectory: "file:///cache/", writeAsStringAsync: vi.fn().mockResolvedValue(undefined), deleteAsync }, { isAvailableAsync: vi.fn().mockResolvedValue(true), shareAsync: vi.fn().mockRejectedValue(new Error("private path")) }, "ios");
    await expect(broken.share(ready)).resolves.toEqual({ status: "failed" });
    expect(deleteAsync).toHaveBeenCalledWith("file:///cache/vehicle-care-log-export-2026-03-03.csv", { idempotent: true });
  });

  it("keeps the recovery result bounded when partial-file cleanup itself fails", async () => {
    const service = new NativeCsvFileService(
      { cacheDirectory: "file:///cache/", writeAsStringAsync: vi.fn().mockRejectedValue(new Error("private file path")), deleteAsync: vi.fn().mockRejectedValue(new Error("cleanup path")) },
      { isAvailableAsync: vi.fn().mockResolvedValue(true), shareAsync: vi.fn() },
      "android",
    );
    await expect(service.share(ready)).resolves.toEqual({ status: "failed" });
  });
});
