import type { SqlDatabase } from "./database-contract";
import { LocalStorageError } from "./database-contract";

export type DatabaseOpener = () => Promise<SqlDatabase>;
export type DatabaseInitializer = (database: SqlDatabase) => Promise<void>;

export interface DatabaseSession {
  get(): Promise<SqlDatabase>;
  reset(): void;
}

/**
 * Owns the singleton local database lifecycle. The session clears a failed
 * promise so a user-initiated retry can recover after transient storage errors.
 */
export function createDatabaseSession(open: DatabaseOpener, initialize: DatabaseInitializer): DatabaseSession {
  let databasePromise: Promise<SqlDatabase> | null = null;

  return {
    get() {
      if (!databasePromise) {
        databasePromise = open()
          .then(async (database) => {
            await initialize(database);
            return database;
          })
          .catch((error) => {
            databasePromise = null;
            if (error instanceof LocalStorageError) throw error;
            throw new LocalStorageError("storage-unavailable", "Local storage is unavailable. Your changes were not saved.", error);
          });
      }
      return databasePromise;
    },
    reset() {
      databasePromise = null;
    },
  };
}
