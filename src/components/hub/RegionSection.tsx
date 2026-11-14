import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DEMO_FEED, demoRegionPoints, type FeedItem, type RegionPoint } from '../../lib/demoRegion'
import { useRegionData } from '../../hooks/useRegionData'
import { cityPath, getActiveCities, getCity } from '../../lib/cities'
import { CITY_FACTS, HISTORIC_KG_REMOVED } from '../../lib/cityFacts'

const RegionHeatmap = lazy(() => import('./RegionHeatmap'))

type Mode = 'demo' | 'live'
/** 'region' = all of East Africa, otherwise a city slug. */
type View = string

const FEED_ICON: Record<FeedItem['kind'], string> = { cleanup: '🧹', report: '📍', cleared: '✅' }
const SLIDE_MS = 9000

/** Illustrative bin / tree counts for the demo preview (the real layers are next on the roadmap). */
const DEMO_LAYERS: Record<string, { bins: number; trees: number; cleanups: number; kg: number }> = {
  nairobi: { bins: 312, trees: 1840, cleanups: 6, kg: 18400 },
  kampala: { bins: 188, trees: 920, cleanups: 4, kg: 9600 },
  'dar-es-salaam': { bins: 241, trees: 1310, cleanups: 4, kg: 12100 },
}

const fmt = (n: number) => n.toLocaleString()
const fmtKg = (kg: number) => (kg >= 1000 ? `${(kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} t` : `${fmt(kg)} kg`)

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
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), {
      rootMargin: '400px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [near])
  return { ref, near }
}

