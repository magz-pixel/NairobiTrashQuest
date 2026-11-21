import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import type { CityConfig } from '../../lib/cities'

const KEY = (slug: string) => `rt:map-intro:${slug}`

function seen(slug: string) {
  try {
    return localStorage.getItem(KEY(slug)) === '1'
  } catch {
    return false
  }
}

/**
 * One-time intro the first time someone opens a city's map (Namma Kasa-style):
 * name the problem, say what to do, show the scale. Remembered per city on this device.
 */
export function MapIntro({
  city,
  wards,
  open,
  onReport,
  skip = false,
}: {
  city: CityConfig
  wards: number
  open: number
  onReport: () => void
  /** Arrived with a purpose (shared spot, cleanup, ward or report link): don't block it with the intro. */
  skip?: boolean
}) {
  const [visible, setVisible] = useState(() => !skip && !seen(city.slug))

  const dismiss = () => {
    try {
      localStorage.setItem(KEY(city.slug), '1')
    } catch {
      /* private mode: show again next time, that's fine */
    }
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[1600] grid place-items-center bg-[#063b32]/35 p-4 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-labelledby="map-intro-title"
            className="w-full max-w-md rounded-[1.75rem] bg-white p-6 shadow-[0_30px_90px_rgba(6,59,50,.35)] sm:p-8"
            initial={{ y: 24, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          >
            <p className="flex items-center gap-2 text-sm font-extrabold text-[#063b32]">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#063b32] text-xs">📍</span>
              Ramani-Taka · {city.label}
            </p>
            <h2 id="map-intro-title" className="fn-display mt-5 text-[1.9rem] font-extrabold leading-tight tracking-[-.025em] text-[#063b32]">
              {city.label} has a trash problem.
            </h2>
            <p className="mt-3 text-lg font-semibold leading-7 text-[#36564e]">Pin it. Prove it. Get it cleared.</p>
            <p className="mt-3 leading-7 text-[#5d746e]">
              Every spot on this map is tied to its ward and the people responsible for it. When enough neighbours report,
              it becomes impossible to ignore.
            </p>
            <p className="mt-5 text-center text-xs font-bold tracking-[.04em] text-[#71867f]">
              {wards > 0 ? `${wards} wards · ` : ''}
              {open} open spot{open === 1 ? '' : 's'} · all of {city.label}
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-4 flex min-h-13 w-full items-center justify-center rounded-full bg-[#063b32] py-3.5 text-base font-extrabold text-white"
            >
              Show me the map
            </button>
            <button
              type="button"
              onClick={() => {
                dismiss()
                onReport()
              }}
              className="mt-2 flex min-h-12 w-full items-center justify-center rounded-full bg-gold-400 text-sm font-extrabold text-emerald-950"
            >
              📍 I see trash right now
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
