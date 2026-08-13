import { and, asc, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { attachmentAssets, InsertUser, syncedEntities, syncChanges, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export type CloudSyncEntityType = "vehicle" | "fuel" | "service" | "repair" | "reminder" | "attachment";
export type CloudSyncMutation = {
  entityType: CloudSyncEntityType;
  entityId: string;
  operation: "upsert" | "delete";
  updatedAt: string;
  deletedAt: string | null;
  payload: Record<string, unknown>;
};

function parsePayload(payload: string): Record<string, unknown> {
  try {
    const value = JSON.parse(payload) as unknown;
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

/** Applies newer remote mutations only. Equal versions are an intentional idempotent no-op. */
export async function pushSyncMutations(userId: number, mutations: readonly CloudSyncMutation[]) {
  const db = await getDb();
  if (!db) throw new Error("Cloud sync is temporarily unavailable");

  const accepted: Array<{ entityType: CloudSyncEntityType; entityId: string }> = [];
  const conflicts: Array<{ entityType: CloudSyncEntityType; entityId: string; remote: CloudSyncMutation }> = [];

  for (const mutation of mutations) {
    const current = await db.select().from(syncedEntities).where(and(
      eq(syncedEntities.userId, userId),
      eq(syncedEntities.entityType, mutation.entityType),
      eq(syncedEntities.entityId, mutation.entityId),
    )).limit(1);
    const existing = current[0];

    if (existing && existing.updatedAt > mutation.updatedAt) {
      conflicts.push({
        entityType: mutation.entityType,
        entityId: mutation.entityId,
        remote: {
          entityType: existing.entityType as CloudSyncEntityType,
          entityId: existing.entityId,
          operation: existing.deletedAt ? "delete" : "upsert",
          updatedAt: existing.updatedAt,
          deletedAt: existing.deletedAt,
          payload: parsePayload(existing.payload),
        },
      });
      continue;
    }
    if (existing && existing.updatedAt === mutation.updatedAt) {
      accepted.push({ entityType: mutation.entityType, entityId: mutation.entityId });
      continue;
    }

    const serialized = JSON.stringify(mutation.payload);
    if (existing) {
      await db.update(syncedEntities).set({
        payload: serialized,
        updatedAt: mutation.updatedAt,
        deletedAt: mutation.deletedAt,
        revision: existing.revision + 1,
      }).where(eq(syncedEntities.id, existing.id));
    } else {
      await db.insert(syncedEntities).values({
        userId,
        entityType: mutation.entityType,
        entityId: mutation.entityId,
        payload: serialized,
        updatedAt: mutation.updatedAt,
        deletedAt: mutation.deletedAt,
      });
    }
    await db.insert(syncChanges).values({
      userId,
      entityType: mutation.entityType,
      entityId: mutation.entityId,
      operation: mutation.deletedAt || mutation.operation === "delete" ? "delete" : "upsert",
      payload: serialized,
    });
    accepted.push({ entityType: mutation.entityType, entityId: mutation.entityId });
  }

  return { accepted, conflicts };
}

export async function pullSyncChanges(userId: number, cursor: number, limit: number) {
  const db = await getDb();
  if (!db) throw new Error("Cloud sync is temporarily unavailable");
  const rows = await db.select().from(syncChanges).where(and(
    eq(syncChanges.userId, userId),
    gt(syncChanges.id, cursor),
  )).orderBy(asc(syncChanges.id)).limit(limit);
  const changes = rows.map((row) => ({
    cursor: row.id,
    entityType: row.entityType as CloudSyncEntityType,
    entityId: row.entityId,
    operation: row.operation,
    payload: parsePayload(row.payload),
  }));
  return { cursor: changes.at(-1)?.cursor ?? cursor, changes };
}

export async function createAttachmentAsset(input: {
  userId: number;
  attachmentId: string;
  recordType: string;
  recordId: string;
  objectKey: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Cloud attachments are temporarily unavailable");
  const existing = await db.select().from(attachmentAssets).where(and(
    eq(attachmentAssets.userId, input.userId),
    eq(attachmentAssets.attachmentId, input.attachmentId),
  )).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(attachmentAssets).values({ ...input, uploadStatus: "pending" });
  const created = await db.select().from(attachmentAssets).where(and(
    eq(attachmentAssets.userId, input.userId),
    eq(attachmentAssets.attachmentId, input.attachmentId),
  )).limit(1);
  return created[0]!;
}

export async function getAttachmentAsset(userId: number, attachmentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Cloud attachments are temporarily unavailable");
  const rows = await db.select().from(attachmentAssets).where(and(
    eq(attachmentAssets.userId, userId),
    eq(attachmentAssets.attachmentId, attachmentId),
  )).limit(1);
  return rows[0];
}

export async function markAttachmentUploaded(userId: number, attachmentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Cloud attachments are temporarily unavailable");
  await db.update(attachmentAssets).set({ uploadStatus: "uploaded" }).where(and(
    eq(attachmentAssets.userId, userId),
    eq(attachmentAssets.attachmentId, attachmentId),
  ));
}
