import { useCallback, useEffect, useMemo, useState } from 'react'
import { mergeWithDemoReports } from '../lib/demoReports'
import { filterReportsBySeverity, filterReportsByStatus } from '../lib/wards'
import { supabase } from '../lib/supabase'
import type { Report, SeverityFilter, StatusFilter } from '../types/database'

function normalizeReport(row: Record<string, unknown>): Report {
  return {
    id: row.id as string,
    user_id: (row.user_id as string | null) ?? null,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    severity_score: row.severity_score as number,
    status: (row.status as Report['status']) ?? 'active',
    image_url: row.image_url as string,
    ai_tags: Array.isArray(row.ai_tags) ? (row.ai_tags as string[]) : [],
    cleared_image_url: (row.cleared_image_url as string | null) ?? null,
    cleared_at: (row.cleared_at as string | null) ?? null,
    cleared_by: (row.cleared_by as string | null) ?? null,
    waste_type: (row.waste_type as string | null) ?? null,
    seen_count: (row.seen_count as number) ?? 0,
    flag_count: (row.flag_count as number) ?? 0,
    approved_at: (row.approved_at as string | null) ?? null,
    rejected_reason: (row.rejected_reason as string | null) ?? null,
    ward_id: (row.ward_id as string | null) ?? null,
    area_name: (row.area_name as string | null) ?? null,
    is_anonymous: (row.is_anonymous as boolean) ?? false,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export function useReports(
  severityFilter: SeverityFilter = 'all',
  statusFilter: StatusFilter = 'all',
) {
  const [allReports, setAllReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .in('status', ['active', 'verified_cleared', 'pending', 'flagged'])
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    const live = (data ?? []).map((row) => normalizeReport(row as Record<string, unknown>))
    setAllReports(mergeWithDemoReports(live))
  }, [])

  useEffect(() => {
    fetchReports().finally(() => setLoading(false))
  }, [fetchReports])

  useEffect(() => {
    const channel = supabase
      .channel('reports-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchReports])

  const reports = useMemo(() => {
    let list = allReports
    list = filterReportsByStatus(list, statusFilter)
    list = filterReportsBySeverity(list, severityFilter)
    return list
  }, [allReports, severityFilter, statusFilter])

  const mapReports = useMemo(
    () =>
      reports.filter(
        (r) =>
          r.status === 'active' ||
          r.status === 'flagged' ||
          r.status === 'verified_cleared',
      ),
    [reports],
  )

  return { reports, mapReports, allReports, loading, error, refetch: fetchReports }
}
