/**
 * Ward boundaries for a city (public/wards/<slug>.geojson, from geoBoundaries) with each ward's
 * open / cleared counts computed from the reports. Feeds the map's ward layer, the ward card
 * and the "Where it's worst" ranking.
 */
import { useEffect, useMemo, useState } from 'react'
import type { Report } from '../types/database'

type WardGeometry = GeoJSON.Polygon | GeoJSON.MultiPolygon

export interface WardFeatureProps {
  name: string
  open: number
  cleared: number
}

export interface WardSummary {
  id: number
  name: string
  open: number
  cleared: number
  /** created_at of the oldest open report, if any. */
  oldestOpenAt: string | null
  reports: Report[]
  bbox: [number, number, number, number]
  center: [number, number]
}

interface WardFile {
  attribution?: string
  features: GeoJSON.Feature<WardGeometry, { name: string }>[]
}

const cache = new Map<string, Promise<WardFile | null>>()

function loadWards(slug: string): Promise<WardFile | null> {
  if (!cache.has(slug)) {
    cache.set(
      slug,
      fetch(`/wards/${slug}.geojson`)
        .then((r) => (r.ok ? (r.json() as Promise<WardFile>) : null))
        .catch(() => null),
    )
  }
  return cache.get(slug)!
}

function polygons(g: WardGeometry): GeoJSON.Position[][][] {
  return g.type === 'Polygon' ? [g.coordinates] : g.coordinates
}

function inRing(x: number, y: number, ring: GeoJSON.Position[]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function contains(g: WardGeometry, x: number, y: number) {
  return polygons(g).some((p) => inRing(x, y, p[0]) && !p.slice(1).some((h) => inRing(x, y, h)))
}

function bboxOf(g: WardGeometry): [number, number, number, number] {
  const b: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const p of polygons(g))
    for (const [x, y] of p[0]) {
      b[0] = Math.min(b[0], x)
      b[1] = Math.min(b[1], y)
      b[2] = Math.max(b[2], x)
      b[3] = Math.max(b[3], y)
    }
  return b
}

export function useCityWards(slug: string, reports: Report[]) {
  const [file, setFile] = useState<{ slug: string; data: WardFile | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadWards(slug).then((data) => {
      if (!cancelled) setFile({ slug, data })
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  return useMemo(() => {
    const data = file?.slug === slug ? file.data : null
    if (!data) return { wards: null, summaries: [] as WardSummary[], attribution: null as string | null }

    const summaries: WardSummary[] = data.features.map((f, id) => {
      const b = bboxOf(f.geometry)
      const inside = reports.filter(
        (r) =>
          r.longitude >= b[0] &&
          r.longitude <= b[2] &&
          r.latitude >= b[1] &&
          r.latitude <= b[3] &&
          contains(f.geometry, r.longitude, r.latitude),
      )
      const open = inside.filter((r) => r.status === 'active' || r.status === 'flagged')
      const oldest = open.reduce<string | null>((min, r) => (min === null || r.created_at < min ? r.created_at : min), null)
      return {
        id,
        name: f.properties.name,
        open: open.length,
        cleared: inside.filter((r) => r.status === 'verified_cleared').length,
        oldestOpenAt: oldest,
        reports: inside,
        bbox: b,
        center: [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2],
      }
    })

    const wards: GeoJSON.FeatureCollection<WardGeometry, WardFeatureProps> = {
      type: 'FeatureCollection',
      features: data.features.map((f, id) => ({
        type: 'Feature',
        id,
        properties: { name: f.properties.name, open: summaries[id].open, cleared: summaries[id].cleared },
        geometry: f.geometry,
      })),
    }
    return { wards, summaries, attribution: data.attribution ?? null }
  }, [file, slug, reports])
}

/** Ward ids in the wards table: "<city>-<ward-slug>", e.g. nairobi-mwiki (see supabase/backfills/ward_mcas_TEMPLATE.sql). */
export function wardDbId(citySlug: string, wardName: string) {
  return `${citySlug}-${wardName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
}
