import type { SqlDatabase } from "./database-contract";
import { LocalStorageError } from "./database-contract";

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const LOCAL_SCHEMA_VERSION = 1;

export const migrations: readonly Migration[] = [
  {
    version: 1,
    name: "initial-local-first-domain-schema",
    sql: `
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY NOT NULL,
        nickname TEXT NOT NULL,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        fuel_type TEXT NOT NULL,
        registration_label TEXT,
        current_odometer_km INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        deleted_at TEXT,
        sync_state TEXT NOT NULL DEFAULT 'local'
      );
      CREATE TABLE IF NOT EXISTS fuel_entries (
        id TEXT PRIMARY KEY NOT NULL,
        vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
        occurred_on TEXT NOT NULL,
        odometer_km INTEGER NOT NULL,
        quantity_millilitres INTEGER NOT NULL,
        total_cost_minor INTEGER NOT NULL,
        currency TEXT NOT NULL,
        station TEXT,
        note TEXT,
        duplicate_fingerprint TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_state TEXT NOT NULL DEFAULT 'local'
      );
      CREATE TABLE IF NOT EXISTS service_records (
        id TEXT PRIMARY KEY NOT NULL,
        vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
        category TEXT NOT NULL,
        occurred_on TEXT NOT NULL,
        odometer_km INTEGER NOT NULL,
        provider TEXT,
        total_cost_minor INTEGER,
        currency TEXT,
        note TEXT,
        next_due_on TEXT,
        next_due_odometer_km INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_state TEXT NOT NULL DEFAULT 'local'
      );
      CREATE TABLE IF NOT EXISTS repair_records (
        id TEXT PRIMARY KEY NOT NULL,
        vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
        issue TEXT NOT NULL,
        work_performed TEXT,
        occurred_on TEXT NOT NULL,
        odometer_km INTEGER NOT NULL,
        provider TEXT,
        total_cost_minor INTEGER,
        currency TEXT,
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_state TEXT NOT NULL DEFAULT 'local'
      );
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY NOT NULL,
        vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
        title TEXT NOT NULL,
        due_on TEXT,
        due_odometer_km INTEGER,
        completed_at TEXT,
        snoozed_until TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_state TEXT NOT NULL DEFAULT 'local'
      );
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY NOT NULL,
        record_type TEXT NOT NULL,
        record_id TEXT NOT NULL,
        local_uri TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_state TEXT NOT NULL DEFAULT 'local'
      );
      CREATE TABLE IF NOT EXISTS expense_projections (
        id TEXT PRIMARY KEY NOT NULL,
        vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        occurred_on TEXT NOT NULL,
        category TEXT NOT NULL,
        total_cost_minor INTEGER NOT NULL,
        currency TEXT NOT NULL,
        deleted_at TEXT
      );
      CREATE TABLE IF NOT EXISTS sync_metadata (
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (entity_type, entity_id)
      );
      CREATE INDEX IF NOT EXISTS idx_vehicles_active ON vehicles(deleted_at, archived_at);
      CREATE INDEX IF NOT EXISTS idx_fuel_vehicle_date ON fuel_entries(vehicle_id, occurred_on DESC) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_service_vehicle_date ON service_records(vehicle_id, occurred_on DESC) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_repair_vehicle_date ON repair_records(vehicle_id, occurred_on DESC) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(vehicle_id, due_on) WHERE deleted_at IS NULL AND completed_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_date ON expense_projections(vehicle_id, occurred_on DESC) WHERE deleted_at IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_fuel_dedup_active ON fuel_entries(duplicate_fingerprint) WHERE deleted_at IS NULL;
    `,
  },
];

export async function migrateDatabase(database: SqlDatabase): Promise<number> {
  try {
    const versionRow = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    let version = versionRow?.user_version ?? 0;
    for (const migration of migrations.filter((item) => item.version > version)) {
      await database.withTransactionAsync(async () => {
        await database.execAsync(migration.sql);
        await database.execAsync(`PRAGMA user_version = ${migration.version}`);
      });
      version = migration.version;
    }
    return version;
  } catch (error) {
    throw new LocalStorageError("migration-failed", "Vehicle Care Log could not prepare local storage.", error);
  }
}
