import { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import {
  HEAT_GRADIENT,
  heatBlurForZoom,
  heatMaxForZoom,
  heatRadiusForZoom,
} from '../../lib/heatmap'

interface HeatmapLayerProps {
  points: [number, number, number][]
}

export function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom())
    map.on('zoomend', onZoom)
    return () => {
      map.off('zoomend', onZoom)
    }
  }, [map])

  useEffect(() => {
    if (points.length === 0) return

    const layer = L.heatLayer(points, {
      radius: heatRadiusForZoom(zoom),
      blur: heatBlurForZoom(zoom),
      maxZoom: 18,
      max: heatMaxForZoom(zoom),
      minOpacity: zoom < 14 ? 0.2 : 0.14,
      gradient: HEAT_GRADIENT,
    })
    layer.addTo(map)

    return () => {
      map.removeLayer(layer)
    }
  }, [map, points, zoom])

  return null
}
