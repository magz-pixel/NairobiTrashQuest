import { useCallback, useEffect, useMemo, useState } from 'react'
import { mergeWithDemoReports, showDemoData } from '../lib/demoReports'
import { generateDemoReports } from '../lib/generateDemoReports'
import { filterReportsBySeverity, filterReportsByStatus } from '../lib/wards'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Report, SeverityFilter, StatusFilter } from '../types/database'

function normalizeWasteTypes(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    const items = value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    return items.length ? items : null
  }
  if (typeof value === 'string' && value.trim()) return [value]
  return null
}

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
    waste_type: normalizeWasteTypes(row.waste_type),
    seen_count: (row.seen_count as number) ?? 0,
    flag_count: (row.flag_count as number) ?? 0,
    approved_at: (row.approved_at as string | null) ?? null,
    rejected_reason: (row.rejected_reason as string | null) ?? null,
    ward_id: (row.ward_id as string | null) ?? null,
    area_name: (row.area_name as string | null) ?? null,
    is_anonymous: (row.is_anonymous as boolean) ?? false,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    city: (row.city as string) ?? 'nairobi',
  }
}

export function useReports(
  severityFilter: SeverityFilter = 'all',
  statusFilter: StatusFilter = 'all',
  citySlug = 'nairobi',
) {
  const [allReports, setAllReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setError(null)
    if (!isSupabaseConfigured) {
      setAllReports(mergeWithDemoReports([], citySlug))
      return
    }
    const { data, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('city', citySlug)
      .in('status', ['active', 'verified_cleared', 'pending', 'flagged'])
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setAllReports(mergeWithDemoReports([], citySlug))
      return
    }

    const live = (data ?? []).map((row) => normalizeReport(row as Record<string, unknown>))
    setAllReports(mergeWithDemoReports(live, citySlug))
  }, [citySlug])

  useEffect(() => {
    fetchReports().finally(() => setLoading(false))
  }, [fetchReports])

  useEffect(() => {
    if (!isSupabaseConfigured) return
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

const forceDemoData = import.meta.env.VITE_FORCE_DEMO_DATA === 'true'

function findDemoReport(id: string): Report | null {
  if (!showDemoData && !forceDemoData) return null
  for (const slug of ['nairobi', 'kampala', 'dar-es-salaam']) {
    const match = generateDemoReports(slug).find((report) => report.id === id)
    if (match) return match
  }
  return null
}

/** One report by id. Does not filter by the city in the URL. */
export function useReport(id: string | undefined) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setReport(null)
      setNotFound(true)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setError(null)

    const finish = (next: Report | null, fetchError: string | null = null) => {
      if (cancelled) return
      setReport(next)
      setError(fetchError)
      setNotFound(!fetchError && !next)
      setLoading(false)
    }

    if (!isSupabaseConfigured || forceDemoData) {
      finish(findDemoReport(id))
      return () => {
        cancelled = true
      }
    }

    supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          finish(null, fetchError.message)
          return
        }
        finish(data ? normalizeReport(data as Record<string, unknown>) : null)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return { report, loading, notFound, error }
}
