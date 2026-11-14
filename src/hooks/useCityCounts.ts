import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export interface CityCount {
  open: number
  cleared: number
}

/** Open / cleared report counts per city, for the hub's live numbers. One light query. */
export function useCityCounts() {
  const [counts, setCounts] = useState<Record<string, CityCount>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    void supabase
      .from('reports')
      .select('city,status')
      .in('status', ['active', 'flagged', 'verified_cleared'])
      .then(({ data }) => {
        if (cancelled) return
        const next: Record<string, CityCount> = {}
        for (const row of (data ?? []) as { city: string | null; status: string }[]) {
          const slug = row.city ?? 'nairobi'
          next[slug] ??= { open: 0, cleared: 0 }
          if (row.status === 'verified_cleared') next[slug].cleared += 1
          else next[slug].open += 1
        }
        setCounts(next)
        setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const total = Object.values(counts).reduce(
    (acc, c) => ({ open: acc.open + c.open, cleared: acc.cleared + c.cleared }),
    { open: 0, cleared: 0 },
  )
  return { counts, total, loaded }
}