function Tile({ label, value, soon, accent }: { label: string; value: string; soon?: boolean; accent?: string }) {
  return (
    <div className="rounded-2xl bg-white/[.06] p-3">
      <dt className="text-[11px] leading-4 text-[#a9c9bf]">{label}</dt>
      <dd className={`mt-1.5 text-xl font-extrabold tabular-nums sm:text-2xl ${accent ?? ''}`}>
        {soon ? <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-[#a9c9bf]">Coming soon</span> : value}
      </dd>
    </div>
  )
}

/**
 * "A trash heat map of East Africa" — regional heat map + per-city snapshot slideshow
 * (Nairobi → Kampala → Dar), summary tiles including bins and trees, the scale of the
 * problem from published figures, and a live feed. Opens on a clearly labelled DEMO preview.
 */
export function RegionSection() {
  const [mode, setMode] = useState<Mode>('demo')
  const cities = getActiveCities()
  const [view, setView] = useState<View>(cities[0]?.slug ?? 'nairobi')
  const [autoplay, setAutoplay] = useState(true)
  const live = useRegionData()
  const demoPoints = useMemo(() => demoRegionPoints(), [])
  const { ref, near } = useNearViewport<HTMLDivElement>()

  // Slideshow: Nairobi → Kampala → Dar → … until someone picks a view themselves.
  useEffect(() => {
    if (!autoplay || !near) return
    const t = window.setInterval(() => {
      setView((v) => {
        const i = cities.findIndex((c) => c.slug === v)
        return cities[(i + 1) % cities.length].slug
      })
    }, SLIDE_MS)
    return () => window.clearInterval(t)
  }, [autoplay, near, cities])

  const pick = (v: View) => {
    setAutoplay(false)
    setView(v)
  }

  const isDemo = mode === 'demo'
  const isRegion = view === 'region'
  const points = useMemo(() => (isDemo ? demoPoints : (live?.points ?? [])), [isDemo, demoPoints, live])
  const counts = useMemo(() => countsByCity(points), [points])
  const scoped = useMemo(() => (isRegion ? points : points.filter((p) => p.city === view)), [points, isRegion, view])

  const slugs = isRegion ? cities.map((c) => c.slug) : [view]
  const demoSum = (k: 'bins' | 'trees' | 'cleanups' | 'kg') => slugs.reduce((sum, s) => sum + (DEMO_LAYERS[s]?.[k] ?? 0), 0)
  const liveKg = (live?.kgLogged ?? 0) + HISTORIC_KG_REMOVED
  const stats = {
    spots: scoped.length,
    cleared: scoped.filter((p) => p.cleared).length,
    cleanups: isDemo ? demoSum('cleanups') : (live?.upcomingCleanups ?? 0),
    bins: isDemo ? demoSum('bins') : (live?.features ?? []).filter((f) => f.kind === 'bin' && slugs.includes(f.city)).length,
    // "Trees planted" counts newly planted trees, not existing ones that were mapped.
    trees: isDemo
      ? demoSum('trees')
      : (live?.features ?? []).filter((f) => f.kind === 'tree' && f.origin === 'planted' && slugs.includes(f.city)).length,
    kg: isDemo ? demoSum('kg') : isRegion || view === 'nairobi' ? liveKg : 0,
  }
  const feed = isDemo ? DEMO_FEED : (live?.feed ?? [])

  // Scale of the problem (published figures, never demo).
  const facts = slugs.map((s) => ({ slug: s, ...CITY_FACTS[s] })).filter((f) => f.tonnesPerDay || f.collectedShare)
  const tonnes = facts.reduce((sum, f) => sum + (f.tonnesPerDay ?? 0), 0)
  const uncollected = facts.reduce((sum, f) => sum + (f.tonnesPerDay && f.collectedShare ? f.tonnesPerDay * (1 - f.collectedShare) : 0), 0)
  const viewLabel = isRegion ? 'East Africa' : getCity(view).label
  const single = !isRegion ? CITY_FACTS[view] : null

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
          <div role="radiogroup" aria-label="Data shown" className="inline-flex rounded-full border border-white/15 bg-white/5 p-1 text-sm font-bold">
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
              {live ? `${live.total} real reports so far. Every report adds a dot.` : 'Loading the real reports…'}
            </>
          )}
        </p>

        {/* City slideshow tabs */}
        <div className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Choose a city">
          {[...cities.map((c) => ({ slug: c.slug, label: c.label })), { slug: 'region', label: 'All of East Africa' }].map((c) => {
            const active = view === c.slug
            return (
              <button
                key={c.slug}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => pick(c.slug)}
                className={`relative inline-flex min-h-10 shrink-0 items-center overflow-hidden rounded-full px-4 text-sm font-bold transition ${
                  active ? 'bg-gold-400 text-emerald-950' : 'border border-white/15 text-white/80 hover:text-white'
                }`}
              >
                {c.label}
                {active && autoplay && c.slug !== 'region' ? (
                  <span
                    key={`${view}-${near}`}
                    className="absolute bottom-0 left-0 h-0.5 bg-emerald-950/60"
                    style={{ animation: `rt-slide-progress ${SLIDE_MS}ms linear forwards` }}
                  />
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div
            ref={ref}
            className="relative h-[440px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0c2622] shadow-[0_30px_80px_rgba(0,0,0,.35)] sm:h-[480px] lg:h-[620px]"
          >
            {near ? (
              <Suspense fallback={<div className="grid h-full place-items-center text-sm text-[#a9c9bf]">Loading map…</div>}>
                <RegionHeatmap points={points} counts={counts} focus={isRegion ? null : view} />
              </Suspense>
            ) : null}
            <span
              className={`pointer-events-none absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.14em] ${
                isDemo ? 'bg-gold-400 text-emerald-950' : 'bg-[#ef8268] text-white'
              }`}
            >
              {isDemo ? 'Demo data' : '● Live'}
            </span>
            {!isRegion ? (
              <Link
                to={cityPath(view, '/map')}
                className="absolute bottom-4 left-4 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#063b32] shadow-lg"
              >
                Open the {viewLabel} map →
              </Link>
            ) : null}
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5">
              <p className="text-sm font-extrabold">
                {viewLabel} snapshot {isDemo ? <span className="text-gold-300">(demo)</span> : null}
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2.5">
                <Tile label="Trash spots logged" value={fmt(stats.spots)} />
                <Tile label="Spots cleared" value={fmt(stats.cleared)} accent="text-[#5eead4]" />
                <Tile label="Upcoming cleanups" value={fmt(stats.cleanups)} />
                <Tile label="Bins spotted" value={fmt(stats.bins)} soon={!isDemo && !live?.features} />
                <Tile label="Trees planted" value={fmt(stats.trees)} soon={!isDemo && !live?.features} />
                <Tile label="Waste removed" value={stats.kg ? fmtKg(stats.kg) : '—'} accent="text-gold-300" />
              </dl>
            </div>

            <div className="rounded-[1.5rem] border border-[#ef8268]/30 bg-[#ef8268]/[.08] p-5">
              <p className="text-sm font-extrabold">The scale of the problem</p>
              {tonnes > 0 || single?.collectedShare ? (
                <>
                  <p className="mt-3 text-[clamp(1.6rem,4vw,2.2rem)] font-extrabold leading-tight tracking-[-.02em]">
                    {tonnes > 0 ? (
                      <>
                        {fmt(Math.round(tonnes))} <span className="text-lg font-bold text-[#f6c7b9]">tonnes of waste a day</span>
                      </>
                    ) : (
                      <>
                        {Math.round((1 - (single?.collectedShare ?? 0)) * 100)}%{' '}
                        <span className="text-lg font-bold text-[#f6c7b9]">of waste never collected</span>
                      </>
                    )}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#f3ddd5]">
                    {isRegion
                      ? `Generated in Nairobi and Kampala alone. Roughly ${fmt(Math.round(uncollected))} tonnes a day is never collected and ends up in streets, drains and rivers.`
                      : single?.tonnesPerDay && single.collectedShare
                        ? `Only about ${Math.round(single.collectedShare * 100)}% is collected. That leaves roughly ${fmt(Math.round(single.tonnesPerDay * (1 - single.collectedShare)))} tonnes a day in streets, drains and rivers.`
                        : 'Reliable daily tonnage for this city is still being sourced.'}
                  </p>
                  {(isRegion || view === 'nairobi') && !isDemo ? (
                    <p className="mt-3 rounded-xl bg-black/20 p-3 text-sm leading-6 text-[#e7f5f0]">
                      Ramani-Taka crews have removed <strong className="text-gold-300">{fmtKg(liveKg)}</strong> so far. Small
                      next to the problem, which is why every report and every crew counts.
                    </p>
                  ) : null}
                  <p className="mt-3 text-[11px] leading-4 text-[#c9a99f]">
                    Sources:{' '}
                    {facts
                      .flatMap((f) => f.sources)
                      .filter((s, i, all) => all.findIndex((x) => (x.url ?? x.label) === (s.url ?? s.label)) === i)
                      .map((s, i) => (
                        <span key={s.label}>
                          {i > 0 ? ' · ' : ''}
                          {s.url ? (
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">
                              {s.label}
                            </a>
                          ) : (
                            s.label
                          )}
                        </span>
                      ))}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-[#f3ddd5]">Figures for this city are still being sourced.</p>
              )}
            </div>

            <div className="flex-1 rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5">
              <p className="text-sm font-extrabold">Live feed {isDemo ? <span className="text-gold-300">(demo)</span> : null}</p>
              {feed.length === 0 ? (
                <p className="mt-4 text-sm text-[#a9c9bf]">Nothing yet. Be the first to report a spot.</p>
              ) : (
                <ol className="mt-2 divide-y divide-white/10">
                  {feed.slice(0, 3).map((item) => {
                    const body = (
                      <>
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10">{FEED_ICON[item.kind]}</span>
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
