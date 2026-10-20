/** CARTO basemap. OpenStreetMap's own tile servers are not for production app traffic. */

const CARTO_TILE_BASE =
  'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'

const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY?.trim()

if (!cartoApiKey && import.meta.env.PROD) {
  console.warn(
    '[mapTiles] VITE_CARTO_API_KEY is not set; CARTO basemap tiles will show an "API KEY REQUIRED" watermark.',
  )
}

export const MAP_TILE_URL = cartoApiKey
  ? `${CARTO_TILE_BASE}?key=${encodeURIComponent(cartoApiKey)}`
  : CARTO_TILE_BASE

export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

export const MAP_MAX_ZOOM = 17
