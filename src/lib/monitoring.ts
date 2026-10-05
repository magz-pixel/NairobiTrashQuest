/**
 * Sentry stays off until VITE_SENTRY_DSN is set. The SDK loads only then,
 * so the main bundle does not carry it for visitors.
 */
export function initMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (typeof dsn !== 'string' || !dsn.startsWith('http')) return
  void import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({ dsn, tracesSampleRate: 0 })
    })
    .catch(() => {})
}
