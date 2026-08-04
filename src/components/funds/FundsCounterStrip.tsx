import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFundLedger } from '../../hooks/useFundLedger'
import { formatKes } from '../../lib/fundLedger'
import { DonateModal } from './DonateModal'
import { FundProgressBar } from './FundProgressBar'

function AnimatedKes({ value }: { value: number }) {
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 })
  const display = useTransform(spring, (v) => formatKes(v))
  const [text, setText] = useState(formatKes(0))

  useEffect(() => {
    motionVal.set(Number.isFinite(value) ? value : 0)
  }, [motionVal, value])

  useEffect(() => {
    const unsub = display.on('change', (v) => setText(v))
    return unsub
  }, [display])

  return <span className="tabular-nums">{text}</span>
}

export function FundsCounterStrip({ compact = false }: { compact?: boolean }) {
  const { totals, feed, loading } = useFundLedger()
  const [spotlight, setSpotlight] = useState(0)
  const [donateOpen, setDonateOpen] = useState(false)

  useEffect(() => {
    if (feed.length === 0) return
    const id = window.setInterval(() => {
      setSpotlight((i) => (i + 1) % feed.length)
    }, 3200)
    return () => window.clearInterval(id)
  }, [feed.length])

  const current = feed[spotlight]

  return (
    <div
      className={
        compact
          ? 'relative overflow-hidden border border-dashed border-[var(--fn-clear)]/35 bg-[#0c1f1c]/90 p-4'
          : 'relative overflow-hidden border border-dashed border-[var(--fn-clear)]/45 bg-[#0a192f] p-6 shadow-[inset_0_0_0_1px_rgba(0,242,254,0.1),0_0_40px_rgba(0,242,254,0.06)] md:p-8'
      }
    >
      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-[var(--fn-pin)]" />
      <span className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r-2 border-t-2 border-[var(--fn-pin)]" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-[var(--fn-clear)]" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-[var(--fn-clear)]" />
      <span className="pointer-events-none absolute right-4 top-4 rotate-[-8deg] rounded border border-[var(--fn-clear)]/40 px-2 py-0.5 text-[9px] font-extrabold tracking-[0.2em] text-[var(--fn-clear)]/70">
        VERIFIED
      </span>

      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--fn-pin)]">
        Field ledger · stamped public
      </p>
      <p
        className={`fn-neon-text mt-3 font-[family-name:var(--font-display)] font-bold ${
          compact ? 'text-3xl' : 'text-4xl md:text-5xl'
        }`}
      >
        {loading ? '…' : <AnimatedKes value={totals.raised} />}
      </p>
      <p className="mt-1 text-sm text-teal-100/70">raised to date</p>

      <div className="mt-5">
        <FundProgressBar raised={totals.raised} />
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-teal-100/80 md:text-sm">
        <span>
          Spent <strong className="text-white">{formatKes(totals.spent)}</strong>
        </span>
        <span>
          Remaining{' '}
          <strong className="text-[var(--fn-clear)]">{formatKes(totals.remaining)}</strong>
        </span>
      </div>

      <button
        type="button"
        onClick={() => setDonateOpen(true)}
        className={`mt-5 w-full rounded-xl bg-[var(--fn-clear)] font-extrabold uppercase tracking-wide text-[#021a1a] shadow-[0_0_24px_rgba(0,242,254,0.3)] transition hover:brightness-110 ${
          compact ? 'py-3 text-sm' : 'py-4 text-base'
        }`}
      >
        Donate Now
      </button>

      <div className="mt-5 min-h-[3.5rem] overflow-hidden border-t border-dashed border-white/15 pt-4">
        <AnimatePresence mode="wait">
          {current ? (
            <motion.div
              key={current.id + String(spotlight)}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="text-sm text-teal-50/95"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span
                  className={
                    current.kind === 'donation'
                      ? 'text-[var(--fn-clear)]'
                      : 'text-[var(--fn-pin)]'
                  }
                >
                  {current.kind === 'donation' ? 'Donation' : 'Expense'}
                </span>
                <span className="rounded border border-[var(--fn-clear)]/40 px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-[var(--fn-clear)]/80">
                  VERIFIED
                </span>
              </div>
              <p>
                <strong>{current.donor_or_payee}</strong>
                {' — '}
                {formatKes(Number(current.amount_kes))}
                {current.note ? (
                  <span className="text-teal-100/60"> · {current.note}</span>
                ) : null}
              </p>
            </motion.div>
          ) : (
            <p className="text-sm text-teal-100/60">Ledger updates appear here as the team logs them.</p>
          )}
        </AnimatePresence>
      </div>

      {!compact && (
        <Link
          to="/funds"
          className="mt-5 inline-flex text-sm font-semibold text-[var(--fn-clear)] hover:text-white"
        >
          Full accountability ledger →
        </Link>
      )}

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
    </div>
  )
}
