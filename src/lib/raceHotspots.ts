import { compressImageFile } from './uploads'
import { supabase } from './supabase'
import { AMAZING_TRASH_RACE_S2, type RaceHotspot } from '../types/database'

const LOCAL_KEY = 'fn-race-hotspots-v1'

function readLocal(): RaceHotspot[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RaceHotspot[]
  } catch {
    return []
  }
}

function writeLocal(rows: RaceHotspot[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows))
}

export function loadLocalRaceHotspots(eventSlug = AMAZING_TRASH_RACE_S2): RaceHotspot[] {
  return readLocal()
    .filter((h) => h.event_slug === eventSlug)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

/** Landmark first when gallery is set; otherwise the legacy single photo. */
export function hotspotPhotoUrls(hotspot: RaceHotspot): string[] {
  const gallery = (hotspot.gallery_image_urls ?? []).filter(Boolean)
  if (gallery.length > 0) return gallery
  return hotspot.reference_image_url ? [hotspot.reference_image_url] : []
}

export function addLocalRaceHotspot(input: {
  latitude: number
  longitude: number
  label: string
  point_value: number
  is_ghost_spot: boolean
  reference_image_url?: string | null
  gallery_image_urls?: string[] | null
}): RaceHotspot {
  const gallery = (input.gallery_image_urls ?? []).filter(Boolean)
  const row: RaceHotspot = {
    id: crypto.randomUUID(),
    event_slug: AMAZING_TRASH_RACE_S2,
    latitude: input.latitude,
    longitude: input.longitude,
    label: input.label.trim(),
    point_value: input.point_value,
    is_ghost_spot: input.is_ghost_spot,
    is_funded: false,
    reference_image_url: input.reference_image_url ?? gallery[0] ?? null,
    gallery_image_urls: gallery,
    status: 'active',
    cleared_by_team_name: null,
    cleared_at: null,
    created_at: new Date().toISOString(),
  }
  writeLocal([row, ...readLocal()])
  return row
}

export function deleteLocalRaceHotspot(id: string) {
  writeLocal(readLocal().filter((h) => h.id !== id))
}

/** Clear only if still active — returns false if already cleared (double-clear guard). */
export function clearLocalRaceHotspot(
  id: string,
  teamName: string,
): { ok: true; hotspot: RaceHotspot } | { ok: false; reason: 'missing' | 'already_cleared' } {
  const rows = readLocal()
  const idx = rows.findIndex((h) => h.id === id)
  if (idx < 0) return { ok: false, reason: 'missing' }
  if (rows[idx].status !== 'active') return { ok: false, reason: 'already_cleared' }
  const updated: RaceHotspot = {
    ...rows[idx],
    status: 'cleared',
    cleared_by_team_name: teamName.trim(),
    cleared_at: new Date().toISOString(),
  }
  rows[idx] = updated
  writeLocal(rows)
  return { ok: true, hotspot: updated }
}

export async function uploadRaceHotspotImage(
  userId: string,
  hotspotId: string,
  file: File,
  index = 0,
): Promise<string> {
  const compressed = await compressImageFile(file)
  const path = `${userId}/${hotspotId}-${index}.jpg`

  const { error } = await supabase.storage
    .from('race-hotspot-images')
    .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })

  if (error) throw error

  const { data } = supabase.storage.from('race-hotspot-images').getPublicUrl(path)
  return data.publicUrl
}
