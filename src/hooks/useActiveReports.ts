import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Report } from '../types/database'

export function useActiveReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    setReports(
      (data ?? []).map((row) => ({
        ...row,
        ai_tags: Array.isArray(row.ai_tags) ? row.ai_tags : [],
      })) as Report[],
    )
  }, [])

  useEffect(() => {
    fetchReports().finally(() => setLoading(false))
  }, [fetchReports])

  useEffect(() => {
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
