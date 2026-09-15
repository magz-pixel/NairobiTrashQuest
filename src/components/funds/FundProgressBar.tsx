import { motion, useReducedMotion } from 'framer-motion'
import { FUND_TARGET_KES, formatKes } from '../../lib/fundLedger'

interface FundProgressBarProps {
  raised: number
  target?: number
}

export function FundProgressBar({ raised, target = FUND_TARGET_KES }: FundProgressBarProps) {
  const reduce = useReducedMotion()
  const safeRaised = Number.isFinite(raised) ? Math.max(0, raised) : 0
  const safeTarget = Number.isFinite(target) && target > 0 ? target : FUND_TARGET_KES
  const pct = Math.min(100, Math.round((safeRaised / safeTarget) * 100))
  const fillPct = safeRaised > 0 ? Math.max(pct, 4) : 0

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--fn-pin,#ff6b00)]">
            Of campaign target
          </p>
          <p className="mt-1 text-sm text-teal-100/80">
            <strong className="fn-neon-text text-lg md:text-xl">{formatKes(safeRaised)}</strong>
            <span className="text-teal-100/60"> raised of </span>
            <strong className="text-white">{formatKes(safeTarget)}</strong>
          </p>
        </div>
        <p className="font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums text-[var(--fn-clear,#00f2fe)] md:text-4xl">
          {pct}%
        </p>
      </div>
      <div
        className="h-8 overflow-hidden rounded-full border-2 border-[var(--fn-clear)]/40 bg-[#041210] shadow-inner md:h-10"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Fundraise progress toward campaign target"
      >
        <motion.div
          className="relative h-full rounded-full bg-gradient-to-r from-[var(--fn-pin,#ff6b00)] via-amber-400 to-[var(--fn-clear,#00f2fe)] shadow-[0_0_28px_rgba(0,242,254,0.45)]"
          initial={{ width: reduce ? `${fillPct}%` : '0%' }}
          animate={{ width: `${fillPct}%` }}
          transition={{ type: 'spring', stiffness: 42, damping: 16, delay: 0.1 }}
        >
          {!reduce && fillPct > 0 && (
            <motion.span
              className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white/40 to-transparent"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}
