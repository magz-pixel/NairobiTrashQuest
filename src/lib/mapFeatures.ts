/** Bins and trees (map_features, migration 023). */
import { isSupabaseConfigured, supabase } from './supabase'

export type FeatureKind = 'bin' | 'tree'
export type BinStatus = 'ok' | 'full' | 'damaged' | 'missing'
export type TreeStatus = 'alive' | 'struggling' | 'dead'

export interface MapFeature {
  id: string
  city: string
  kind: FeatureKind
  latitude: number
  longitude: number
  status: BinStatus | TreeStatus
  origin: 'planted' | 'existing' | null
  species: string | null
  planted_on: string | null
  image_url: string | null
  note: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export const STATUS_OPTIONS: Record<FeatureKind, { value: string; label: string; emoji: string; color: string }[]> = {
  bin: [
    { value: 'ok', label: 'Working', emoji: '✅', color: '#0b8c76' },
    { value: 'full', label: 'Full', emoji: '🟡', color: '#d99a16' },
    { value: 'damaged', label: 'Damaged', emoji: '🛠️', color: '#d9483b' },
    { value: 'missing', label: 'Missing', emoji: '❓', color: '#7b8c85' },
  ],
  tree: [
    { value: 'alive', label: 'Healthy', emoji: '🌳', color: '#16a34a' },
    { value: 'struggling', label: 'Struggling', emoji: '🥀', color: '#d99a16' },
    { value: 'dead', label: 'Dead', emoji: '🪵', color: '#7b8c85' },
  ],
}

export function statusMeta(kind: FeatureKind, status: string) {
  return STATUS_OPTIONS[kind].find((o) => o.value === status) ?? STATUS_OPTIONS[kind][0]
}

/** Returns null when the table isn't there yet (migration 023 not run). */
export async function fetchMapFeatures(city: string): Promise<MapFeature[] | null> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('map_features').select('*').eq('city', city).limit(5000)
  if (error) return null
  return (data ?? []) as MapFeature[]
}

export async function addMapFeature(f: Omit<MapFeature, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
  const { error } = await supabase.from('map_features').insert(f)
  return error ? error.message : null
}

export async function addFeatureUpdate(featureId: string, status: string, userId: string, note?: string): Promise<string | null> {
  const { error } = await supabase.from('feature_updates').insert({ feature_id: featureId, status, created_by: userId, note: note ?? null })
  return error ? error.message : null
}

export function featuresToGeoJSON(features: MapFeature[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: features.map((f) => ({
      type: 'Feature',
      properties: { id: f.id, kind: f.kind, status: f.status, origin: f.origin ?? '' },
      geometry: { type: 'Point', coordinates: [f.longitude, f.latitude] },
    })),
  }
}
