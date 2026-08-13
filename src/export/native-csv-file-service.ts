import type { CsvExportResult } from "./contracts";

export type CsvShareOutcome =
  | { status: "shared"; rowCount: number }
  | { status: "empty" }
  | { status: "unavailable" }
  | { status: "failed" };

export interface CsvFileWriter {
  cacheDirectory: string | null;
  writeAsStringAsync(uri: string, contents: string, options: { encoding: "utf8" }): Promise<void>;
}

export interface CsvNativeSharing {
  isAvailableAsync(): Promise<boolean>;
  shareAsync(uri: string, options: { dialogTitle: string; mimeType: string; UTI: string }): Promise<void>;
}

/** Uses the cache for a disposable, local-only report and opens the native share sheet. */
export class NativeCsvFileService {
  constructor(
    private readonly fileWriter: CsvFileWriter,
    private readonly sharing: CsvNativeSharing,
    private readonly platform: string,
  ) {}

  async share(result: CsvExportResult): Promise<CsvShareOutcome> {
    if (result.status === "empty") return { status: "empty" };
    if (this.platform === "web" || !this.fileWriter.cacheDirectory || !(await this.sharing.isAvailableAsync())) {
      return { status: "unavailable" };
    }

    try {
      const uri = `${this.fileWriter.cacheDirectory}${result.fileName}`;
      await this.fileWriter.writeAsStringAsync(uri, result.csv, { encoding: "utf8" });
      await this.sharing.shareAsync(uri, {
        dialogTitle: "Export vehicle care report",
        mimeType: "text/csv",
        UTI: "public.comma-separated-values-text",
      });
      return { status: "shared", rowCount: result.rowCount };
    } catch {
      // File paths and native share errors can contain personal information.
      // The caller receives only a bounded recovery state.
      return { status: "failed" };
    }
  }
}
