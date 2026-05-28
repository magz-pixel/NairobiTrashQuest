import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Report } from '../../types/database'
import { severityToColor } from '../../lib/heatmap'

function dotIcon(severity: number) {
  const color = severityToColor(severity)
  const size = severity >= 7 ? 10 : 8
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50%;
      box-shadow:0 0 8px ${color};
      border:1.5px solid rgba(255,255,255,0.7);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

interface ReportMarkerProps {
  report: Report
}

export function ReportMarker({ report }: ReportMarkerProps) {
  return (
    <Marker
      position={[report.latitude, report.longitude]}
      icon={dotIcon(report.severity_score)}
    >
      <Popup>
        <div className="text-sm text-black">
          <p className="font-semibold">Severity: {report.severity_score}/10</p>
          {report.ai_tags.length > 0 && (
            <p className="text-xs opacity-80">{report.ai_tags.join(', ')}</p>
          )}
          <img
            src={report.image_url}
            alt="Report"
            className="mt-2 max-h-32 rounded"
          />
        </div>
      </Popup>
    </Marker>
  )
}
