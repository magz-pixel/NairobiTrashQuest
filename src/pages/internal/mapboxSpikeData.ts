/**
 * Internal Mapbox spike — Dandora informal-settlement routing comparison.
 * Not linked from production nav. Requires VITE_MAPBOX_TOKEN in .env.
 */

/** Dandora dumpsite — 1°14′53″S 36°53′50″E (Wikimapia / common dump reference). */
export const DANDORA_TEST_PIN = {
  label: 'Dandora dumpsite (spike pin)',
  latitude: -1.248056,
  longitude: 36.897222,
} as const

/**
 * Paved-road origin ~800 m north-east (Outer Ring / Kayole Rd junction area).
 * Fixed so Mapbox vs Google comparisons use the same A→B pair.
 */
export const DANDORA_ROUTE_ORIGIN = {
  label: 'Outer Ring / Kayole Rd junction (test origin)',
  latitude: -1.2405,
  longitude: 36.8948,
} as const

export function googleDirectionsUrl(
  destination: { latitude: number; longitude: number },
  origin?: { latitude: number; longitude: number },
): string {
  const dest = `${destination.latitude},${destination.longitude}`
  if (origin) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${dest}`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`
}

export interface MapboxDirectionsResult {
  profile: string
  distanceM: number
  durationS: number
  stepCount: number
  unnamedStepCount: number
  endGapM: number
  geometry: GeoJSON.LineString
  steps: { instruction: string; distanceM: number; name: string }[]
}

function haversineM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const r = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(a))
}

export async function fetchMapboxDirections(
  token: string,
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  profile: 'driving' | 'walking' = 'driving',
): Promise<MapboxDirectionsResult> {
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}`,
  )
  url.searchParams.set('geometries', 'geojson')
  url.searchParams.set('overview', 'full')
  url.searchParams.set('steps', 'true')
  url.searchParams.set('access_token', token)

  const res = await fetch(url)
  const payload = await res.json()
  if (!res.ok) {
    const msg =
      typeof payload?.message === 'string' ? payload.message : `HTTP ${res.status}`
    throw new Error(msg)
  }

  const route = payload.routes?.[0]
  if (!route?.geometry) {
    throw new Error('No route returned for this profile')
  }

  const legs = route.legs ?? []
  const steps = legs.flatMap(
    (leg: { steps?: { maneuver?: { instruction?: string }; distance?: number; name?: string }[] }) =>
      (leg.steps ?? []).map((step) => ({
        instruction: step.maneuver?.instruction ?? 'Continue',
        distanceM: step.distance ?? 0,
        name: step.name ?? '',
      })),
  )

  const coordsLine = route.geometry.coordinates as [number, number][]
  const end = coordsLine[coordsLine.length - 1]
  const endGapM = haversineM(
    destination.latitude,
    destination.longitude,
    end[1],
    end[0],
  )

  return {
    profile,
    distanceM: route.distance ?? 0,
    durationS: route.duration ?? 0,
    stepCount: steps.length,
    unnamedStepCount: steps.filter((s: { name: string }) => !s.name.trim()).length,
    endGapM,
    geometry: route.geometry as GeoJSON.LineString,
    steps,
  }
}
