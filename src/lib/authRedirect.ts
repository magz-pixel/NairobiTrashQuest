/**
 * Stable post-auth redirect — avoids stale preview deployment URLs in magic links.
 * Prefer VITE_SITE_URL in production; fall back to current origin + path.
 */
export function getAuthRedirectUrl(): string {
  const path = `${window.location.pathname}${window.location.search}`
  const configured = import.meta.env.VITE_SITE_URL
  if (configured?.trim()) {
    return `${configured.replace(/\/$/, '')}${path}`
  }
  return `${window.location.origin}${path}`
}
