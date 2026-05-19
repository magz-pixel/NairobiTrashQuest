import type { Report } from '../types/database'

const DECAY_HALF_LIFE_HOURS = 72

export function reportHeatWeight(report: Report, now = Date.now()): number {
  const ageHours =
    (now - new Date(report.created_at).getTime()) / 3_600_000
  return report.severity_score * Math.exp(-ageHours / DECAY_HALF_LIFE_HOURS)
}

export function reportsToHeatPoints(
  reports: Report[],
): [number, number, number][] {
  return reports.map((report) => [
    report.latitude,
    report.longitude,
    reportHeatWeight(report),
  ])
}
