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

/** Orange gradient: light orange (low) → burnt orange (critical). */
export function clusterColor(severity: number): string {
  if (severity >= 9) return '#c2410c'
  if (severity >= 7) return '#ea580c'
  if (severity >= 5) return '#f97316'
  if (severity >= 3) return '#fdba74'
  return '#fed7aa'
}

const CLEARED_PIN_COLOR = '#0d9488'

/** Pin color by status; cleared spots use brand teal regardless of severity. */
export function pinColor(severity: number, status: string): string {
  if (status === 'verified_cleared') return CLEARED_PIN_COLOR
  return clusterColor(severity)
}

export { CLEARED_PIN_COLOR }

export function clusterSize(count: number): number {
  return Math.min(56, 28 + count * 4)
}

export function pinSize(severity: number): number {
  return Math.min(20, 12 + Math.floor(severity / 2))
}
