import type { Report } from '../types/database'

const EARTH_RADIUS_M = 6_371_000

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
