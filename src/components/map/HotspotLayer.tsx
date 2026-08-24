import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { RaceHotspot } from '../../types/database'

interface HotspotLayerProps {
  hotspots: RaceHotspot[]
}

/** Distinct from citizen report pins: chip with point value. Ghosts look identical. */
function hotspotIcon(pointValue: number) {
  const label = String(pointValue)
  const width = Math.max(36, 12 + label.length * 8)
  return L.divIcon({
    className: 'race-hotspot-marker',
    html: `<div style="
      min-width:${width}px;height:28px;padding:0 8px;
      background:#f97316;color:#fff;
      border-radius:999px;display:flex;align-items:center;justify-content:center;
      font-family:ui-sans-serif,system-ui,sans-serif;font-weight:800;font-size:12px;
      border:2px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      letter-spacing:0.02em;
    ">${label}</div>`,
    iconSize: [width, 28],
    iconAnchor: [width / 2, 14],
  })
}

export function HotspotLayer({ hotspots }: HotspotLayerProps) {
  return (
    <>
      {hotspots.map((h) => (
        <Marker
          key={h.id}
          position={[h.latitude, h.longitude]}
          icon={hotspotIcon(h.point_value)}
        >
          <Popup>
            <div className="w-full max-w-[min(17.5rem,calc(100vw-3rem))] text-sm">
              {h.reference_image_url ? (
                <img
                  src={h.reference_image_url}
                  alt={h.label}
                  className="mb-2 aspect-[4/3] w-full rounded-md object-cover"
                  loading="lazy"
                />
              ) : null}
              <p className="font-semibold">{h.label}</p>
              <p className="text-xs text-gray-600">{h.point_value} pts</p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-[#0d9488] underline"
              >
                Get Directions
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
