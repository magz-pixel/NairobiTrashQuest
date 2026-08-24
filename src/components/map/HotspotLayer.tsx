import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { RaceHotspot } from '../../types/database'
import {
  demoHotspotFundingSeed,
  useDemoFunding,
} from '../../hooks/useDemoFunding'
import { hotspotPhotoUrls } from '../../lib/raceHotspots'
import { CrowdfundPanel } from '../crowdfund/CrowdfundPanel'

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

function HotspotPhotoStrip({ urls, label }: { urls: string[]; label: string }) {
  if (urls.length === 0) return null

  if (urls.length === 1) {
    return (
      <img
        src={urls[0]}
        alt={label}
        className="mb-2 aspect-[4/3] min-h-[44px] w-full rounded-md object-cover"
        loading="lazy"
      />
    )
  }

  return (
    <div
      className="-mx-1 mb-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {urls.map((url, i) => (
        <figure
          key={`${url}-${i}`}
          className="relative min-h-[44px] w-[min(14rem,78%)] shrink-0 snap-start"
        >
          <img
            src={url}
            alt={i === 0 ? `${label} landmark` : `${label} angle ${i}`}
            className="aspect-[4/3] h-full min-h-[44px] w-full rounded-md object-cover"
            loading="lazy"
          />
          {i === 0 ? (
            <figcaption className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Landmark
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  )
}

function HotspotPopupContent({ hotspot }: { hotspot: RaceHotspot }) {
  const seed = useMemo(
    () => demoHotspotFundingSeed(hotspot.id, hotspot.point_value),
    [hotspot.id, hotspot.point_value],
  )
  const { funding, contribute } = useDemoFunding(hotspot.id, seed)
  const photos = hotspotPhotoUrls(hotspot)

  return (
    <div className="w-full max-w-[min(17.5rem,calc(100vw-3rem))] text-sm">
      <HotspotPhotoStrip urls={photos} label={hotspot.label} />
      <p className="font-semibold">{hotspot.label}</p>
      <p className="text-xs text-gray-600">{hotspot.point_value} pts</p>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${hotspot.latitude},${hotspot.longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block min-h-[44px] py-2 text-xs font-semibold text-[#0d9488] underline"
      >
        Get Directions
      </a>

      {funding ? (
        <CrowdfundPanel
          funding={funding}
          enablePaymentMethods
          paymentStateKey={hotspot.id}
          onContribute={() => undefined}
          onMockPaymentSuccess={(amount) => contribute(amount)}
        />
      ) : null}
    </div>
  )
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
            <HotspotPopupContent hotspot={h} />
          </Popup>
        </Marker>
      ))}
    </>
  )
}
