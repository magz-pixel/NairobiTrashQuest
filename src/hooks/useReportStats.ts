import { useMemo } from 'react'
import type { Report, ReportStats } from '../types/database'

export function useReportStats(reports: Report[]): ReportStats {
  return useMemo(() => {
    const active = reports.filter((r) => r.status === 'active' || r.status === 'flagged').length
    const resolved = reports.filter((r) => r.status === 'verified_cleared').length
    const pending = reports.filter((r) => r.status === 'pending').length
    const flagged = reports.filter((r) => r.status === 'flagged').length
    const total = reports.length
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 1000) / 10 : 0

    const areaCounts = new Map<string, number>()
    for (const r of reports) {
      if (r.status !== 'active' && r.status !== 'flagged') continue
      const area = r.area_name ?? 'Unknown'
      areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1)
    }

    const worstAreas = [...areaCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([area, count]) => ({ area, count }))

    return { total, active, resolved, pending, flagged, resolutionRate, worstAreas }
  }, [reports])
}
