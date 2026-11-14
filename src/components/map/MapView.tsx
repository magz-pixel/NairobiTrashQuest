/**
 * Map v2 — MapLibre GL (WebGL vector map) with a story told by zoom level:
 *  - City zoom: hexagon density (where the city hurts) + counted clusters
 *  - Neighbourhood zoom: soft heat glow under the clusters
 *  - Street zoom: individual pins (open = coral by severity, cleared = teal)
 * Cleanups and race hotspots are HTML markers on top. Basemap is OpenFreeMap vector
 * tiles recoloured to the brand, dark at night (same clock as the CitySky backdrop).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { type GeoJSONSource, type Map as MLMap, type MapLayerMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Event, RaceHotspot, Report } from '../../types/database'
import { useCity } from '../../lib/CityContext'
import { getCurrentPosition } from '../../lib/geo'
import { brandedStyle, type MapMood } from '../../lib/mapStyle'
import { hexbinReports, reportsToPoints } from '../../lib/hexbin'
import { skyPhase } from '../../lib/sky'
import { hasPin } from '../../lib/events'
import { eventPinElement, hotspotChipElement, pulseElement } from './markerHtml'
import { HotspotDetailSheet } from './HotspotDetailSheet'

export interface MapFocusTarget {
  lat: number
  lng: number
  zoom?: number
}

interface MapViewProps {
  reports: Report[]
  hotspots?: RaceHotspot[]
  events?: Event[]
  selectedEventId?: string | null
  onSelectEvent?: (event: Event) => void
  selectedId?: string | null
  focusAt?: MapFocusTarget | null
  paddingBottom?: number
  onMapClick?: () => void
  onDragStart?: () => void
  onSelectReport: (report: Report) => void
  onLocated: (lat: number, lng: number) => void
  pulseAt?: { latitude: number; longitude: number } | null
  /** Ward boundaries with open/cleared counts (see useCityWards). Replaces the hexagons when present. */
  wards?: GeoJSON.FeatureCollection | null
  selectedWard?: string | null
  onSelectWard?: (wardId: number) => void
  onPulseDone?: () => void
  /** Fit the view to these bounds [west, south, east, north] (e.g. a ward). */
  focusBounds?: [number, number, number, number] | null
}

const MAX_ZOOM = 18
const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
const FONT_BOLD = ['Noto Sans Bold']

