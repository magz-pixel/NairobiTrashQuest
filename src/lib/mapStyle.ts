/**
 * Ramani-Taka basemap: OpenFreeMap's free OpenStreetMap vector tiles (no API key, no limits),
 * recoloured to the brand. Two moods: "day" (warm cream, soft greens) and "night"
 * (deep green), picked from the city's local time like the CitySky backdrop.
 */
import type { StyleSpecification } from 'maplibre-gl'

const BASE_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

export type MapMood = 'day' | 'night'

const PALETTE: Record<MapMood, Record<string, string>> = {
  day: {
    background: '#f3efe4',
    residential: '#efe9da',
    park: '#d7ead0',
    wood: '#cfe5c7',
    water: '#b9dcdc',
    waterway: '#a7d0d1',
    building: '#e6dfcf',
    road: '#ffffff',
    roadCasing: '#e3dccb',
    roadMajor: '#fdf6e3',
    rail: '#d6cfbf',
    boundary: '#b9b2a2',
    label: '#4a6159',
    labelHalo: '#f8f5ec',
    labelMinor: '#7b8c85',
  },
  night: {
    background: '#0c2622',
    residential: '#0f2c27',
    park: '#123a2f',
    wood: '#133d31',
    water: '#0b3a40',
    waterway: '#0f4a50',
    building: '#15342e',
    road: '#1f4a42',
    roadCasing: '#0c2622',
    roadMajor: '#2b5a50',
    rail: '#1c403a',
    boundary: '#2d5a50',
    label: '#b9d8cf',
    labelHalo: '#0c2622',
    labelMinor: '#86a89f',
  },
}

let baseStylePromise: Promise<StyleSpecification> | null = null

function loadBase(): Promise<StyleSpecification> {
  baseStylePromise ??= fetch(BASE_STYLE_URL).then((r) => {
    if (!r.ok) throw new Error(`Basemap style failed: ${r.status}`)
    return r.json() as Promise<StyleSpecification>
  })
  return baseStylePromise
}

type AnyLayer = StyleSpecification['layers'][number] & { paint?: Record<string, unknown>; layout?: Record<string, unknown> }

export async function brandedStyle(mood: MapMood): Promise<StyleSpecification> {
  const base = await loadBase()
  const c = PALETTE[mood]
  const style: StyleSpecification = JSON.parse(JSON.stringify(base))

  style.layers = (style.layers as AnyLayer[])
    // Busy US road shields and ice layers add nothing in East Africa.
    .filter((l) => !/shield|ice_shelf|glacier|aeroway-taxiway/.test(l.id))
    .map((layer) => {
      const l = layer as AnyLayer
      const paint = (l.paint ??= {})
      const id = l.id
      if (l.type === 'background') paint['background-color'] = c.background
      else if (id === 'park') paint['fill-color'] = c.park
      else if (id.startsWith('landcover_wood')) paint['fill-color'] = c.wood
      else if (id.startsWith('landuse_residential')) paint['fill-color'] = c.residential
      else if (/aeroway/.test(id)) {
        // Runways are pure white in the base style and glare on the night map.
        if (l.type === 'fill') paint['fill-color'] = c.residential
        else paint['line-color'] = c.roadCasing
      } else if (id === 'water') paint['fill-color'] = c.water
      else if (id === 'waterway') paint['line-color'] = c.waterway
      else if (id === 'building') {
        paint['fill-color'] = c.building
        paint['fill-opacity'] = mood === 'day' ? 0.7 : 0.8
      } else if (l.type === 'line' && /casing/.test(id)) paint['line-color'] = c.roadCasing
      else if (l.type === 'line' && /motorway|major/.test(id)) paint['line-color'] = c.roadMajor
      else if (l.type === 'line' && /highway|road|path/.test(id)) paint['line-color'] = c.road
      else if (l.type === 'line' && /rail/.test(id)) paint['line-color'] = c.rail
      else if (l.type === 'line' && /boundary/.test(id)) paint['line-color'] = c.boundary
      else if (l.type === 'symbol') {
        const minor = /highway-name|waterway|water_name/.test(id)
        paint['text-color'] = minor ? c.labelMinor : c.label
        paint['text-halo-color'] = c.labelHalo
        paint['text-halo-width'] = 1.4
      }
      return l
    })
  return style
}
