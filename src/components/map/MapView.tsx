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
  onInteract?: () => void
  onSelectReport: (report: Report) => void
  onLocated: (lat: number, lng: number) => void
  pulseAt?: { latitude: number; longitude: number } | null
  onPulseDone?: () => void
}

function MapInteractor({ onInteract }: { onInteract?: () => void }) {
  useMapEvents({
    click() {
      onInteract?.()
    },
    dragstart() {
      onInteract?.()
    },
  })
  return null
}

function MapFocus({ target }: { target: MapFocusTarget | null | undefined }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    map.flyTo([target.lat, target.lng], target.zoom ?? Math.max(map.getZoom(), 15), {
      duration: 0.7,
    })
  }, [map, target])
  return null
}

export function MapView({
  reports,
  hotspots = [],
  selectedId,
  focusAt,
  onInteract,
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
      <MapInteractor onInteract={onInteract} />
      <MapFocus target={focusAt} />
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
