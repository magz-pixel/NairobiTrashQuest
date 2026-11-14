/**
 * Hexagon density bins for the city-zoom "story" layer: which parts of the city have the
 * most open spots. Works for any city with no boundary data. Pointy-top hexes in Web Mercator.
 */
import type { Report } from '../types/database'

const R = 6378137 // Web Mercator earth radius (m)
const toX = (lng: number) => (lng * Math.PI * R) / 180
const toY = (lat: number) => R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
const toLng = (x: number) => (x / R) * (180 / Math.PI)
const toLat = (y: number) => (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI)

function roundAxial(q: number, r: number): [number, number] {
  const s = -q - r
  let rq = Math.round(q)
  let rr = Math.round(r)
  const rs = Math.round(s)
  const dq = Math.abs(rq - q)
  const dr = Math.abs(rr - r)
  const ds = Math.abs(rs - s)
  if (dq > dr && dq > ds) rq = -rr - rs
  else if (dr > ds) rr = -rq - rs
  return [rq, rr]
}

export interface HexFeatureProps {
  count: number
  maxSeverity: number
}

/** `size` is the hex radius in Mercator metres (~equal to ground metres near the equator). */
export function hexbinReports(reports: Report[], size = 450): GeoJSON.FeatureCollection<GeoJSON.Polygon, HexFeatureProps> {
  const bins = new Map<string, { q: number; r: number; count: number; maxSeverity: number }>()
  for (const rep of reports) {
    const x = toX(rep.longitude)
    const y = toY(rep.latitude)
    const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / size
    const r = ((2 / 3) * y) / size
    const [hq, hr] = roundAxial(q, r)
    const key = `${hq}:${hr}`
    const bin = bins.get(key) ?? { q: hq, r: hr, count: 0, maxSeverity: 0 }
    bin.count += 1
    bin.maxSeverity = Math.max(bin.maxSeverity, rep.severity_score)
    bins.set(key, bin)
  }

  const features: GeoJSON.Feature<GeoJSON.Polygon, HexFeatureProps>[] = []
  for (const { q, r, count, maxSeverity } of bins.values()) {
    const cx = size * Math.sqrt(3) * (q + r / 2)
    const cy = size * 1.5 * r
    const ring: [number, number][] = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30)
      // Draw slightly inset so neighbouring hexes show a hairline gap.
      const px = cx + size * 0.94 * Math.cos(angle)
      const py = cy + size * 0.94 * Math.sin(angle)
      ring.push([toLng(px), toLat(py)])
    }
    ring.push(ring[0])
    features.push({ type: 'Feature', properties: { count, maxSeverity }, geometry: { type: 'Polygon', coordinates: [ring] } })
  }
  return { type: 'FeatureCollection', features }
}

export function reportsToPoints(reports: Report[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: reports.map((r) => ({
      type: 'Feature',
      id: r.id,
      properties: {
        id: r.id,
        severity: r.severity_score,
        cleared: r.status === 'verified_cleared' ? 1 : 0,
        flagged: r.status === 'flagged' ? 1 : 0,
      },
      geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
    })),
  }
}
