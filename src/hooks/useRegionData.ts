/** Live data for the hub's East Africa section: every report as a point, totals, and a short feed. */
import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { cityPath, getCity } from '../lib/cities'
import { formatEventWhen } from '../lib/events'
import type { FeedItem, RegionPoint } from '../lib/demoRegion'

interface LiveRegion {
  points: RegionPoint[]
  total: number
  cleared: number
  upcomingCleanups: number
  feed: FeedItem[]
  /** Kilograms weighed in at race/cleanup weigh-ins (race_weight_logs), all Nairobi so far. */
  kgLogged: number
  /** Bins / trees per city, or null until migration 023 is run. */
  features: { city: string; kind: string; origin: string | null }[] | null
}

function ago(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins} min ago`
  const h = Math.round(mins / 60)
  if (h < 48) return `${h} h ago`
  return `${Math.round(h / 24)} days ago`
}

export function useRegionData() {
  const [live, setLive] = useState<LiveRegion | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    void (async () => {
      const [reportsRes, eventsRes, kgRes, featRes] = await Promise.all([
        supabase
          .from('reports')
          .select('id,latitude,longitude,severity_score,status,city,area_name,created_at,cleared_at')
          .in('status', ['active', 'flagged', 'verified_cleared'])
          .order('created_at', { ascending: false })
          .limit(5000),
        supabase
          .from('events')
          .select('id,title,location,event_date,city')
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(20),
        supabase.from('race_weight_logs').select('kg'),
        supabase.from('map_features').select('city,kind,origin').limit(20000),
      ])
      if (cancelled) return
      const rows = (reportsRes.data ?? []) as {
        id: string
        latitude: number
        longitude: number
        severity_score: number
        status: string
        city: string | null
        area_name: string | null
        created_at: string
        cleared_at: string | null
      }[]
      const events = (eventsRes.data ?? []) as { id: string; title: string; location: string; event_date: string; city: string }[]

      const feed: FeedItem[] = [
        ...events.slice(0, 2).map((e) => ({
          id: `e-${e.id}`,
          kind: 'cleanup' as const,
          place: e.location,
          text: `${e.title}. Join the crew.`,
          when: formatEventWhen(e.event_date),
          href: `${cityPath(e.city, '/map')}?event=${e.id}`,
        })),
        ...rows.slice(0, 4).map((r) => {
          const city = getCity(r.city ?? 'nairobi')
          const cleared = r.status === 'verified_cleared'
          return {
            id: `r-${r.id}`,
            kind: cleared ? ('cleared' as const) : ('report' as const),
            place: r.area_name ? `${r.area_name}${city.slug === 'nairobi' ? '' : `, ${city.label}`}` : city.label,
            text: cleared ? 'Spot cleared. Before and after on the map.' : 'New trash spot pinned.',
            when: ago(cleared && r.cleared_at ? r.cleared_at : r.created_at),
            href: cityPath(city.slug, `/report/${r.id}`),
          }
        }),
      ].slice(0, 4)

      setLive({
        points: rows.map((r) => ({
          lng: r.longitude,
          lat: r.latitude,
          severity: r.severity_score,
          cleared: r.status === 'verified_cleared',
          city: r.city ?? 'nairobi',
        })),
        total: rows.length,
        cleared: rows.filter((r) => r.status === 'verified_cleared').length,
        upcomingCleanups: events.length,
        feed,
        features: featRes.error ? null : ((featRes.data ?? []) as { city: string; kind: string; origin: string | null }[]),
        kgLogged: ((kgRes.data ?? []) as { kg: number }[]).reduce((sum, r) => sum + Number(r.kg || 0), 0),
      })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return live
}