function addStoryLayers(map: MLMap, mood: MapMood) {
  const ring = mood === 'night' ? '#0c2622' : '#ffffff'

  map.addSource('wards', { type: 'geojson', data: EMPTY })
  map.addSource('hexes', { type: 'geojson', data: EMPTY })

  // 0. Wards (Namma Kasa-style): shaded by open spots, outlined, named when you zoom in.
  map.addLayer({
    id: 'ward-fill',
    type: 'fill',
    source: 'wards',
    paint: {
      'fill-color': [
        'step',
        ['get', 'open'],
        mood === 'night' ? 'rgba(185,216,207,0.04)' : 'rgba(255,255,255,0.01)',
        1, '#fde3c8',
        3, '#f9bf8f',
        6, '#f19466',
        12, '#dc5c4a',
        20, '#a8302a',
      ],
      'fill-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.7, 13, 0.5, 15.5, 0.14],
    },
  })
  map.addLayer({
    id: 'ward-line',
    type: 'line',
    source: 'wards',
    paint: {
      'line-color': mood === 'night' ? '#3d6b61' : '#c3b79d',
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.5, 13, 1.2, 16, 2],
      'line-opacity': 0.9,
      'line-dasharray': [3, 2],
    },
  })
  map.addLayer({
    id: 'ward-selected',
    type: 'line',
    source: 'wards',
    filter: ['==', ['get', 'name'], ''],
    paint: { 'line-color': '#fbbf24', 'line-width': 3.5 },
  })
  map.addLayer({
    id: 'ward-label',
    type: 'symbol',
    source: 'wards',
    minzoom: 12.2,
    layout: {
      'text-field': [
        'case',
        ['>', ['get', 'open'], 0],
        ['format', ['upcase', ['get', 'name']], {}, '\n', {}, ['concat', ['to-string', ['get', 'open']], ' open'], { 'font-scale': 0.9 }],
        ['upcase', ['get', 'name']],
      ],
      'text-font': FONT_BOLD,
      'text-size': ['interpolate', ['linear'], ['zoom'], 12, 9, 15, 12],
      'text-letter-spacing': 0.08,
      'text-max-width': 8,
    },
    paint: {
      'text-color': mood === 'night' ? '#cfe6df' : '#6b5d45',
      'text-halo-color': mood === 'night' ? '#0c2622' : '#f8f5ec',
      'text-halo-width': 1.6,
      'text-opacity': ['interpolate', ['linear'], ['zoom'], 12.2, 0, 12.8, 1],
    },
  })
  map.addSource('heat', { type: 'geojson', data: EMPTY })
  map.addSource('reports', {
    type: 'geojson',
    data: EMPTY,
    cluster: true,
    clusterMaxZoom: 15,
    clusterRadius: 46,
    clusterProperties: { severitySum: ['+', ['get', 'severity']], clearedSum: ['+', ['get', 'cleared']] },
  })
  map.addSource('selected', { type: 'geojson', data: EMPTY })

  // 1. City zoom: hexagon density, fades out as you zoom into streets.
  map.addLayer({
    id: 'hex-fill',
    type: 'fill',
    source: 'hexes',
    maxzoom: 15,
    paint: {
      'fill-color': ['step', ['get', 'count'], '#fde3c8', 2, '#f9bf8f', 4, '#f19466', 8, '#dc5c4a', 15, '#a8302a'],
      'fill-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.62, 13, 0.5, 14.5, 0],
    },
  })
  map.addLayer({
    id: 'hex-line',
    type: 'line',
    source: 'hexes',
    maxzoom: 15,
    paint: {
      'line-color': ring,
      'line-width': 1.2,
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.7, 14.5, 0],
    },
  })

  // 2. Neighbourhood zoom: soft heat glow.
  map.addLayer({
    id: 'heat',
    type: 'heatmap',
    source: 'heat',
    minzoom: 11,
    maxzoom: 17,
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'severity'], 1, 0.35, 10, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 0.6, 16, 1.6],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 14, 14, 30, 16, 46],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(255,200,120,0)',
        0.25, 'rgba(251,191,36,.35)',
        0.5, 'rgba(239,130,104,.55)',
        0.8, 'rgba(220,70,60,.7)',
        1, 'rgba(160,30,30,.8)',
      ],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0, 12.5, 0.75, 15.5, 0.45, 17, 0],
    },
  })

  // 3. Counted clusters (Namma Kasa-style numbers), coloured by how many open spots.
  map.addLayer({
    id: 'cluster-glow',
    type: 'circle',
    source: 'reports',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#ef8268', 5, '#dc5c4a', 15, '#a8302a'],
      'circle-radius': ['step', ['get', 'point_count'], 28, 5, 34, 15, 44],
      'circle-opacity': 0.22,
      'circle-blur': 0.6,
    },
  })
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'reports',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'case',
        ['==', ['get', 'clearedSum'], ['get', 'point_count']],
        '#0b8c76',
        ['step', ['get', 'point_count'], '#ef8268', 5, '#dc5c4a', 15, '#a8302a'],
      ],
      'circle-radius': ['step', ['get', 'point_count'], 17, 5, 22, 15, 29],
      'circle-stroke-color': ring,
      'circle-stroke-width': 3,
    },
  })
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'reports',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': FONT_BOLD,
      'text-size': ['step', ['get', 'point_count'], 13, 15, 15],
      'text-allow-overlap': true,
    },
    paint: { 'text-color': '#ffffff' },
  })

  // 4. Street zoom: individual spots.
  map.addLayer({
    id: 'points',
    type: 'circle',
    source: 'reports',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'case',
        ['==', ['get', 'cleared'], 1],
        '#0b8c76',
        ['interpolate', ['linear'], ['get', 'severity'], 1, '#f4a261', 5, '#ef8268', 8, '#d9483b', 10, '#a8302a'],
      ],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 5, 15, 8, 18, 12],
      'circle-stroke-color': ring,
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 11, 1.5, 16, 3],
    },
  })
  map.addLayer({
    id: 'selected-ring',
    type: 'circle',
    source: 'selected',
    paint: {
      'circle-color': 'rgba(0,0,0,0)',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 11, 16, 16, 18, 20],
      'circle-stroke-color': '#fbbf24',
      'circle-stroke-width': 4,
    },
  })
}

