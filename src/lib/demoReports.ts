import type { Report } from '../types/database'
import { generateDemoReports } from './generateDemoReports'

export const DEMO_REPORTS: Report[] = generateDemoReports()

export function isDemoReport(report: Report): boolean {
  return report.id.startsWith('demo-')
}

export const showDemoData = import.meta.env.VITE_SHOW_DEMO_DATA !== 'false'

const forceDemoData = import.meta.env.VITE_FORCE_DEMO_DATA === 'true'

export function mergeWithDemoReports(live: Report[]): Report[] {
  if (forceDemoData) return DEMO_REPORTS
  if (!showDemoData) return live
  if (live.length > 0) return live
  return DEMO_REPORTS
}
