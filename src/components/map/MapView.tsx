import { MapContainer, TileLayer } from 'react-leaflet'
import type { Report } from '../../types/database'
import { HeatmapLayer } from './HeatmapLayer'
import { ZoomGatedMarkers } from './ZoomGatedMarkers'

const NAIROBI_CENTER: [number, number] = [-1.286389, 36.817223]

interface MapViewProps {
  reports: Report[]
  heatPoints: [number, number, number][]
}

export function MapView({ reports, heatPoints }: MapViewProps) {
  return (
    <MapContainer
      center={NAIROBI_CENTER}
      zoom={13}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {heatPoints.length > 0 && <HeatmapLayer points={heatPoints} />}
      <ZoomGatedMarkers reports={reports} minZoom={15} />
    </MapContainer>
  )
}
