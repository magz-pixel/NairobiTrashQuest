/** City skyline art + time-of-day phase for the CitySky backdrop. */

export type SkyPhase = 'dawn' | 'day' | 'golden' | 'night'

const SKY_SLUGS = new Set(['nairobi', 'kampala', 'dar-es-salaam'])

/** All chapter cities are on East Africa Time today; per-city zones can be added here. */
const CITY_TZ: Record<string, string> = {
  nairobi: 'Africa/Nairobi',
  kampala: 'Africa/Kampala',
  'dar-es-salaam': 'Africa/Dar_es_Salaam',
}

export function skyImage(slug: string, size: 'lg' | 'sm'): string | null {
  if (!SKY_SLUGS.has(slug)) return null
  return `/sky/${slug}-${size === 'lg' ? 1920 : 1080}.webp`
}

/** Local hour (with minutes as a fraction) in the city's time zone. */
export function cityHour(slug: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: CITY_TZ[slug] ?? 'Africa/Nairobi',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 12) % 24
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return h + m / 60
}

export function skyPhase(slug: string, now = new Date()): SkyPhase {
  // Demo / QA override: ?sky=night (or dawn, day, golden)
  if (typeof window !== 'undefined') {
    const forced = new URLSearchParams(window.location.search).get('sky')
    if (forced === 'dawn' || forced === 'day' || forced === 'golden' || forced === 'night') return forced
  }
  const h = cityHour(slug, now)
  if (h >= 5.5 && h < 7.5) return 'dawn'
  if (h >= 7.5 && h < 16) return 'day'
  if (h >= 16 && h < 19) return 'golden'
  return 'night'
}

export const PHASE_LABEL: Record<SkyPhase, string> = {
  dawn: 'Good morning',
  day: 'Out in the city',
  golden: 'Golden hour',
  night: 'After dark',
}
