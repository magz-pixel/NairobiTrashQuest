import type { Report } from '../types/database'
import { generateDemoReports } from './generateDemoReports'

export const DEMO_REPORTS: Report[] = generateDemoReports(200)

export function isDemoReport(report: Report): boolean {
  return report.id.startsWith('demo-')
}

export const showDemoData =
  import.meta.env.VITE_SHOW_DEMO_DATA !== 'false'

export function mergeWithDemoReports(live: Report[]): Report[] {
  if (!showDemoData) return live
  const liveIds = new Set(live.map((r) => r.id))
  const demos = DEMO_REPORTS.filter((d) => !liveIds.has(d.id))
  if (live.length === 0) return demos
  return [...live, ...demos]
}
