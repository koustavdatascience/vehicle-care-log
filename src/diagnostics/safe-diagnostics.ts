const SENSITIVE_KEY = /token|authorization|cookie|password|secret|email|name|note|vehicle|attachment|uri|url|body|payload|code|state|account|user/i;

export type DiagnosticAttributes = Readonly<Record<string, boolean | number | string | null | undefined>>;

/**
 * Retains only operational metadata suitable for local debugging. Domain data,
 * account identifiers, URLs, credentials, free text, and attachment details are
 * deliberately redacted before anything reaches a console or future telemetry sink.
 */
export function sanitizeDiagnosticAttributes(attributes: DiagnosticAttributes): Record<string, boolean | number | string | null> {
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [key, SENSITIVE_KEY.test(key) ? "[redacted]" : value ?? null]),
  );
}

export function safeDiagnostic(event: string, attributes: DiagnosticAttributes = {}): void {
  if (!__DEV__) return;
  console.info(`[VCL:${event}]`, sanitizeDiagnosticAttributes(attributes));
}

export function safeDiagnosticError(event: string, error: unknown, attributes: DiagnosticAttributes = {}): void {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  safeDiagnostic(event, { ...attributes, errorName });
}
