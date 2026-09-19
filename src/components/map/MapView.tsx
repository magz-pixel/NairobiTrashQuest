import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { RaceHotspot, Report } from '../../types/database'
import { useCity } from '../../lib/CityContext'
import { ClusterLayer } from './ClusterLayer'
import { HotspotLayer } from './HotspotLayer'
import { MapControls } from './MapControls'
import { ReportPulseLayer } from './ReportPulseLayer'

const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

export interface MapFocusTarget {
  lat: number
  lng: number
  zoom?: number
}

interface MapViewProps {
  reports: Report[]
  hotspots?: RaceHotspot[]
  selectedId?: string | null
  focusAt?: MapFocusTarget | null
  paddingBottom?: number
  onMapClick?: () => void
  onDragStart?: () => void
  onSelectReport: (report: Report) => void
  onLocated: (lat: number, lng: number) => void
  pulseAt?: { latitude: number; longitude: number } | null
  onPulseDone?: () => void
}

function MapInteractor({
  onMapClick,
  onDragStart,
}: {
  onMapClick?: () => void
  onDragStart?: () => void
}) {
  useMapEvents({
    click(e) {
      const target = e.originalEvent.target as HTMLElement | null
      if (target?.closest('.leaflet-marker-icon, .cluster-marker, .map-pin')) return
      onMapClick?.()
    },
    dragstart() {
      onDragStart?.()
    },
  })
  return null
}

function MapFocus({
  target,
  paddingBottom = 0,
}: {
  target: MapFocusTarget | null | undefined
  paddingBottom?: number
}) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    const zoom = target.zoom ?? Math.max(map.getZoom(), 15)
    map.invalidateSize()
    const point = map.project([target.lat, target.lng], zoom)
    point.y += paddingBottom / 2
    map.flyTo(map.unproject(point, zoom), zoom, { duration: 0.65 })
  }, [map, target, paddingBottom])
  return null
}

export function MapView({
  reports,
  hotspots = [],
  selectedId,
  focusAt,
  paddingBottom = 0,
  onMapClick,
  onDragStart,
  onSelectReport,
  onLocated,
  pulseAt,
  onPulseDone,
}: MapViewProps) {
  const city = useCity()
  return (
    <MapContainer
      key={city.slug}
      center={[city.center.lat, city.center.lng]}
      zoom={city.mapZoom}
      className="map-canvas h-full w-full"
      zoomControl={false}
      attributionControl
    >
      <MapInteractor onMapClick={onMapClick} onDragStart={onDragStart} />
      <MapFocus target={focusAt} paddingBottom={paddingBottom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={OSM_TILE}
      />
      <ClusterLayer reports={reports} selectedId={selectedId} onSelectReport={onSelectReport} />
      <HotspotLayer hotspots={hotspots} />
      {pulseAt && (
        <ReportPulseLayer
          latitude={pulseAt.latitude}
          longitude={pulseAt.longitude}
          onDone={onPulseDone}
        />
      )}
      <MapControls onLocated={onLocated} />
    </MapContainer>
  )
}
