import { safeDiagnostic, type DiagnosticAttributes } from "./safe-diagnostics";

/**
 * Product events intentionally exclude names, identifiers, notes, attachments,
 * tokens, URLs, and record payloads. The current sink is development-only; a
 * future telemetry integration must preserve this contract.
 */
export type SafeAnalyticsEvent =
  | "sync_started"
  | "sync_completed"
  | "sync_failed"
  | "backup_exported"
  | "backup_export_failed"
  | "recovery_retried";

export function recordSafeAnalytics(event: SafeAnalyticsEvent, attributes: DiagnosticAttributes = {}): void {
  safeDiagnostic(`analytics.${event}`, attributes);
}
