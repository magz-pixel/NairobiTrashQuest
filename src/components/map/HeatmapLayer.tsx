import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

const HEAT_GRADIENT = {
  0.2: '#39ff14',
  0.5: '#ffaa00',
  1.0: '#ff4500',
}

interface HeatmapLayerProps {
  points: [number, number, number][]
}

export function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap()

  useEffect(() => {
    if (points.length === 0) return

    const layer = L.heatLayer(points, {
      radius: 28,
      blur: 18,
      maxZoom: 17,
      max: 10,
      gradient: HEAT_GRADIENT,
    })
    layer.addTo(map)

    return () => {
      map.removeLayer(layer)
    }
  }, [map, points])

  return null
}
