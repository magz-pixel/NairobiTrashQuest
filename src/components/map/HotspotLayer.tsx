import { useState } from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'
import type { RaceHotspot } from '../../types/database'
import { HotspotDetailSheet } from './HotspotDetailSheet'

interface HotspotLayerProps {
  hotspots: RaceHotspot[]
}

const HOTSPOT_ORANGE = '#f97316'
/** Funded race hotspots — distinct from report orange severity and cleared teal. */
const HOTSPOT_FUNDED = '#ca8a04'

/** Distinct from citizen report pins: chip with point value. 44px touch target. */
function hotspotIcon(pointValue: number, isFunded: boolean) {
  const label = String(pointValue)
  const height = 44
  const width = Math.max(height, 16 + label.length * 10)
  const bg = isFunded ? HOTSPOT_FUNDED : HOTSPOT_ORANGE
  return L.divIcon({
    className: 'race-hotspot-marker',
    html: `<div style="
      position:relative;
      min-width:${width}px;height:${height}px;padding:0 12px;
      background:${bg};color:#fff;
      border-radius:999px;display:flex;align-items:center;justify-content:center;
      font-family:ui-sans-serif,system-ui,sans-serif;font-weight:800;font-size:13px;
      border:2px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      letter-spacing:0.02em;
    ">${label}${
      isFunded
        ? `<span style="
      position:absolute;top:-3px;right:-3px;
      min-width:16px;height:16px;padding:0 3px;
      background:#fff;color:${HOTSPOT_FUNDED};
      border-radius:999px;display:flex;align-items:center;justify-content:center;
      font-size:9px;font-weight:900;line-height:1;
      border:1.5px solid ${HOTSPOT_FUNDED};
    ">$</span>`
        : ''
    }</div>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
  })
}

export function HotspotLayer({ hotspots }: HotspotLayerProps) {
  const [selected, setSelected] = useState<RaceHotspot | null>(null)

  return (
    <>
      {hotspots.map((h) => (
        <Marker
          key={h.id}
          position={[h.latitude, h.longitude]}
          icon={hotspotIcon(h.point_value, h.is_funded)}
          eventHandlers={{ click: () => setSelected(h) }}
        />
      ))}
      <HotspotDetailSheet hotspot={selected} onClose={() => setSelected(null)} />
    </>
  )
}
