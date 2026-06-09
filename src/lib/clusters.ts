import type { Report } from '../types/database'

export interface MapCluster {
  id: string
  latitude: number
  longitude: number
  count: number
  maxSeverity: number
  reports: Report[]
}

const CELL = 0.012

export function clusterReports(reports: Report[], zoom: number): MapCluster[] {
  if (zoom >= 14) {
    return reports.map((r) => ({
      id: r.id,
      latitude: r.latitude,
      longitude: r.longitude,
      count: 1,
      maxSeverity: r.severity_score,
      reports: [r],
    }))
  }

  const buckets = new Map<string, MapCluster>()

  for (const report of reports) {
    const latKey = Math.floor(report.latitude / CELL)
    const lngKey = Math.floor(report.longitude / CELL)
    const key = `${latKey}:${lngKey}`

    const existing = buckets.get(key)
    if (!existing) {
      buckets.set(key, {
        id: key,
        latitude: report.latitude,
        longitude: report.longitude,
        count: 1,
        maxSeverity: report.severity_score,
        reports: [report],
      })
    } else {
      existing.count += 1
      existing.maxSeverity = Math.max(existing.maxSeverity, report.severity_score)
      existing.reports.push(report)
      existing.latitude =
        existing.reports.reduce((s, r) => s + r.latitude, 0) / existing.reports.length
      existing.longitude =
        existing.reports.reduce((s, r) => s + r.longitude, 0) / existing.reports.length
    }
  }

  return [...buckets.values()]
}

export function formatClusterCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

export function clusterColor(severity: number): string {
  if (severity >= 9) return '#cc0000'
  if (severity >= 7) return '#ff3300'
  if (severity >= 5) return '#ffcc00'
  if (severity >= 3) return '#7cb342'
  return '#3d6b2a'
}
