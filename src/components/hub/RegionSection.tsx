import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DEMO_FEED, demoRegionPoints, type FeedItem, type RegionPoint } from '../../lib/demoRegion'
import { useRegionData } from '../../hooks/useRegionData'

const RegionHeatmap = lazy(() => import('./RegionHeatmap'))

type Mode = 'demo' | 'live'

const FEED_ICON: Record<FeedItem['kind'], string> = { cleanup: '🧹', report: '📍', cleared: '✅' }

function countsByCity(points: RegionPoint[]) {
  const out: Record<string, number> = {}
  for (const p of points) if (!p.cleared) out[p.city] = (out[p.city] ?? 0) + 1
  return out
}

/** Mount children only when the section is near the viewport (keeps MapLibre off the first load). */
function useNearViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true)
      },
      { rootMargin: '400px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [near])
  return { ref, near }
}

/**
 * "The trash map of East Africa" — the Gemini-mockup section: regional heat map, summary
 * dashboard and live feed. Opens on an obviously-labelled DEMO preview of what the network
 * looks like at scale; one tap switches to the real reports.
 */
export function RegionSection() {
  const [mode, setMode] = useState<Mode>('demo')
  const live = useRegionData()
  const demoPoints = useMemo(() => demoRegionPoints(), [])
  const { ref, near } = useNearViewport<HTMLDivElement>()

  const isDemo = mode === 'demo'
  const points = useMemo(() => (isDemo ? demoPoints : (live?.points ?? [])), [isDemo, demoPoints, live])
  const counts = useMemo(() => countsByCity(points), [points])
  const stats = isDemo
    ? { total: demoPoints.length, cleanups: 14, cleared: demoPoints.filter((p) => p.cleared).length }
    : { total: live?.total ?? 0, cleanups: live?.upcomingCleanups ?? 0, cleared: live?.cleared ?? 0 }
  const feed = isDemo ? DEMO_FEED : (live?.feed ?? [])

  return (
    <section className="bg-[#08201c] px-5 py-14 text-white sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-gold-300">East Africa, live</p>
            <h2 className="fn-display mt-3 text-[clamp(2rem,6vw,3.2rem)] font-extrabold leading-tight tracking-[-.03em]">
              A trash heat map of East Africa, built street by street.
            </h2>
          </div>
          <div
            role="radiogroup"
            aria-label="Data shown"
            className="inline-flex rounded-full border border-white/15 bg-white/5 p-1 text-sm font-bold"
          >
            {(
              [
                ['demo', 'Demo preview'],
                ['live', 'Live data'],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 transition ${
                  mode === m ? 'bg-white text-[#063b32]' : 'text-white/75 hover:text-white'
                }`}
              >
                {m === 'live' ? <span className="h-2 w-2 rounded-full bg-[#ef8268]" /> : null}
                {label}
              </button>
            ))}
          </div>
        </div>

        <p
          className={`mt-4 inline-flex max-w-2xl items-start gap-2 rounded-xl px-3 py-2 text-sm leading-6 ${
            isDemo ? 'bg-gold-400/15 text-[#fde9b0]' : 'bg-white/10 text-[#e7f5f0]'
          }`}
        >
          {isDemo ? (
            <>
              <strong className="shrink-0 rounded bg-gold-400 px-1.5 text-[11px] font-extrabold uppercase tracking-[.1em] text-emerald-950">
                Demo
              </strong>
              Illustrative data showing what the map looks like at city scale. Switch to Live data for the real reports.
            </>
          ) : (
            <>
              <strong className="shrink-0 rounded bg-[#ef8268] px-1.5 text-[11px] font-extrabold uppercase tracking-[.1em] text-white">
                Live
              </strong>
              {live
                ? `${live.total} real reports so far. Every report adds a dot.`
                : 'Loading the real reports…'}
            </>
          )}
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div
            ref={ref}
            className="relative h-[440px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0c2622] shadow-[0_30px_80px_rgba(0,0,0,.35)] sm:h-[460px] lg:h-[560px]"
          >
            {near ? (
              <Suspense fallback={<div className="grid h-full place-items-center text-sm text-[#a9c9bf]">Loading map…</div>}>
                <RegionHeatmap points={points} counts={counts} />
              </Suspense>
            ) : null}
            <span
              className={`pointer-events-none absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.14em] ${
                isDemo ? 'bg-gold-400 text-emerald-950' : 'bg-[#ef8268] text-white'
              }`}
            >
              {isDemo ? 'Demo data' : '● Live'}
            </span>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5">
              <p className="text-sm font-extrabold">Summary {isDemo ? <span className="text-gold-300">(demo)</span> : null}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3">
                {(
                  [
                    ['Trash spots logged', stats.total],
                    ['Upcoming cleanups', stats.cleanups],
                    ['Spots cleared', stats.cleared],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/[.06] p-3">
                    <dt className="text-[11px] leading-4 text-[#a9c9bf]">{label}</dt>
                    <dd className="mt-2 text-2xl font-extrabold tabular-nums">{value.toLocaleString()}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex-1 rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5">
              <p className="text-sm font-extrabold">
                Live feed {isDemo ? <span className="text-gold-300">(demo)</span> : null}
              </p>
              {feed.length === 0 ? (
                <p className="mt-4 text-sm text-[#a9c9bf]">Nothing yet. Be the first to report a spot.</p>
              ) : (
                <ol className="mt-3 divide-y divide-white/10">
                  {feed.map((item) => {
                    const body = (
                      <>
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10">
                          {FEED_ICON[item.kind]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm">
                            <strong>{item.place}:</strong> <span className="text-[#d6ebe4]">{item.text}</span>
                          </span>
                          <span className="mt-0.5 block text-xs text-[#8fb3a8]">{item.when}</span>
                        </span>
                      </>
                    )
                    return (
                      <li key={item.id}>
                        {item.href && !isDemo ? (
                          <Link to={item.href} className="flex items-start gap-3 py-3 hover:text-gold-300">
                            {body}
                          </Link>
                        ) : (
                          <div className="flex items-start gap-3 py-3">{body}</div>
                        )}
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
