import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadLocalRaceHotspots } from '../lib/raceHotspots'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { AMAZING_TRASH_RACE_S2, type RaceHotspot } from '../types/database'

function normalizeHotspot(row: Record<string, unknown>): RaceHotspot {
  return {
    id: row.id as string,
    event_slug: (row.event_slug as string) ?? AMAZING_TRASH_RACE_S2,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    label: row.label as string,
    point_value: row.point_value as number,
    is_ghost_spot: Boolean(row.is_ghost_spot),
    reference_image_url: (row.reference_image_url as string | null) ?? null,
    gallery_image_urls: Array.isArray(row.gallery_image_urls)
      ? (row.gallery_image_urls as string[])
      : [],
    status: (row.status as RaceHotspot['status']) ?? 'active',
    cleared_by_team_name: (row.cleared_by_team_name as string | null) ?? null,
    cleared_at: (row.cleared_at as string | null) ?? null,
    created_at: row.created_at as string,
  }
}

export function useRaceHotspots(eventSlug = AMAZING_TRASH_RACE_S2) {
  const [hotspots, setHotspots] = useState<RaceHotspot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingLocal, setUsingLocal] = useState(false)

  const fetchHotspots = useCallback(async () => {
    setError(null)
    if (!isSupabaseConfigured) {
      setUsingLocal(true)
      setHotspots(loadLocalRaceHotspots(eventSlug))
      return
    }

    const { data, error: fetchError } = await supabase
      .from('race_hotspots')
      .select('*')
      .eq('event_slug', eventSlug)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setUsingLocal(true)
      setHotspots(loadLocalRaceHotspots(eventSlug))
      setError(fetchError.message)
      return
    }

    setUsingLocal(false)
    setHotspots((data ?? []).map((row) => normalizeHotspot(row as Record<string, unknown>)))
  }, [eventSlug])

  useEffect(() => {
    const t = window.setTimeout(() => {
      fetchHotspots().finally(() => setLoading(false))
    }, 0)
    return () => window.clearTimeout(t)
  }, [fetchHotspots])

  useEffect(() => {
    if (!isSupabaseConfigured || usingLocal) return

    const channel = supabase
      .channel(`race-hotspots-${eventSlug}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'race_hotspots' },
        () => {
          void fetchHotspots()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventSlug, fetchHotspots, usingLocal])

  /** Map layer: active only — cleared pins disappear (no grey-out). */
  const activeHotspots = useMemo(
    () => hotspots.filter((h) => h.status === 'active'),
    [hotspots],
  )

  return {
    hotspots,
    activeHotspots,
    loading,
    error,
    usingLocal,
    refetch: fetchHotspots,
  }
}
