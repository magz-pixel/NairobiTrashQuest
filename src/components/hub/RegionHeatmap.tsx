/**
 * East Africa heat map for the hub (Gemini-mockup look): dark brand-green basemap, glowing
 * trash heat, dots when you zoom in, tappable city labels. Lazy-loaded so MapLibre is only
 * downloaded when this section scrolls into view.
 */
import { useEffect, useRef, useState } from 'react'
import maplibregl, { type GeoJSONSource, type Map as MLMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useNavigate } from 'react-router-dom'
import { brandedStyle } from '../../lib/mapStyle'
import { cityPath, getActiveCities, getCity } from '../../lib/cities'
import type { RegionPoint } from '../../lib/demoRegion'

const REGION_BOUNDS: [[number, number], [number, number]] = [
  [31.3, -7.9],
  [40.7, 0.8],
]

function toGeoJSON(points: RegionPoint[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      properties: { severity: p.severity, cleared: p.cleared ? 1 : 0 },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })),
  }
}

export default function RegionHeatmap({
  points,
  counts,
  focus = null,
}: {
  points: RegionPoint[]
  /** Open spots per city slug, shown on the city labels. */
  counts: Record<string, number>
  /** City slug to fly to (zoomed in, still macro), or null for all of East Africa. */
  focus?: string | null
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const [ready, setReady] = useState(false)
  const navigate = useNavigate()
  const navRef = useRef(navigate)
  useEffect(() => {
    navRef.current = navigate
  })

  useEffect(() => {
    let cancelled = false
    let map: MLMap | null = null
    void brandedStyle('night').then((style) => {
      if (cancelled || !ref.current) return
      map = new maplibregl.Map({
        container: ref.current,
        style,
        bounds: REGION_BOUNDS,
        fitBoundsOptions: { padding: 24 },
        maxZoom: 15,
        minZoom: 3.5,
        dragRotate: false,
        pitchWithRotate: false,
        // Two fingers to pan on phones so the page still scrolls past the map.
        cooperativeGestures: true,
        attributionControl: { compact: true },
      })
      map.scrollZoom.disable()
      map.touchZoomRotate.disableRotation()
      map.once('style.load', () => {
        if (!map) return
        map.addSource('region', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        map.addLayer({
          id: 'region-heat',
          type: 'heatmap',
          source: 'region',
          maxzoom: 13,
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'severity'], 1, 0.15, 10, 0.6],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.35, 8, 0.8, 12, 1.6],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 18, 8, 22, 12, 30],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(239,90,50,0)',
              0.3, 'rgba(239,90,50,.25)',
              0.7, 'rgba(232,70,45,.45)',
              1, 'rgba(250,140,60,.6)',
            ],
          },
        })
        // Gemini-style glowing dots at every zoom.
        map.addLayer({
          id: 'region-glow',
          type: 'circle',
          source: 'region',
          paint: {
            'circle-color': ['case', ['==', ['get', 'cleared'], 1], '#2dd4bf', ['interpolate', ['linear'], ['get', 'severity'], 1, '#fbbf24', 6, '#f97316', 10, '#ef4444']],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 3.2, 8, 5, 12, 9],
            'circle-blur': 1,
            'circle-opacity': 0.35,
          },
        })
        map.addLayer({
          id: 'region-dots',
          type: 'circle',
          source: 'region',
          paint: {
            'circle-color': ['case', ['==', ['get', 'cleared'], 1], '#5eead4', ['interpolate', ['linear'], ['get', 'severity'], 1, '#fcd34d', 6, '#fb923c', 10, '#f87171']],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 1.1, 8, 2, 12, 3.6, 15, 6],
            'circle-opacity': 0.9,
          },
        })
        mapRef.current = map
        setReady(true)
      })
    })
    return () => {
      cancelled = true
      mapRef.current = null
      map?.remove()
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    ;(mapRef.current?.getSource('region') as GeoJSONSource | undefined)?.setData(toGeoJSON(points))
  }, [ready, points])

  // Slideshow: fly to the selected city, or back out to the whole region.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    if (!focus) {
      map.fitBounds(REGION_BOUNDS, { padding: 24, duration: 1600 })
      return
    }
    const c = getCity(focus)
    const phone = map.getContainer().clientWidth < 520
    map.flyTo({ center: [c.center.lng, c.center.lat], zoom: phone ? 10.2 : 10.8, duration: 2200, essential: true })
  }, [ready, focus])

  // City labels: tap to open that city's map.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const markers = getActiveCities().map((c) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'rt-marker rt-region-label'
      const n = counts[c.slug]
      el.innerHTML = `<span class="dot"></span>${c.label}${typeof n === 'number' ? `<b>${n.toLocaleString()}</b>` : ''}`
      el.setAttribute('aria-label', `Open the ${c.label} map`)
      el.addEventListener('click', () => navRef.current(cityPath(c.slug, '/map')))
      return new maplibregl.Marker({ element: el, anchor: 'top', offset: [0, 16] })
        .setLngLat([c.center.lng, c.center.lat])
        .addTo(map)
    })
    return () => markers.forEach((m) => m.remove())
  }, [ready, counts])

  return <div ref={ref} className="map-canvas h-full w-full" />
}
