import { motion, useMotionTemplate, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

interface RaceTicket3DProps {
  code?: string
  holderName?: string
  teamName?: string
  className?: string
  compact?: boolean
}

/** 3D-tiltable Season 2 scout pass with perforations and barcode scan. */
export function RaceTicket3D({
  code = 'ATR2-····',
  holderName,
  teamName,
  className = '',
  compact = false,
}: RaceTicket3DProps) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const rotX = useMotionValue(0)
  const rotY = useMotionValue(0)
  const springX = useSpring(rotX, { stiffness: 120, damping: 18 })
  const springY = useSpring(rotY, { stiffness: 120, damping: 18 })
  const transform = useMotionTemplate`perspective(900px) rotateX(${springX}deg) rotateY(${springY}deg)`

  const onMove = (e: React.PointerEvent) => {
    if (reduce || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    rotY.set(px * 14)
    rotX.set(-py * 10)
  }

  const onLeave = () => {
    rotX.set(0)
    rotY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={{ transform: reduce ? undefined : transform, transformStyle: 'preserve-3d' }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
    >
      <div
        className={`relative overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-[#f5f0e6] to-[#e8e0d0] text-[#0a192f] shadow-[0_20px_50px_rgba(0,0,0,0.45)] ${
          compact ? 'p-4' : 'p-5 md:p-6'
        }`}
      >
        {/* Perforation edge */}
        <div
          className="absolute inset-y-2 left-0 w-3 opacity-80"
          style={{
            backgroundImage:
              'radial-gradient(circle at 0 50%, #0a192f 0 3px, transparent 3.5px)',
            backgroundSize: '12px 12px',
            backgroundRepeat: 'repeat-y',
          }}
          aria-hidden
        />
        <div className="absolute inset-y-3 left-[4.5rem] w-px border-l border-dashed border-[#0a192f]/25" />

        <div className="pl-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#0a192f]/70">
                Season 02 · Scout pass
              </p>
              <p
                className={`mt-2 font-[family-name:var(--font-display)] font-extrabold tracking-widest text-[#0d9488] ${
                  compact ? 'text-xl' : 'text-2xl md:text-3xl'
                }`}
              >
                {code}
              </p>
            </div>
            <span className="rounded border border-[#ff6b00]/40 bg-[#ff6b00]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#c2410c]">
              Eco-warrior
            </span>
          </div>

          {holderName ? (
            <p className="mt-3 text-sm font-semibold">{holderName}</p>
          ) : (
            <p className="mt-3 text-sm font-semibold text-[#0a192f]/80">Amazing Trash Race</p>
          )}
          {teamName && <p className="text-xs text-[#0a192f]/65">Squad · {teamName}</p>}
          <p className="mt-1 text-xs text-[#0a192f]/55">Nairobi · Fix Nairobi × XPNC</p>

          {/* Barcode + scan */}
          <div className="relative mt-4 overflow-hidden rounded-lg bg-[#0a192f]/08 px-3 py-3">
            <div className="flex h-10 items-end gap-[2px]" aria-hidden>
              {Array.from({ length: 42 }).map((_, i) => (
                <span
                  key={i}
                  className="flex-1 bg-[#0a192f]/75"
                  style={{ height: `${40 + ((i * 17) % 60)}%` }}
                />
              ))}
            </div>
            {!reduce && (
              <motion.div
                className="pointer-events-none absolute inset-x-0 h-0.5 bg-[var(--fn-clear,#00f2fe)] shadow-[0_0_12px_#00f2fe]"
                initial={{ top: '10%' }}
                animate={{ top: ['12%', '88%', '12%'] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-[#0a192f]/5">
              Check-in · Map · Clear · Log impact
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
