import type { CityConfig } from './cities'

const KEY = 'ramani-report-timestamps'
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 4

function recentTimestamps(now = Date.now()): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    if (!Array.isArray(raw)) return []
    return raw.filter((value): value is number => typeof value === 'number' && now - value < WINDOW_MS)
  } catch {
    return []
  }
}

export function pointInsideCity(city: CityConfig, lat: number, lng: number): boolean {
  const box = city.bounds
  return lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng
}

/** Device limit plus a city-bounds check. Throws a message safe to show on the form. */
export function assertCanSubmitReport(city: CityConfig, lat: number, lng: number): void {
  if (!pointInsideCity(city, lat, lng)) {
    throw new Error(`That pin is outside ${city.label}. Drag it inside the city, or switch chapter.`)
  }
  if (recentTimestamps().length >= MAX_PER_WINDOW) {
    throw new Error('Too many reports from this device in the last hour. Try again later.')
  }
}

export function recordReportSubmit(): void {
  const stamps = recentTimestamps()
  stamps.push(Date.now())
  localStorage.setItem(KEY, JSON.stringify(stamps))
}
