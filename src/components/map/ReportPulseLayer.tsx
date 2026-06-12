import { useEffect } from 'react'
import { CircleMarker, useMap } from 'react-leaflet'

interface ReportPulseLayerProps {
  latitude: number
  longitude: number
  onDone?: () => void
}

export function ReportPulseLayer({ latitude, longitude, onDone }: ReportPulseLayerProps) {
  const map = useMap()

  useEffect(() => {
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), { duration: 0.8 })
    const timer = setTimeout(() => onDone?.(), 3000)
    return () => clearTimeout(timer)
  }, [latitude, longitude, map, onDone])

  return (
    <>
      <CircleMarker
        center={[latitude, longitude]}
        radius={24}
        pathOptions={{
          color: 'transparent',
          fillColor: '#f97316',
          fillOpacity: 0.15,
          weight: 0,
          className: 'pulse-ring',
        }}
      />
      <CircleMarker
        center={[latitude, longitude]}
        radius={10}
        pathOptions={{
          color: '#ffffff',
          fillColor: '#f97316',
          fillOpacity: 0.95,
          weight: 3,
        }}
      />
    </>
  )
}
