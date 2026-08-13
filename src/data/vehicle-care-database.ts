import * as SQLite from "expo-sqlite";

import type { SqlDatabase } from "./database-contract";
import { createDatabaseSession } from "./database-session";
import { migrateDatabase } from "./migrations";

const databaseSession = createDatabaseSession(
  () => SQLite.openDatabaseAsync("vehicle-care-log.db") as unknown as Promise<SqlDatabase>,
  async (database) => {
    await database.execAsync("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    await migrateDatabase(database);
  },
);

export async function getVehicleCareDatabase(): Promise<SqlDatabase> {
  return databaseSession.get();
}

export function resetDatabaseForTests(): void {
  databaseSession.reset();
}
