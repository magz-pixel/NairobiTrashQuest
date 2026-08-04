import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import type { Report } from '../../types/database'
import { marketConfig } from '../../lib/marketConfig'
import { ClusterLayer } from './ClusterLayer'
import { ReportPulseLayer } from './ReportPulseLayer'

const LIGHT_TILE =
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

interface MapViewProps {
  reports: Report[]
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
  onInteract,
  onSelectReport,
  pulseAt,
  onPulseDone,
}: MapViewProps) {
  return (
    <MapContainer
      center={marketConfig.mapCenter}
      zoom={marketConfig.mapZoom}
      className="h-full w-full"
      zoomControl={false}
    >
      <MapInteractor onInteract={onInteract} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url={LIGHT_TILE}
      />
      <ClusterLayer reports={reports} onSelectReport={onSelectReport} />
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
