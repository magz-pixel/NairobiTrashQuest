import type { Report } from '../types/database'
import { getCity } from './cities'

/** Rough ward assignment by lat/lng bounding boxes (MVP — replace with GeoJSON point-in-polygon). */
export async function resolvePlace(
  lat: number,
  lng: number,
  citySlug?: string,
): Promise<{ wardId: string | null; areaName: string } | null> {
  const ward = assignWard(lat, lng, citySlug)
  if (ward) return ward
  try {
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client')
    url.searchParams.set('latitude', String(lat))
    url.searchParams.set('longitude', String(lng))
    url.searchParams.set('localityLanguage', 'en')
    const response = await fetch(url)
    if (!response.ok) return null
    const data = (await response.json()) as ReverseGeocodeResult
    const areaName = pickAreaName(data)
    if (!areaName) return null
    return { wardId: null, areaName }
  } catch {
    return null
  }
}

interface ReverseGeocodeResult {
  locality?: string
  city?: string
  localityInfo?: { administrative?: { name?: string; adminLevel?: number; order?: number }[] }
}

const GENERIC_PLACE = /^(kenya|uganda|tanzania|nairobi|nairobi city|kampala|dar es salaam)$/i

/**
 * `locality` is usually just the city name ("Nairobi"), which makes every pin look the same.
 * Prefer the ward, then the most specific admin area below city level (e.g. "Mwiki", "Njiru").
 */
export function pickAreaName(data: ReverseGeocodeResult): string | null {
  const clean = (name: string) =>
    name
      .replace(/\s+(ward|sub-?location|location|sub-?county|constituency|division)$/i, '')
      .trim()
  const admin = (data.localityInfo?.administrative ?? [])
    .filter((a) => a.name)
    .sort((a, b) => (a.order ?? a.adminLevel ?? 0) - (b.order ?? b.adminLevel ?? 0))
  const ward = admin.find((a) => /\bward$/i.test(a.name!))
  if (ward) return clean(ward.name!)
  const specific = admin.map((a) => clean(a.name!)).filter((n) => n && !GENERIC_PLACE.test(n))
  if (specific.length) return specific[specific.length - 1]
  return data.locality?.trim() || data.city?.trim() || null
}

export function assignWard(
  lat: number,
  lng: number,
  citySlug?: string,
): { wardId: string; areaName: string } | null {
  for (const box of getCity(citySlug).wardBoxes) {
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

export function complaintMailto(areaName: string, reportId: string, citySlug?: string): string {
  const subject = encodeURIComponent(`Trash report — ${areaName}`)
  const body = encodeURIComponent(
    `I am reporting a persistent trash hotspot.\n\nReport ID: ${reportId}\nArea: ${areaName}\n\nPlease investigate and arrange cleanup.`,
  )
  return `mailto:${getCity(citySlug).complaintEmail}?subject=${subject}&body=${body}`
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
