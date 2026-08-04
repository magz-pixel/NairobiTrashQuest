import type { Report } from '../types/database'
import { haversineDistanceM } from './geo'

const DEFAULT_NEARBY_M = 50

/** Active/flagged reports within radius, nearest first. */
export function findNearbyActiveReports(
  reports: Report[],
  latitude: number,
  longitude: number,
  maxDistanceM = DEFAULT_NEARBY_M,
): Report[] {
  return reports
    .filter((r) => r.status === 'active' || r.status === 'flagged')
    .map((report) => ({
      report,
      distance: haversineDistanceM(
        latitude,
        longitude,
        report.latitude,
        report.longitude,
      ),
    }))
    .filter(({ distance }) => distance <= maxDistanceM)
    .sort((a, b) => a.distance - b.distance)
    .map(({ report }) => report)
}

export function nearestActiveReport(
  reports: Report[],
  latitude: number,
  longitude: number,
  maxDistanceM = DEFAULT_NEARBY_M,
): Report | null {
  return findNearbyActiveReports(reports, latitude, longitude, maxDistanceM)[0] ?? null
}
