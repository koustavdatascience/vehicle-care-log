import { describe, expect, it } from "vitest";

import type { SqlDatabase } from "../../src/data/database-contract";
import { LocalStorageError } from "../../src/data/database-contract";
import { createDatabaseSession } from "../../src/data/database-session";

const database = {
  execAsync: async () => undefined,
  runAsync: async () => ({ lastInsertRowId: 0, changes: 0 }),
  getFirstAsync: async () => null,
  getAllAsync: async () => [],
  withTransactionAsync: async <T>(task: () => Promise<T>) => task(),
} as SqlDatabase;

describe("Phase 4 database session", () => {
  it("shares one initialized database across repeated app-start requests", async () => {
    let opens = 0;
    let initializations = 0;
    const session = createDatabaseSession(
      async () => { opens += 1; return database; },
      async () => { initializations += 1; },
    );

    await expect(Promise.all([session.get(), session.get()])).resolves.toEqual([database, database]);
    expect(opens).toBe(1);
    expect(initializations).toBe(1);
  });

  it("clears a failed storage promise so a retry can recover", async () => {
    let attempts = 0;
    const session = createDatabaseSession(
      async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("storage unavailable");
        return database;
      },
      async () => undefined,
    );

    await expect(session.get()).rejects.toBeInstanceOf(LocalStorageError);
    await expect(session.get()).resolves.toBe(database);
    expect(attempts).toBe(2);
  });
});
