import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Report } from '../../types/database'

function severityIcon(severity: number) {
  const color = severity >= 7 ? '#ff4500' : '#39ff14'
  return L.divIcon({
    className: '',
    html:
      '<div style="width:14px;height:14px;border-radius:50%;background:' +
      color +
      ';box-shadow:0 0 10px ' +
      color +
      ';border:2px solid #fff"></' + 'div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

interface ReportMarkerProps {
  report: Report
}

export function ReportMarker({ report }: ReportMarkerProps) {
  return (
    <Marker
      position={[report.latitude, report.longitude]}
      icon={severityIcon(report.severity_score)}
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