export function MapView({
  reports,
  hotspots = [],
  events = [],
  selectedEventId,
  onSelectEvent,
  selectedId,
  focusAt,
  paddingBottom = 0,
  onMapClick,
  onDragStart,
  onSelectReport,
  onLocated,
  pulseAt,
  onPulseDone,
  wards,
  selectedWard,
  onSelectWard,
  focusBounds,
}: MapViewProps) {
  const city = useCity()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const [retry, setRetry] = useState(0)
  const [hotspot, setHotspot] = useState<RaceHotspot | null>(null)
  const mood: MapMood = skyPhase(city.slug) === 'night' ? 'night' : 'day'
  // Which map instance is ready / failed. Keyed so a city or mood change resets both without extra renders.
  const mapKey = `${city.slug}:${mood}:${retry}`
  const [readyKey, setReadyKey] = useState<string | null>(null)
  const [failedKey, setFailedKey] = useState<string | null>(null)
  const ready = readyKey === mapKey
  const failed = failedKey === mapKey

  const reportsById = useMemo(() => new Map(reports.map((r) => [r.id, r])), [reports])

  // Latest props for map event handlers registered once per map instance.
  const latest = useRef({ onSelectReport, onMapClick, onDragStart, onSelectEvent, onSelectWard, reportsById, paddingBottom })
  useLayoutEffect(() => {
    latest.current = { onSelectReport, onMapClick, onDragStart, onSelectEvent, onSelectWard, reportsById, paddingBottom }
  })

  const framed = useRef(false)

  // Create the map (once per city / day-night mood).
  useEffect(() => {
    let cancelled = false
    let map: MLMap | null = null
    framed.current = false
    brandedStyle(mood)
      .then((style) => {
        if (cancelled || !containerRef.current) return
        map = new maplibregl.Map({
          container: containerRef.current,
          style,
          center: [city.center.lng, city.center.lat],
          zoom: city.mapZoom,
          maxZoom: MAX_ZOOM,
          attributionControl: {
            compact: true,
            // Ward boundaries: geoBoundaries (KEN wards CC BY 4.0, UGA CC BY 3.0 IGO, TZA ODbL).
            customAttribution:
              'Wards: <a href="https://www.geoboundaries.org" target="_blank" rel="noopener">geoBoundaries</a> (CC BY 4.0 / CC BY 3.0 IGO / ODbL)',
          },
          dragRotate: false,
          pitchWithRotate: false,
        })
        map.touchZoomRotate.disableRotation()
        if (import.meta.env.DEV) (window as unknown as { __rtMap?: MLMap }).__rtMap = map
        map.on('error', (e) => console.warn('[map]', e.error?.message ?? e))
        // 'style.load' fires as soon as the style is parsed; 'load' would wait for every basemap
        // tile, which on slow mobile data holds back the hotspots for seconds.
        map.once('style.load', () => {
          if (!map) return
          addStoryLayers(map, mood)
          mapRef.current = map
          setReadyKey(mapKey)
        })
        map.on('click', 'clusters', async (e: MapLayerMouseEvent) => {
          const f = e.features?.[0]
          if (!f || !map) return
          const source = map.getSource('reports') as GeoJSONSource
          const zoom = await source.getClusterExpansionZoom(f.properties.cluster_id as number)
          map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: zoom + 0.3, duration: 550 })
        })
        map.on('click', 'points', (e: MapLayerMouseEvent) => {
          const id = e.features?.[0]?.properties?.id as string | undefined
          const report = id ? latest.current.reportsById.get(id) : undefined
          if (report) latest.current.onSelectReport(report)
        })
        map.on('click', (e) => {
          if (!map) return
          const hit = map.queryRenderedFeatures(e.point, { layers: ['clusters', 'points'] })
          const onMarker = (e.originalEvent.target as HTMLElement | null)?.closest('.rt-marker')
          if (hit.length > 0 || onMarker) return
          const ward = latest.current.onSelectWard ? map.queryRenderedFeatures(e.point, { layers: ['ward-fill'] })[0] : undefined
          if (ward && ward.id !== undefined) latest.current.onSelectWard?.(Number(ward.id))
          else latest.current.onMapClick?.()
        })
        map.on('dragstart', () => latest.current.onDragStart?.())
        for (const layer of ['clusters', 'points']) {
          map.on('mouseenter', layer, () => map && (map.getCanvas().style.cursor = 'pointer'))
          map.on('mouseleave', layer, () => map && (map.getCanvas().style.cursor = ''))
        }
      })
      .catch(() => !cancelled && setFailedKey(mapKey))
    return () => {
      cancelled = true
      mapRef.current = null
      map?.remove()
    }
  }, [city.center.lat, city.center.lng, city.mapZoom, mood, mapKey])

  // Feed data into the story layers.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const open = reports.filter((r) => r.status === 'active' || r.status === 'flagged')
    ;(map.getSource('reports') as GeoJSONSource | undefined)?.setData(reportsToPoints(reports))
    ;(map.getSource('heat') as GeoJSONSource | undefined)?.setData(reportsToPoints(open))
    ;(map.getSource('hexes') as GeoJSONSource | undefined)?.setData(hexbinReports(open, 700))

    // First time we have data for this map: frame every open spot so the story is visible at a glance.
    if (!framed.current && open.length > 1) {
      framed.current = true
      const bounds = new maplibregl.LngLatBounds()
      for (const r of open) bounds.extend([r.longitude, r.latitude])
      map.fitBounds(bounds, {
        padding: { top: 200, bottom: 150 + latest.current.paddingBottom, left: 80, right: 90 },
        maxZoom: 14.5,
        duration: 0,
      })
    }
  }, [ready, reports])

  // Ward polygons (with counts). When wards are available they tell the city-zoom story, so hide the hexes.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    ;(map.getSource('wards') as GeoJSONSource | undefined)?.setData(wards ?? EMPTY)
    const hexVisibility = wards && wards.features.length > 0 ? 'none' : 'visible'
    for (const id of ['hex-fill', 'hex-line']) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', hexVisibility)
  }, [ready, wards])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !map.getLayer('ward-selected')) return
    map.setFilter('ward-selected', ['==', ['get', 'name'], selectedWard ?? ''])
  }, [ready, selectedWard])

  // Gold ring on the selected spot.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const r = selectedId ? reportsById.get(selectedId) : undefined
    ;(map.getSource('selected') as GeoJSONSource | undefined)?.setData(r ? reportsToPoints([r]) : EMPTY)
  }, [ready, selectedId, reportsById])

  // Cleanup calendar tiles.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !onSelectEvent) return
    const markers = events.filter(hasPin).map((e) => {
      const el = eventPinElement(e, e.id === selectedEventId)
      el.addEventListener('click', (ev) => {
        ev.stopPropagation()
        latest.current.onSelectEvent?.(e)
      })
      return new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([e.longitude, e.latitude]).addTo(map)
    })
    return () => markers.forEach((m) => m.remove())
  }, [ready, events, selectedEventId, onSelectEvent])

  // Race hotspot chips.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const markers = hotspots.map((h) => {
      const el = hotspotChipElement(h.point_value, h.is_funded, h.label)
      el.addEventListener('click', (ev) => {
        ev.stopPropagation()
        setHotspot(h)
      })
      return new maplibregl.Marker({ element: el }).setLngLat([h.longitude, h.latitude]).addTo(map)
    })
    return () => markers.forEach((m) => m.remove())
  }, [ready, hotspots])

  // Fly to a requested spot, keeping it above the phone bottom sheet.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !focusAt) return
    map.flyTo({
      center: [focusAt.lng, focusAt.lat],
      zoom: Math.min(17, focusAt.zoom ?? Math.max(map.getZoom(), 15)),
      padding: { top: 0, left: 0, right: 0, bottom: paddingBottom },
      duration: 900,
      essential: true,
    })
  }, [ready, focusAt, paddingBottom])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !focusBounds) return
    map.fitBounds(focusBounds, {
      // On desktop the ward card sits on the right (24rem), so keep the ward clear of it.
      padding: { top: 140, bottom: 80 + paddingBottom, left: 40, right: window.innerWidth >= 768 ? 430 : 40 },
      maxZoom: 16,
      duration: 900,
    })
  }, [ready, focusBounds, paddingBottom])

  // "Just reported" pulse.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !pulseAt) return
    const marker = new maplibregl.Marker({ element: pulseElement() }).setLngLat([pulseAt.longitude, pulseAt.latitude]).addTo(map)
    map.flyTo({ center: [pulseAt.longitude, pulseAt.latitude], zoom: Math.max(map.getZoom(), 15.5), duration: 900 })
    const t = window.setTimeout(() => {
      marker.remove()
      onPulseDone?.()
    }, 3200)
    return () => {
      window.clearTimeout(t)
      marker.remove()
    }
  }, [ready, pulseAt, onPulseDone])

  const locate = async () => {
    try {
      const pos = await getCurrentPosition()
      onLocated(pos.coords.latitude, pos.coords.longitude)
    } catch {
      /* permission denied: stay put */
    }
  }

  const ctrl =
    'grid h-11 w-11 place-items-center rounded-2xl border border-white/80 bg-white/95 text-lg font-extrabold text-[#063b32] shadow-[0_12px_30px_rgba(6,59,50,.14)] backdrop-blur'

  return (
    <div className={`map-canvas relative h-full w-full ${mood === 'night' ? 'bg-[#0c2622]' : 'bg-[#f3efe4]'}`}>
      {/* maplibre-gl.css forces position:relative on the container, so size it explicitly. */}
      <div ref={containerRef} className="h-full w-full" style={{ position: 'absolute', inset: 0 }} />
      {!ready && !failed ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-bold text-[#0b8c76]">
          Opening the {city.label} map…
        </div>
      ) : null}
      {failed ? (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div>
            <p className="font-bold text-[#063b32]">The map couldn’t load. Check your connection.</p>
            <button
              type="button"
              onClick={() => setRetry((n) => n + 1)}
              className="mt-3 rounded-full bg-[#063b32] px-5 py-2.5 text-sm font-bold text-white"
            >
              Try again
            </button>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-auto absolute right-3 top-[5.5rem] z-[1050] hidden flex-col gap-2 md:right-4 md:top-[6.25rem] md:flex">
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} className={ctrl}>
          +
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} className={ctrl}>
          −
        </button>
        <button
          type="button"
          aria-label="Show my location"
          onClick={() => void locate()}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/80 bg-[#063b32] text-white shadow-[0_12px_30px_rgba(6,59,50,.24)]"
        >
          <LocateIcon />
        </button>
      </div>
      <button
        type="button"
        aria-label="Show my location"
        onClick={() => void locate()}
        className="map-thumb-control pointer-events-auto absolute left-3 z-[1070] grid h-12 w-12 place-items-center rounded-full border border-white/80 bg-[#063b32] text-white shadow-[0_14px_32px_rgba(6,59,50,.28)] md:hidden"
      >
        <LocateIcon />
      </button>

      <HotspotDetailSheet hotspot={hotspot} onClose={() => setHotspot(null)} />
    </div>
  )
}

function LocateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  )
}
