import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagneticButton } from '../fx/MagneticButton'

const PINS = [
  {
    id: 'cbd',
    x: 160,
    y: 130,
    label: 'CBD',
    lat: -1.2864,
    lng: 36.8172,
    note: 'Sidewalk pile near Kenyatta Ave — needs corroboration',
    tone: 'hot' as const,
  },
  {
    id: 'east',
    x: 280,
    y: 115,
    label: 'Eastlands',
    lat: -1.2841,
    lng: 36.876,
    note: 'Drainage edge plastics after rains',
    tone: 'hot' as const,
  },
  {
    id: 'don',
    x: 300,
    y: 185,
    label: 'Donholm',
    lat: -1.3,
    lng: 36.89,
    note: 'Residential corner dump — warriors logged',
    tone: 'hot' as const,
  },
  {
    id: 'clear1',
    x: 100,
    y: 200,
    label: 'Cleared',
    lat: -1.2921,
    lng: 36.8219,
    note: 'Verified clear · before/after on file',
    tone: 'clear' as const,
  },
  {
    id: 'clear2',
    x: 220,
    y: 210,
    label: 'Westlands spur',
    lat: -1.267,
    lng: 36.81,
    note: 'Spot check complete',
    tone: 'clear' as const,
  },
]

/** Tactical scout dashboard preview for the Trash Locator chapter. */
export function ScoutModeCanvas({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const [active, setActive] = useState<string | null>(null)
  const [ba, setBa] = useState(55)
  const [launching, setLaunching] = useState(false)

  const pin = PINS.find((p) => p.id === active)

  const launch = () => {
    if (launching) return
    setLaunching(true)
    window.setTimeout(() => navigate('/map'), reduce ? 0 : 520)
  }

  return (
    <motion.div
      className={`relative aspect-[4/3] overflow-hidden border border-[var(--fn-clear)]/25 bg-[#071a22] shadow-[0_0_40px_rgba(0,242,254,0.08)] ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55 }}
      animate={launching ? { scale: 1.08, filter: 'blur(6px)', opacity: 0.4 } : { scale: 1, filter: 'blur(0px)', opacity: 1 }}
    >
      {/* Radar frame corners */}
      <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-[var(--fn-clear)]/70" />
      <span className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-[var(--fn-pin)]/70" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-[var(--fn-pin)]/70" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-[var(--fn-clear)]/70" />

      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect width="400" height="300" fill="#0a192f" />
        <g stroke="#00f2fe" strokeOpacity="0.14" strokeWidth="1" fill="none">
          <path d="M0 50 H400 M0 100 H400 M0 150 H400 M0 200 H400 M0 250 H400" />
          <path d="M40 0 V300 M100 0 V300 M160 0 V300 M220 0 V300 M280 0 V300 M340 0 V300" />
        </g>
        <g fill="#123040" opacity="0.85">
          <rect x="50" y="60" width="44" height="28" />
          <rect x="130" y="120" width="52" height="34" />
          <rect x="210" y="70" width="48" height="26" />
          <rect x="290" y="140" width="40" height="38" />
          <rect x="70" y="190" width="58" height="30" />
        </g>
        <text x="48" y="48" fill="#00f2fe" fillOpacity="0.55" fontSize="9" fontFamily="DM Sans, sans-serif">
          CBD
        </text>
        <text x="250" y="48" fill="#00f2fe" fillOpacity="0.55" fontSize="9" fontFamily="DM Sans, sans-serif">
          Eastlands
        </text>
        <text x="270" y="248" fill="#00f2fe" fillOpacity="0.55" fontSize="9" fontFamily="DM Sans, sans-serif">
          Donholm
        </text>

        {PINS.map((p, i) => {
          const c = p.tone === 'clear' ? '#00f2fe' : '#ff6b00'
          return (
            <g
              key={p.id}
              transform={`translate(${p.x} ${p.y})`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setActive(p.id)}
              onMouseLeave={() => setActive((a) => (a === p.id ? null : a))}
              onFocus={() => setActive(p.id)}
              onClick={() => setActive(p.id)}
              tabIndex={0}
              role="button"
              aria-label={`${p.label} hotspot`}
            >
              {!reduce && (
                <circle cx={0} cy={0} r={8} fill={c} opacity={0.3}>
                  <animate
                    attributeName="r"
                    values="6;16;6"
                    dur={`${2 + i * 0.25}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.45;0;0.45"
                    dur={`${2 + i * 0.25}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <path
                d="M0 -12c-4.2 0-7.5 3.2-7.5 7.2 0 5.4 7.5 13.3 7.5 13.3s7.5-7.9 7.5-13.3C7.5 -8.8 4.2 -12 0 -12z"
                fill={c}
              />
              <circle cx={0} cy={-5.5} r={2.4} fill="#0a192f" />
            </g>
          )
        })}
      </svg>

      <AnimatePresence>
        {pin && (
          <motion.div
            key={pin.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute left-3 right-3 top-3 z-10 rounded-xl border border-white/15 bg-[#0a192f]/85 p-3 shadow-xl backdrop-blur-md md:left-auto md:right-3 md:w-56"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--fn-pin)]">
              {pin.label}
            </p>
            <p className="mt-1 font-mono text-[11px] text-[var(--fn-clear)]">
              {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
            </p>
            <p className="mt-2 text-xs text-teal-50/90">{pin.note}</p>
            {pin.tone === 'clear' && (
              <div className="relative mt-3 h-16 overflow-hidden rounded-lg border border-white/10">
                <div
                  className="absolute inset-0 bg-gradient-to-br from-orange-900/80 to-stone-900"
                  aria-hidden
                />
                <div
                  className="absolute inset-0 bg-gradient-to-br from-teal-800/90 to-emerald-950"
                  style={{ clipPath: `inset(0 ${100 - ba}% 0 0)` }}
                  aria-hidden
                />
                <div className="absolute inset-x-2 bottom-1 flex items-center gap-2">
                  <span className="text-[9px] font-semibold text-white/80">Before</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={ba}
                    onChange={(e) => setBa(Number(e.target.value))}
                    className="h-1 flex-1 accent-[var(--fn-clear)]"
                    aria-label="Before after slider"
                  />
                  <span className="text-[9px] font-semibold text-white/80">After</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-[#0a192f] via-[#0a192f]/90 to-transparent px-4 pb-4 pt-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--fn-pin)]">
          Scout mode · tactical grid
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={launch}
            className="rounded-lg bg-[var(--fn-pin)] px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,107,0,0.35)] transition hover:brightness-110"
          >
            {launching ? 'Launching…' : 'Launch map'}
          </button>
          <MagneticButton to="/map" variant="secondary" className="!py-2 text-xs">
            Open field map
          </MagneticButton>
        </div>
      </div>
    </motion.div>
  )
}
