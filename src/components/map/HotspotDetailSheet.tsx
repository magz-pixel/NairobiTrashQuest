import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import {
  demoHotspotFundingSeed,
  useDemoFunding,
} from '../../hooks/useDemoFunding'
import { hotspotPhotoUrls } from '../../lib/raceHotspots'
import type { RaceHotspot } from '../../types/database'
import { CrowdfundPanel } from '../crowdfund/CrowdfundPanel'

interface HotspotDetailSheetProps {
  hotspot: RaceHotspot | null
  onClose: () => void
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

export function HotspotDetailSheet({ hotspot, onClose }: HotspotDetailSheetProps) {
  const seed = useMemo(
    () =>
      hotspot ? demoHotspotFundingSeed(hotspot.id, hotspot.point_value) : null,
    [hotspot],
  )
  const { funding, contribute } = useDemoFunding(hotspot?.id ?? null, seed)
  const photos = hotspot ? hotspotPhotoUrls(hotspot) : []

  if (!hotspot) return null

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hotspot.latitude},${hotspot.longitude}`

  return (
    <AnimatePresence>
      {hotspot && (
        <>
          <motion.button
            type="button"
            aria-label="Close hotspot detail"
            className="fixed inset-0 z-[1400] bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[1500] max-h-[88dvh] overflow-y-auto rounded-t-2xl border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-md)] md:inset-x-auto md:right-4 md:top-4 md:max-w-md md:rounded-xl md:border"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--urgent-orange-deep)]">
                Race hotspot · {hotspot.point_value} pts
              </span>
              <button type="button" onClick={onClose} className="text-[var(--text-muted)]">
                ✕
              </button>
            </div>

            <HotspotPhotoStrip urls={photos} label={hotspot.label} />

            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {hotspot.label}
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {hotspot.latitude.toFixed(5)}, {hotspot.longitude.toFixed(5)}
            </p>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-[44px] items-center text-xs font-semibold text-[var(--brand-teal)]"
            >
              Get directions →
            </a>

            {funding ? (
              <div className="mt-4">
                <CrowdfundPanel
                  funding={funding}
                  enablePaymentMethods
                  paymentStateKey={hotspot.id}
                  onContribute={() => undefined}
                  onMockPaymentSuccess={(amount) => contribute(amount)}
                />
              </div>
            ) : null}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
