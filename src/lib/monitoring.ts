/**
 * Sentry stays off until VITE_SENTRY_DSN is set. The SDK loads only then,
 * so the main bundle does not carry it for visitors.
 */
function sentryEnabled(): boolean {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  return typeof dsn === 'string' && dsn.startsWith('http')
}

export function initMonitoring(): void {
  if (!sentryEnabled()) return
  const dsn = import.meta.env.VITE_SENTRY_DSN
  void import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({ dsn, tracesSampleRate: 0 })
    })
    .catch(() => {})
}

/** Report a client-side failure when Sentry is configured. No-op otherwise. */
export function reportClientError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!sentryEnabled()) return
  const exception = error instanceof Error ? error : new Error(String(error))
  void import('@sentry/react')
    .then((Sentry) => {
      Sentry.captureException(exception, context ? { extra: context } : undefined)
    })
    .catch(() => {})
}
