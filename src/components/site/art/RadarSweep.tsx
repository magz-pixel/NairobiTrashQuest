import { motion, useReducedMotion } from 'framer-motion'

/** Slow conical radar sweep — pollution / trash locator language. */
export function RadarSweep({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion()

  if (reduce) return null

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <motion.div
        className="absolute left-1/2 top-[42%] h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(0,242,254,0.16) 330deg, rgba(255,107,0,0.12) 350deg, transparent 360deg)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute left-1/2 top-[42%] h-[min(70vw,420px)] w-[min(70vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--fn-clear,#00f2fe)]/15" />
      <div className="absolute left-1/2 top-[42%] h-[min(45vw,260px)] w-[min(45vw,260px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--fn-clear,#00f2fe)]/10" />
    </div>
  )
}
