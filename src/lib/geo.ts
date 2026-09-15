import type { Report } from '../types/database'

const EARTH_RADIUS_M = 6_371_000

/** Reject / warn when Geolocation accuracy is worse than this (meters). */
export const GPS_ACCURACY_LIMIT_M = 50

export function isGpsAccuracyAcceptable(accuracyMeters: number): boolean {
  return Number.isFinite(accuracyMeters) && accuracyMeters <= GPS_ACCURACY_LIMIT_M
}

export function getCurrentPosition(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
  },
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

/**
 * Read GPS once; if accuracy is poor, automatically retry once.
 * Still returns the second fix even if poor — caller decides whether to warn.
 */
export async function getPositionWithAccuracyRetry(): Promise<GeolocationPosition> {
  const first = await getCurrentPosition()
  if (isGpsAccuracyAcceptable(first.coords.accuracy)) return first
  try {
    return await getCurrentPosition()
  } catch {
    return first
  }
}

export function haversineDistanceM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}

export function findNearestActiveReport(
  reports: Report[],
  latitude: number,
  longitude: number,
  maxDistanceM = 50,
): Report | null {
  let nearest: Report | null = null
  let minDistance = Infinity

  for (const report of reports) {
    const distance = haversineDistanceM(
      latitude,
      longitude,
      report.latitude,
      report.longitude,
    )
    if (distance <= maxDistanceM && distance < minDistance) {
      minDistance = distance
      nearest = report
    }
  }

  return nearest
}
