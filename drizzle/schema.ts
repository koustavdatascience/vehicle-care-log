import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Owner-scoped canonical records used only for optional cross-device sync. */
export const syncedEntities = mysqlTable("synced_entities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  entityType: varchar("entityType", { length: 32 }).notNull(),
  entityId: varchar("entityId", { length: 128 }).notNull(),
  payload: text("payload").notNull(),
  updatedAt: varchar("updatedAt", { length: 40 }).notNull(),
  deletedAt: varchar("deletedAt", { length: 40 }),
  revision: int("revision").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("synced_entities_owner_entity_unique").on(table.userId, table.entityType, table.entityId),
  index("synced_entities_owner_updated").on(table.userId, table.updatedAt),
]);

/** Monotonic, owner-scoped pull cursor log. Payload contains the canonical current envelope. */
export const syncChanges = mysqlTable("sync_changes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  entityType: varchar("entityType", { length: 32 }).notNull(),
  entityId: varchar("entityId", { length: 128 }).notNull(),
  operation: mysqlEnum("operation", ["upsert", "delete"]).notNull(),
  payload: text("payload").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("sync_changes_owner_cursor").on(table.userId, table.id),
]);

/** Metadata only; binary attachment content stays in protected object storage. */
export const attachmentAssets = mysqlTable("attachment_assets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  attachmentId: varchar("attachmentId", { length: 128 }).notNull(),
  recordType: varchar("recordType", { length: 32 }).notNull(),
  recordId: varchar("recordId", { length: 128 }).notNull(),
  objectKey: varchar("objectKey", { length: 512 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  byteSize: int("byteSize").notNull(),
  uploadStatus: mysqlEnum("uploadStatus", ["pending", "uploaded", "failed"]).notNull().default("pending"),
  deletedAt: varchar("deletedAt", { length: 40 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("attachment_assets_owner_attachment_unique").on(table.userId, table.attachmentId),
  index("attachment_assets_owner_record").on(table.userId, table.recordType, table.recordId),
]);

export type SyncedEntity = typeof syncedEntities.$inferSelect;
export type AttachmentAsset = typeof attachmentAssets.$inferSelect;
