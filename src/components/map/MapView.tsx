import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import type { RaceHotspot, Report } from '../../types/database'
import { useCity } from '../../lib/CityContext'
import { ClusterLayer } from './ClusterLayer'
import { HotspotLayer } from './HotspotLayer'
import { ReportPulseLayer } from './ReportPulseLayer'

const LIGHT_TILE =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

interface MapViewProps {
  reports: Report[]
  hotspots?: RaceHotspot[]
  onInteract?: () => void
  onSelectReport: (report: Report) => void
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

export function MapView({
  reports,
  hotspots = [],
  onInteract,
  onSelectReport,
  pulseAt,
  onPulseDone,
}: MapViewProps) {
  const city = useCity()
  return (
    <MapContainer
      key={city.slug}
      center={[city.center.lat, city.center.lng]}
      zoom={city.mapZoom}
      className="h-full w-full"
      zoomControl={false}
    >
      <MapInteractor onInteract={onInteract} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={LIGHT_TILE}
      />
      <ClusterLayer reports={reports} onSelectReport={onSelectReport} />
      <HotspotLayer hotspots={hotspots} />
      {pulseAt && (
        <ReportPulseLayer
          latitude={pulseAt.latitude}
          longitude={pulseAt.longitude}
          onDone={onPulseDone}
        />
      )}
    </MapContainer>
  )
}
