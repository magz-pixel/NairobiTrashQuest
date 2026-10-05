import { useEffect, useState } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Report } from '../../types/database'
import {
  clusterColor,
  clusterReports,
  clusterSize,
  formatClusterCount,
  pinColor,
  pinSize,
  type MapCluster,
} from '../../lib/clusters'

interface ClusterLayerProps {
  reports: Report[]
  selectedId?: string | null
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

function pinIcon(severity: number, status: string, selected = false) {
  const size = pinSize(severity) + (selected ? 8 : 4)
  const color = pinColor(severity, status)
  return L.divIcon({
    className: 'cluster-marker',
    html: `<div class="map-pin${selected ? ' is-selected' : ''}" style="--pin:${color};width:${size}px;height:${size + 6}px">
      <span></span>
    </div>`,
    iconSize: [size, size + 6],
    iconAnchor: [size / 2, size + 4],
  })
}

/** Grid cells in clusterReports can sit closer than their bubble diameters. Fold those together. */
const CLUSTER_GAP_PX = 8

function mergeOverlappingClusters(clusters: MapCluster[], map: L.Map, zoom: number): MapCluster[] {
  if (zoom >= 14) return clusters
  const pending = clusters.map((cluster) => ({ ...cluster, reports: [...cluster.reports] }))
  let changed = true
  while (changed) {
    changed = false
    for (let i = 0; i < pending.length; i++) {
      const left = pending[i]
      const leftPoint = map.project([left.latitude, left.longitude], zoom)
      for (let j = i + 1; j < pending.length; j++) {
        const right = pending[j]
        const rightPoint = map.project([right.latitude, right.longitude], zoom)
        const distance = Math.hypot(leftPoint.x - rightPoint.x, leftPoint.y - rightPoint.y)
        const minDistance = (clusterSize(left.count) + clusterSize(right.count)) / 2 + CLUSTER_GAP_PX
        if (distance >= minDistance) continue
        const reports = [...left.reports, ...right.reports]
        pending[i] = {
          id: reports
            .map((report) => report.id)
            .sort()
            .join(':'),
          latitude: reports.reduce((sum, report) => sum + report.latitude, 0) / reports.length,
          longitude: reports.reduce((sum, report) => sum + report.longitude, 0) / reports.length,
          count: reports.length,
          maxSeverity: Math.max(...reports.map((report) => report.severity_score)),
          reports,
        }
        pending.splice(j, 1)
        changed = true
        break
      }
      if (changed) break
    }
  }
  return pending
}

export function ClusterLayer({ reports, selectedId, onSelectReport }: ClusterLayerProps) {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())

  useEffect(() => {
    const update = () => setZoom(map.getZoom())
    map.on('zoomend', update)
    return () => {
      map.off('zoomend', update)
    }
  }, [map])

  const clusters = mergeOverlappingClusters(clusterReports(reports, zoom), map, zoom)

  return (
    <>
      {clusters.map((cluster) => {
        if (cluster.count === 1) {
          const r = cluster.reports[0]
          return (
            <Marker
              key={r.id}
              position={[r.latitude, r.longitude]}
              icon={pinIcon(r.severity_score, r.status, r.id === selectedId)}
              zIndexOffset={r.id === selectedId ? 600 : 0}
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
