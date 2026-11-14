import { useEffect, useState } from 'react'
import { money } from '../../lib/bounties'

/** Animated raised/target bar. Pending pledges (awaiting payment) show as a striped segment. */
export function BountyProgressBar({
  raised,
  pending = 0,
  target,
  currency,
  dark = false,
  goalText = 'the bounty opens at',
}: {
  raised: number
  pending?: number
  target: number
  currency: string
  dark?: boolean
  /** Words before the target, e.g. 'goal' for campaigns. */
  goalText?: string
}) {
  const pct = Math.min(100, (raised / Math.max(1, target)) * 100)
  const pendPct = Math.min(100 - pct, (pending / Math.max(1, target)) * 100)
  const [shown, setShown] = useState(0)
  const [count, setCount] = useState(0)

  // Grow the bar and count the number up whenever the total changes.
  useEffect(() => {
    const t = window.setTimeout(() => setShown(pct), 80)
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 900)
      setCount(raised * (1 - Math.pow(1 - k, 3)))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      window.clearTimeout(t)
      cancelAnimationFrame(raf)
    }
  }, [pct, raised])

  const left = Math.max(0, target - raised)
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <strong className={`text-2xl font-extrabold tabular-nums ${dark ? 'text-white' : 'text-[#063b32]'}`}>{money(currency, count)}</strong>
        <span className="text-sm font-extrabold text-[#f59e0b]">{Math.round(pct)}%</span>
      </div>
      <div
        className={`relative mt-2 h-3.5 overflow-hidden rounded-full ${dark ? 'bg-white/15' : 'bg-[#e5efeb]'}`}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Bounty funding"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#fbbf24,#f97316)] transition-[width] duration-1000 ease-out"
          style={{ width: `${shown}%` }}
        >
          <span className="rt-bar-shine absolute inset-0" />
        </div>
        {pendPct > 0 ? (
          <div
            className="absolute inset-y-0 bg-[repeating-linear-gradient(45deg,rgba(251,191,36,.55)_0_6px,rgba(251,191,36,.2)_6px_12px)] transition-[left] duration-1000"
            style={{ left: `${shown}%`, width: `${pendPct}%` }}
            title="Pledged, waiting for payment"
          />
        ) : null}
      </div>
      <p className={`mt-1.5 text-xs ${dark ? 'text-white/70' : 'text-[#5d746e]'}`}>
        {left > 0 ? (
          <>
            <b>{money(currency, left)}</b> to go · {goalText} {money(currency, target)}
            {pending > 0 ? ` · ${money(currency, pending)} awaiting payment` : ''}
          </>
        ) : (
          '🎉 Fully funded'
        )}
      </p>
    </div>
  )
}
