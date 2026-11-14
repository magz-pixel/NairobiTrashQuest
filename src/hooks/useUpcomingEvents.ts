import { useCallback, useEffect, useState } from 'react'
import { fetchGoingCounts, fetchMyGoing, fetchUpcomingEvents, setGoing } from '../lib/events'
import type { Event } from '../types/database'
import { useAuth } from './useAuth'

export function useUpcomingEvents(citySlug: string) {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [going, setGoingCounts] = useState<Map<string, number>>(new Map())
  const [mine, setMine] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    const list = await fetchUpcomingEvents(citySlug)
    const ids = list.map((e) => e.id)
    const [counts, my] = await Promise.all([
      fetchGoingCounts(ids),
      user ? fetchMyGoing(user.id, ids) : Promise.resolve(new Set<string>()),
    ])
    setEvents(list)
    setGoingCounts(counts)
    setMine(my)
  }, [citySlug, user])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!cancelled) await load()
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  /** Returns an error message, or null on success. Updates counts optimistically. */
  const toggleGoing = useCallback(
    async (eventId: string): Promise<string | null> => {
      if (!user) return 'Sign in to join.'
      const joining = !mine.has(eventId)
      const error = await setGoing(eventId, user.id, joining)
      if (error) return error
      setMine((prev) => {
        const next = new Set(prev)
        if (joining) next.add(eventId)
        else next.delete(eventId)
        return next
      })
      setGoingCounts((prev) => {
        if (!prev.has(eventId)) return prev // counts RPC not available yet: keep the count hidden
        const next = new Map(prev)
        next.set(eventId, Math.max(0, (prev.get(eventId) ?? 0) + (joining ? 1 : -1)))
        return next
      })
      return null
    },
    [mine, user],
  )

  return { events, going, mine, toggleGoing, reload: load }
}
