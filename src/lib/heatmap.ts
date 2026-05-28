import type { Report } from '../types/database'

const DECAY_HALF_LIFE_HOURS = 72

export const HEAT_GRADIENT: Record<number, string> = {
  0.0: 'rgba(10, 20, 10, 0)',
  0.18: '#1a3d1a',
  0.38: '#3d6b2a',
  0.5: '#7cb342',
  0.62: '#c4e600',
  0.74: '#ffcc00',
  0.84: '#ff7700',
  0.93: '#ff3300',
  1.0: '#cc0000',
}

export const HEAT_LEGEND_STOPS = [
  { label: 'Low', color: '#39ff14' },
  { label: 'Moderate', color: '#ffaa00' },
  { label: 'Severe', color: '#ff6b00' },
  { label: 'Critical', color: '#ff2d2d' },
] as const

export function severityToColor(severity: number): string {
  if (severity >= 9) return '#ff2d2d'
  if (severity >= 7) return '#ff6b00'
  if (severity >= 5) return '#ffaa00'
  if (severity >= 3) return '#c4e600'
  return '#39ff14'
}

export function severityLabel(severity: number): string {
  if (severity >= 9) return 'Critical'
  if (severity >= 7) return 'Severe'
  if (severity >= 5) return 'Moderate'
  if (severity >= 3) return 'Low'
  return 'Minimal'
}

/** Non-linear intensity: mild baseline, strong peaks for high severity. */
export function severityToHeatIntensity(severity: number): number {
  if (severity <= 3) return 0.2 + severity * 0.35
  if (severity <= 5) return 1.1 + (severity - 3) * 0.55
  if (severity <= 7) return 2.5 + (severity - 5) * 1.1
  return 4.8 + (severity - 7) * 1.8
}

export function reportHeatWeight(report: Report, now = Date.now()): number {
  const ageHours =
    (now - new Date(report.created_at).getTime()) / 3_600_000
  const decay = Math.exp(-ageHours / DECAY_HALF_LIFE_HOURS)
  return severityToHeatIntensity(report.severity_score) * decay
}

export function reportsToHeatPoints(
  reports: Report[],
): [number, number, number][] {
  const points: [number, number, number][] = []

  for (const report of reports) {
    const weight = reportHeatWeight(report)
    points.push([report.latitude, report.longitude, weight])

    // Stack intensity at severe sites so yellow/red pockets read at city zoom
    if (report.severity_score >= 6) {
      points.push([report.latitude, report.longitude, weight * 0.5])
    }
    if (report.severity_score >= 8) {
      points.push([report.latitude, report.longitude, weight * 0.45])
    }
  }

  return points
}

/** Radius scales down slightly when zoomed in so blobs stay detailed. */
export function heatRadiusForZoom(zoom: number): number {
  if (zoom >= 16) return 26
  if (zoom >= 14) return 32
  return 36
}

export function heatBlurForZoom(zoom: number): number {
  if (zoom >= 16) return 20
  if (zoom >= 14) return 24
  return 28
}

/** Normalization cap — lower = easier to reach yellow/red on the gradient */
export function heatMaxForZoom(zoom: number): number {
  if (zoom >= 16) return 5.5
  if (zoom >= 14) return 4.8
  return 4.2
}
