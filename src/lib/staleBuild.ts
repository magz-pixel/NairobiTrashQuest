/**
 * After a deploy, a tab (or the installed app) still running the previous build can ask for
 * code files that no longer exist ("Failed to fetch dynamically imported module"). The fix is
 * to load the new build — so reload once, automatically, instead of showing an error screen.
 */
const KEY = 'rt:stale-reload-at'

export function isStaleBuildError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '')
  return /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|error loading dynamically imported|ChunkLoadError|Loading chunk .* failed/i.test(
    msg,
  )
}

/** Reloads at most once per minute, so a genuinely missing file can't cause a reload loop. Returns true if reloading. */
export function reloadForNewBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0)
    if (Date.now() - last < 60_000) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    /* storage blocked: still try once */
  }
  window.location.reload()
  return true
}
