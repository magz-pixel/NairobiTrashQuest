/**
 * Isolated Mapbox Directions spike for Dandora (informal-settlement routing PoC).
 * Not imported by production map code. Requires VITE_MAPBOX_TOKEN.
 */

/** Dandora dumpsite — 1°14′53″S 36°53′50″E. */
export const DANDORA_TEST_PIN = {
  label: 'Dandora dumpsite (test pin)',
  latitude: -1.248056,
  longitude: 36.897222,
} as const

/**
 * Fixed origin on a paved approach (~Outer Ring / Kayole Rd area)
 * so Directions has a clear A→B pair into the settlement edge.
 */
export const DANDORA_ROUTE_ORIGIN = {
  label: 'Outer Ring / Kayole Rd junction (origin)',
  latitude: -1.2405,
  longitude: 36.8948,
} as const

export type MapboxProfile = 'driving' | 'walking'

export interface SanityVerdict {
  /** Yes / no for informal-settlement usefulness of this response. */
  saneForInformalSettlement: boolean
  reasons: string[]
}

function haversineM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const r = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(a))
}

export function assessInformalSettlementRouting(
  raw: Record<string, unknown>,
  destination: { latitude: number; longitude: number },
  origin: { latitude: number; longitude: number },
): SanityVerdict {
  const reasons: string[] = []
  const code = raw.code
  if (code !== 'Ok') {
    reasons.push(`Directions code is ${String(code)}, not Ok`)
    return { saneForInformalSettlement: false, reasons }
  }

  const routes = raw.routes as
    | {
        distance?: number
        duration?: number
        geometry?: { coordinates?: [number, number][] }
        legs?: { steps?: { name?: string }[] }[]
      }[]
    | undefined

  const route = routes?.[0]
  if (!route?.geometry?.coordinates?.length) {
    reasons.push('No route geometry returned')
    return { saneForInformalSettlement: false, reasons }
  }

  const coords = route.geometry.coordinates
  const end = coords[coords.length - 1]!
  const endGapM = haversineM(destination.latitude, destination.longitude, end[1], end[0])
  const crowM = haversineM(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude,
  )
  const distanceM = route.distance ?? 0
  const steps = (route.legs ?? []).flatMap((leg) => leg.steps ?? [])
  const unnamed = steps.filter((s) => !(s.name ?? '').trim()).length
  const unnamedRatio = steps.length ? unnamed / steps.length : 1

  if (endGapM > 150) {
    reasons.push(
      `Route endpoint is ${Math.round(endGapM)} m from the pin — network likely does not reach into the settlement core`,
    )
  } else {
    reasons.push(`Route snaps within ${Math.round(endGapM)} m of the pin`)
  }

  if (crowM > 0 && distanceM / crowM > 4) {
    reasons.push(
      `Route is ${(distanceM / crowM).toFixed(1)}× crow-flies (${Math.round(distanceM)} m vs ${Math.round(crowM)} m) — likely forced onto arterial ring roads`,
    )
  } else {
    reasons.push(
      `Route length ${Math.round(distanceM)} m is plausible vs ${Math.round(crowM)} m crow-flies`,
    )
  }

  if (unnamedRatio > 0.6 && steps.length >= 3) {
    reasons.push(
      `${unnamed}/${steps.length} steps are unnamed — common in poorly mapped informal grids (not automatically a fail)`,
    )
  }

  const saneForInformalSettlement = endGapM <= 150 && !(crowM > 0 && distanceM / crowM > 4)
  if (saneForInformalSettlement) {
    reasons.push('Overall: looks usable enough to navigate toward the pin on the mapped network')
  } else {
    reasons.push('Overall: not sane for informal-settlement last-mile — Mapbox network coverage looks insufficient here')
  }

  return { saneForInformalSettlement, reasons }
}

export async function fetchMapboxDirectionsRaw(
  token: string,
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  profile: MapboxProfile = 'driving',
): Promise<Record<string, unknown>> {
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}`,
  )
  url.searchParams.set('geometries', 'geojson')
  url.searchParams.set('overview', 'full')
  url.searchParams.set('steps', 'true')
  url.searchParams.set('access_token', token)

  const res = await fetch(url)
  const payload = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    const msg =
      typeof payload.message === 'string' ? payload.message : `HTTP ${res.status}`
    throw new Error(msg)
  }
  return payload
}
