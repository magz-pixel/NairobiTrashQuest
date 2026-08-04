import { motion, useReducedMotion } from 'framer-motion'

type Pin = {
  x: number
  y: number
  kind: 'active' | 'cleared'
  delay: number
}

const PINS: Pin[] = [
  { x: 18, y: 52, kind: 'active', delay: 0 },
  { x: 32, y: 58, kind: 'active', delay: 0.35 },
  { x: 48, y: 48, kind: 'cleared', delay: 0.15 },
  { x: 58, y: 62, kind: 'active', delay: 0.55 },
  { x: 72, y: 54, kind: 'active', delay: 0.25 },
  { x: 82, y: 66, kind: 'cleared', delay: 0.7 },
  { x: 40, y: 70, kind: 'active', delay: 0.9 },
]

function PinMark({ pin, reduce }: { pin: Pin; reduce: boolean | null }) {
  const fill = pin.kind === 'active' ? '#ff6b00' : '#00f2fe'
  const ring = pin.kind === 'active' ? 'rgba(255,107,0,0.45)' : 'rgba(0,242,254,0.4)'

  return (
    <g transform={`translate(${pin.x} ${pin.y})`}>
      {!reduce && (
        <motion.circle
          cx={0}
          cy={0}
          r={4}
          fill={ring}
          initial={{ scale: 0.6, opacity: 0.7 }}
          animate={{ scale: [0.6, 2.2, 0.6], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: pin.delay, ease: 'easeOut' }}
        />
      )}
      <motion.g
        initial={{ y: 6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 + pin.delay * 0.3, duration: 0.45 }}
      >
        {!reduce && (
          <motion.g
            animate={{ y: [0, -1.5, 0] }}
            transition={{ duration: 2.2 + pin.delay, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M0 -10c-3.6 0-6.5 2.8-6.5 6.3 0 4.7 6.5 11.7 6.5 11.7s6.5-7 6.5-11.7C6.5 -7.2 3.6 -10 0 -10z"
              fill={fill}
            />
            <circle cx={0} cy={-4.2} r={2.1} fill="#071613" opacity={0.85} />
          </motion.g>
        )}
        {reduce && (
          <>
            <path
              d="M0 -10c-3.6 0-6.5 2.8-6.5 6.3 0 4.7 6.5 11.7 6.5 11.7s6.5-7 6.5-11.7C6.5 -7.2 3.6 -10 0 -10z"
              fill={fill}
            />
            <circle cx={0} cy={-4.2} r={2.1} fill="#071613" opacity={0.85} />
          </>
        )}
      </motion.g>
    </g>
  )
}

/** Hotspot pins over the city — orange active, teal cleared. */
export function MapPinsLayer({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion()

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {PINS.map((pin, i) => (
        <PinMark key={i} pin={pin} reduce={reduce} />
      ))}
    </svg>
  )
}
