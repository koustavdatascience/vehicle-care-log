export interface SqlRunResult {
  lastInsertRowId: number;
  changes: number;
}

export interface SqlDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...parameters: unknown[]): Promise<SqlRunResult>;
  getFirstAsync<T>(source: string, ...parameters: unknown[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...parameters: unknown[]): Promise<T[]>;
  withTransactionAsync<T>(task: () => Promise<T>): Promise<T>;
}

export class LocalStorageError extends Error {
  readonly code: "storage-unavailable" | "migration-failed" | "write-failed";

  constructor(code: LocalStorageError["code"], message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "LocalStorageError";
    this.code = code;
  }
}
