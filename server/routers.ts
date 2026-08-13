import { COOKIE_NAME } from "../shared/const.js";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as database from "./db";
import { storageGetSignedUrl, storageGetUploadSignedUrl } from "./storage";

const syncEntityType = z.enum(["vehicle", "fuel", "service", "repair", "reminder", "attachment"]);
const syncMutation = z.object({
  entityType: syncEntityType,
  entityId: z.string().min(1).max(128),
  operation: z.enum(["upsert", "delete"]),
  updatedAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  deletedAt: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable(),
  payload: z.record(z.string(), z.unknown()),
});
const attachmentMetadata = z.object({
  attachmentId: z.string().min(1).max(128),
  recordType: z.enum(["fuel", "service", "repair"]),
  recordId: z.string().min(1).max(128),
  fileName: z.string().min(1).max(160),
  mimeType: z.string().min(1).max(128),
  byteSize: z.number().int().positive().max(20 * 1024 * 1024),
});

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160) || "attachment";
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  sync: router({
    /** Applies a bounded batch. An equal version is a successful idempotent no-op. */
    push: protectedProcedure.input(z.object({ changes: z.array(syncMutation).min(1).max(50) }))
      .mutation(({ ctx, input }) => database.pushSyncMutations(ctx.user.id, input.changes)),
    /** Pulls only authenticated-owner changes after the last durable cursor. */
    pull: protectedProcedure.input(z.object({
      cursor: z.number().int().min(0).default(0),
      limit: z.number().int().min(1).max(200).default(100),
    }))
      .query(({ ctx, input }) => database.pullSyncChanges(ctx.user.id, input.cursor, input.limit)),
  }),
  attachments: router({
    createUploadIntent: protectedProcedure.input(attachmentMetadata).mutation(async ({ ctx, input }) => {
      const objectKey = `vehicle-care-log/${ctx.user.id}/attachments/${input.attachmentId}/${safeFileName(input.fileName)}`;
      const asset = await database.createAttachmentAsset({ ...input, userId: ctx.user.id, objectKey });
      return { objectKey: asset.objectKey, uploadUrl: await storageGetUploadSignedUrl(asset.objectKey) };
    }),
    completeUpload: protectedProcedure.input(z.object({ attachmentId: z.string().min(1).max(128) }))
      .mutation(({ ctx, input }) => database.markAttachmentUploaded(ctx.user.id, input.attachmentId)),
    getDownloadUrl: protectedProcedure.input(z.object({ attachmentId: z.string().min(1).max(128) }))
      .query(async ({ ctx, input }) => {
        const asset = await database.getAttachmentAsset(ctx.user.id, input.attachmentId);
        if (!asset || asset.deletedAt || asset.uploadStatus !== "uploaded") {
          throw new Error("Attachment is unavailable");
        }
        return { downloadUrl: await storageGetSignedUrl(asset.objectKey), fileName: asset.fileName, mimeType: asset.mimeType };
      }),
  }),
});

export type AppRouter = typeof appRouter;
