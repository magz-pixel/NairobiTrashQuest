import type { Report } from '../types/database'
import { generateDemoReports } from './generateDemoReports'

export function isDemoReport(report: Report): boolean {
  return report.id.startsWith('demo-')
}

export const showDemoData = import.meta.env.VITE_SHOW_DEMO_DATA !== 'false'

const forceDemoData = import.meta.env.VITE_FORCE_DEMO_DATA === 'true'

export function mergeWithDemoReports(live: Report[], citySlug = 'nairobi'): Report[] {
  const demo = generateDemoReports(citySlug)
  if (forceDemoData) return demo
  if (!showDemoData) return live
  if (live.length > 0) return live
  return demo
}
