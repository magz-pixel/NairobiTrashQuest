import { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import type { Report } from '../../types/database'
import { ReportMarker } from './ReportMarker'

interface ZoomGatedMarkersProps {
  reports: Report[]
  minZoom?: number
}

export function ZoomGatedMarkers({
  reports,
  minZoom = 15,
}: ZoomGatedMarkersProps) {
  const map = useMap()
  const [visible, setVisible] = useState(() => map.getZoom() >= minZoom)

  useEffect(() => {
    const update = () => setVisible(map.getZoom() >= minZoom)
    update()
    map.on('zoomend', update)
    return () => {
      map.off('zoomend', update)
    }
  }, [map, minZoom])

  if (!visible) return null

  return (
    <>
      {reports.map((report) => (
        <ReportMarker key={report.id} report={report} />
      ))}
    </>
  )
}
