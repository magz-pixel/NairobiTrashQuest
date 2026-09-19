import { useCallback, useEffect, useState } from 'react'
import { mergeWithDemoReports } from '../lib/demoReports'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Report } from '../types/database'

export function useActiveReports(citySlug = 'nairobi') {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setError(null)
    if (!isSupabaseConfigured) {
      setReports(mergeWithDemoReports([], citySlug))
      return
    }
    const { data, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('city', citySlug)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setReports(mergeWithDemoReports([], citySlug))
      return
    }

    const live = (data ?? []).map((row) => ({
      ...row,
      ai_tags: Array.isArray(row.ai_tags) ? row.ai_tags : [],
      city: (row.city as string | undefined) ?? citySlug,
    })) as Report[]

    setReports(mergeWithDemoReports(live, citySlug))
  }, [citySlug])

  useEffect(() => {
    fetchReports().finally(() => setLoading(false))
  }, [fetchReports])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const channel = supabase
      .channel('reports-heatmap')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          fetchReports()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchReports])

  return { reports, loading, error, refetch: fetchReports }
}
