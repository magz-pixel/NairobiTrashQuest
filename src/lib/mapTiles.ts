/**
 * Raster basemap for the small Leaflet maps (report pin picker, shared hotspot page).
 * CARTO needs an API key now (without one every tile says "API KEY REQUIRED"). Until
 * VITE_CARTO_API_KEY is set, use OpenStreetMap's standard tiles: fine for this light use,
 * with attribution, under the OSM tile usage policy. The big map uses MapLibre + OpenFreeMap.
 */
const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY?.trim()

export const MAP_TILE_URL = cartoApiKey
  ? `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodeURIComponent(cartoApiKey)}`
  : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

export const MAP_TILE_ATTRIBUTION = cartoApiKey
  ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export const MAP_MAX_ZOOM = 17
