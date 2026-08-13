import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { createTRPCClient } from "@/lib/trpc";
import { recordSafeAnalytics } from "@/src/diagnostics/safe-analytics";
import { safeDiagnostic, safeDiagnosticError } from "@/src/diagnostics/safe-diagnostics";
import type { AccountLinkDecision, SyncAccountState, SyncEnvelope } from "@/src/domain/models";
import { LocalSyncRepository } from "@/src/sync/local-sync-repository";
import { useLocalDatabase } from "./local-storage-provider";

type SyncStatus = "local-only" | "ready" | "syncing" | "offline" | "conflict" | "error";

type SyncContextValue = {
  account: SyncAccountState;
  status: SyncStatus;
  message: string | null;
  syncNow: (decision?: Exclude<AccountLinkDecision, "postpone">) => Promise<void>;
  setLocalOnly: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

function remoteEnvelope(change: { entityType: SyncEnvelope["entityType"]; entityId: string; operation: "upsert" | "delete"; payload: Record<string, unknown> }): SyncEnvelope {
  const updatedAt = typeof change.payload.updated_at === "string" ? change.payload.updated_at : new Date().toISOString();
  const deletedAt = typeof change.payload.deleted_at === "string" ? change.payload.deleted_at : null;
  return { ...change, updatedAt, deletedAt };
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const database = useLocalDatabase();
  const { user } = useAuth();
  const repository = useMemo(() => new LocalSyncRepository(database), [database]);
  const client = useMemo(() => createTRPCClient(), []);
  const [account, setAccount] = useState<SyncAccountState>({ accountId: null, linkDecision: null, pullCursor: 0, lastSyncAt: null, lastError: null });
  const [status, setStatus] = useState<SyncStatus>("local-only");
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const state = await repository.getAccountState();
    setAccount(state);
    setStatus(state.accountId ? (state.lastError ? "offline" : "ready") : "local-only");
  }, [repository]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setLocalOnly = useCallback(async () => {
    await repository.clearAccount();
    setAccount(await repository.getAccountState());
    setStatus("local-only");
    setMessage("Your care log remains safely on this device. You can link an account later.");
  }, [repository]);

  const syncNow = useCallback(async (decision?: Exclude<AccountLinkDecision, "postpone">) => {
    if (!user) {
      setStatus("local-only");
      setMessage("Link an account before turning on backup and sync. Your local records are still available.");
      return;
    }
    const state = await repository.getAccountState();
    const linkDecision = decision ?? state.linkDecision;
    if (!linkDecision || linkDecision === "postpone") {
      setStatus("local-only");
      setMessage("Choose whether to upload this device’s records or download the account copy before syncing.");
      return;
    }
    await repository.linkAccount(String(user.id), linkDecision);
    setAccount(await repository.getAccountState());
    setStatus("syncing");
    setMessage(null);
    recordSafeAnalytics("sync_started", { decision: linkDecision });

    try {
      if (linkDecision === "upload-device") {
        await repository.stagePendingRecords();
        const outgoing = await repository.listDueOutbox();
        if (outgoing.length) {
          const result = await client.sync.push.mutate({ changes: outgoing });
          safeDiagnostic("sync.push_conflicts", { conflictCount: result.conflicts.length });
          for (const accepted of result.accepted) await repository.acknowledge(accepted.entityType, accepted.entityId);
          for (const conflict of result.conflicts) {
            const local = outgoing.find((item) => item.entityType === conflict.entityType && item.entityId === conflict.entityId);
            if (local) await repository.recordConflict(local, conflict.remote);
          }
        }
      }

      const afterPush = await repository.getAccountState();
      const pulled = await client.sync.pull.query({ cursor: afterPush.pullCursor, limit: 100 });
      let hasConflict = false;
      for (const change of pulled.changes) {
        const result = await repository.applyRemote(remoteEnvelope(change));
        hasConflict ||= result === "conflict";
      }
      await repository.finishPull(pulled.cursor);
      setAccount(await repository.getAccountState());
      setStatus(hasConflict ? "conflict" : "ready");
      setMessage(hasConflict ? "A newer version exists on another device. Local conflicts were preserved for review." : "Backup is up to date.");
      recordSafeAnalytics("sync_completed", { hadConflict: hasConflict });
    } catch (error) {
      safeDiagnosticError("sync.failed", error, { hasAccount: true });
      await repository.deferFailure();
      setAccount(await repository.getAccountState());
      setStatus("offline");
      setMessage("Backup could not reach the service. Your local records remain available. Try again when connected.");
      recordSafeAnalytics("sync_failed", { hasAccount: true });
    }
  }, [client.sync.pull, client.sync.push, repository, user]);

  const value = useMemo<SyncContextValue>(() => ({ account, status, message, syncNow, setLocalOnly, refresh }), [account, status, message, syncNow, setLocalOnly, refresh]);
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) throw new Error("useSync must be used within SyncProvider.");
  return context;
}
