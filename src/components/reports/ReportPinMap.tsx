import { useMemo } from 'react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { MAP_MAX_ZOOM, MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from '../../lib/mapTiles'

const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:999px;background:#063b32;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export function ReportPinMap({
  lat,
  lng,
  onChange,
  readOnly = false,
  className = 'h-40',
}: {
  lat: number
  lng: number
  onChange?: (lat: number, lng: number) => void
  /** Show-only map (shared hotspot pages): fixed pin. */
  readOnly?: boolean
  className?: string
}) {
  const handlers = useMemo(
    () => ({
      dragend(event: L.LeafletEvent) {
        const point = event.target.getLatLng() as L.LatLng
        onChange?.(point.lat, point.lng)
      },
    }),
    [onChange],
  )

  return (
    <div className={`${className} overflow-hidden rounded-lg`}>
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        maxZoom={MAP_MAX_ZOOM}
        className="h-full w-full"
        zoomControl={false}
        attributionControl
      >
        <TileLayer attribution={MAP_TILE_ATTRIBUTION} url={MAP_TILE_URL} maxZoom={MAP_MAX_ZOOM} />
        <Marker position={[lat, lng]} icon={pinIcon} draggable={!readOnly} eventHandlers={readOnly ? undefined : handlers} />
      </MapContainer>
    </div>
  )
}
