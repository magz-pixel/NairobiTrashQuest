import { useEffect, useState } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Report } from '../../types/database'
import {
  clusterColor,
  clusterReports,
  clusterSize,
  formatClusterCount,
  pinSize,
} from '../../lib/clusters'

interface ClusterLayerProps {
  reports: Report[]
  onSelectReport: (report: Report) => void
}

function clusterIcon(count: number, color: string) {
  const size = clusterSize(count)
  return L.divIcon({
    className: 'cluster-marker',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};color:#fff;
      border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-family:Inter,system-ui,sans-serif;font-weight:700;font-size:${size > 40 ? 14 : 12}px;
      border:2px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.2);
    ">${formatClusterCount(count)}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function pinIcon(severity: number) {
  const size = pinSize(severity)
  const color = clusterColor(severity)
  return L.divIcon({
    className: 'cluster-marker',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};border-radius:50%;
      border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
    "></div>`,
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
            <Marker
              key={r.id}
              position={[r.latitude, r.longitude]}
              icon={pinIcon(r.severity_score)}
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
              click: () => {
                map.setView([cluster.latitude, cluster.longitude], zoom + 1)
                if (zoom >= 13) onSelectReport(cluster.reports[0])
              },
            }}
          >
            <Popup>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {cluster.count} reports in this area
              </span>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}
