import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import type { Report } from '../../types/database'
import { HeatmapLayer } from './HeatmapLayer'
import { ClusterLayer } from './ClusterLayer'

const NAIROBI_CENTER: [number, number] = [-1.286389, 36.817223]

interface MapViewProps {
  reports: Report[]
  heatPoints: [number, number, number][]
  onInteract?: () => void
  onSelectReport: (report: Report) => void
  showHeatmap?: boolean
  lightBasemap?: boolean
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
  heatPoints,
  onInteract,
  onSelectReport,
  showHeatmap = true,
  lightBasemap = false,
}: MapViewProps) {
  const tileUrl = lightBasemap
    ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

  return (
    <MapContainer
      center={NAIROBI_CENTER}
      zoom={13}
      className="h-full w-full"
      zoomControl={false}
    >
      <MapInteractor onInteract={onInteract} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={tileUrl}
      />
      {showHeatmap && heatPoints.length > 0 && <HeatmapLayer points={heatPoints} />}
      <ClusterLayer reports={reports} onSelectReport={onSelectReport} />
    </MapContainer>
  )
}
