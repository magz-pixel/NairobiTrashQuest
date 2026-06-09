import { useEffect, useState } from 'react'
import { CircleMarker, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Report } from '../../types/database'
import { clusterColor, clusterReports, formatClusterCount } from '../../lib/clusters'

interface ClusterLayerProps {
  reports: Report[]
  onSelectReport: (report: Report) => void
}

function clusterIcon(count: number, color: string) {
  const size = count > 99 ? 44 : count > 9 ? 38 : 32
  return L.divIcon({
    className: 'cluster-marker',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};color:#fff;
      border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:12px;border:2px solid rgba(255,255,255,0.85);
      box-shadow:0 2px 8px rgba(0,0,0,0.45);
    ">${formatClusterCount(count)}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export function ClusterLayer({ reports, onSelectReport }: ClusterLayerProps) {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())

  useEffect(() => {
    const update = () => setZoom(map.getZoom())
    map.on('zoomend', update)
    return () => {
      map.off('zoomend', update)
    }
  }, [map])

  const clusters = clusterReports(reports, zoom)

  return (
    <>
      {clusters.map((cluster) => {
        if (cluster.count === 1) {
          const r = cluster.reports[0]
          return (
            <CircleMarker
              key={r.id}
              center={[r.latitude, r.longitude]}
              radius={8}
              pathOptions={{
                color: clusterColor(r.severity_score),
                fillColor: clusterColor(r.severity_score),
                fillOpacity: 0.85,
                weight: 2,
              }}
              eventHandlers={{ click: () => onSelectReport(r) }}
            />
          )
        }

        return (
          <Marker
            key={cluster.id}
            position={[cluster.latitude, cluster.longitude]}
            icon={clusterIcon(cluster.count, clusterColor(cluster.maxSeverity))}
            eventHandlers={{
              click: () => onSelectReport(cluster.reports[0]),
            }}
          >
            <Popup>
              <span className="text-sm">{cluster.count} reports in this area</span>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}
