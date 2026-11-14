import { useEffect, useState } from 'react'
import { flushQueue, listQueued, onQueueChange } from '../../lib/offlineQueue'

/**
 * Shows reports saved on this phone while offline, and sends them as soon as there's signal
 * (on load, when the connection comes back, and every minute while any are waiting).
 */
export function OfflineQueueBanner() {
  const [waiting, setWaiting] = useState(0)
  const [justSent, setJustSent] = useState(0)

  useEffect(() => {
    let cancelled = false
    const refresh = () => void listQueued().then((q) => !cancelled && setWaiting(q.length))
    const tryFlush = async () => {
      const sent = await flushQueue()
      if (cancelled) return
      if (sent > 0) {
        setJustSent(sent)
        window.setTimeout(() => !cancelled && setJustSent(0), 5000)
      }
      refresh()
    }
    refresh()
    void tryFlush()
    const off = onQueueChange(refresh)
    window.addEventListener('online', tryFlush)
    const t = window.setInterval(tryFlush, 60_000)
    return () => {
      cancelled = true
      off()
      window.removeEventListener('online', tryFlush)
      window.clearInterval(t)
    }
  }, [])

  if (!waiting && !justSent) return null
  return (
    <div
      role="status"
      className="fixed inset-x-3 top-[max(0.5rem,env(safe-area-inset-top))] z-[2000] mx-auto max-w-sm rounded-2xl bg-[#063b32] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_40px_rgba(0,0,0,.3)]"
    >
      {justSent
        ? `✅ Sent ${justSent} saved report${justSent === 1 ? '' : 's'}. Thank you!`
        : `📶 ${waiting} report${waiting === 1 ? '' : 's'} saved on your phone. Sending when you’re back online.`}
    </div>
  )
}
