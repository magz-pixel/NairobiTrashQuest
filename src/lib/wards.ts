import type { Report } from '../types/database'

/** Rough Nairobi ward assignment by lat/lng bounding boxes (MVP — replace with GeoJSON point-in-polygon). */
const WARD_BOXES: {
  id: string
  name: string
  subCounty: string
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}[] = [
  { id: 'cbd', name: 'Central Business District', subCounty: 'Starehe', minLat: -1.29, maxLat: -1.28, minLng: 36.81, maxLng: 36.83 },
  { id: 'westlands', name: 'Westlands', subCounty: 'Westlands', minLat: -1.27, maxLat: -1.25, minLng: 36.78, maxLng: 36.82 },
  { id: 'kibra', name: 'Kibra', subCounty: 'Kibra', minLat: -1.32, maxLat: -1.30, minLng: 36.76, maxLng: 36.79 },
  { id: 'gikomba', name: 'Gikomba', subCounty: 'Kamukunji', minLat: -1.29, maxLat: -1.27, minLng: 36.83, maxLng: 36.86 },
  { id: 'industrial-area', name: 'Industrial Area', subCounty: 'Makadara', minLat: -1.31, maxLat: -1.29, minLng: 36.84, maxLng: 36.87 },
]

export function assignWard(lat: number, lng: number): { wardId: string; areaName: string } | null {
  for (const box of WARD_BOXES) {
    if (lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng) {
      return { wardId: box.id, areaName: box.name }
    }
  }
  return null
}

export function daysSince(dateIso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateIso).getTime()) / 86400000))
}

export function severityLabel(score: number): string {
  if (score >= 9) return 'Critical'
  if (score >= 7) return 'Severe'
  if (score >= 5) return 'Moderate'
  if (score >= 3) return 'Low'
  return 'Minimal'
}

export function complaintMailto(areaName: string, reportId: string): string {
  const subject = encodeURIComponent(`Trash report — ${areaName}`)
  const body = encodeURIComponent(
    `I am reporting a persistent trash hotspot.\n\nReport ID: ${reportId}\nArea: ${areaName}\n\nPlease investigate and arrange cleanup.`,
  )
  return `mailto:environment@nairobi.go.ke?subject=${subject}&body=${body}`
}

export function filterReportsBySeverity(reports: Report[], filter: string): Report[] {
  if (filter === 'all') return reports
  return reports.filter((r) => {
    const s = r.severity_score
    if (filter === 'low') return s <= 3
    if (filter === 'moderate') return s >= 4 && s <= 6
    if (filter === 'high') return s >= 7 && s <= 8
    if (filter === 'critical') return s >= 9
    return true
  })
}

export function filterReportsByStatus(reports: Report[], filter: string): Report[] {
  if (filter === 'all') return reports
  return reports.filter((r) => r.status === filter)
}
