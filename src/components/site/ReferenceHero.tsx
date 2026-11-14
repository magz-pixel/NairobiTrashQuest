import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReportStats } from '../../types/database'
import { useCity, useCityPath } from '../../lib/CityContext'
import { CHAPTER_PAGES } from '../../lib/chapterPages'
import { FixNairobiMark } from './BrandMark'
import { BrushStrokes, CitySky } from './CitySky'

interface ReferenceHeroProps {
  stats: ReportStats
  loading: boolean
}

const arrow = 'M5 12h14M13 6l6 6-6 6'

const HERO_POSTER = '/hero-nairobi-cleanup.jpg'

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduce(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduce
}

export function ReferenceHero({ stats, loading }: ReferenceHeroProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const reduceMotion = usePrefersReducedMotion()
  const showVideo = !reduceMotion && !videoFailed
  const city = useCity()
  const path = useCityPath()

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', menuOpen)
    return () => document.body.classList.remove('overflow-hidden')
  }, [menuOpen])

  const isNairobi = city.slug === 'nairobi'

  return (
    <>
      <CitySky cities={[city.slug]} className="min-h-[100svh] lg:min-h-[min(100svh,900px)]">
        <div className="mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 gap-10 px-5 pb-14 pt-4 sm:px-8 lg:min-h-[min(100svh,900px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:items-center lg:gap-14 lg:px-12">
          <div className="flex min-w-0 flex-col lg:self-stretch">
            <div className="flex items-center gap-4 pt-1">
              <Link to="/" className="sky-ink flex shrink-0 items-center gap-2 text-sm font-extrabold uppercase tracking-[.08em]">
                <FixNairobiMark className="shrink-0" />
                Ramani-Taka
              </Link>
              <span className="sky-ink-soft hidden text-xs font-semibold sm:inline">
                {city.label}, {city.country}
              </span>
              <button
                type="button"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="sky-glass sky-ink ml-auto flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-full"
              >
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-3.5 rounded-full bg-current" />
              </button>
            </div>

            <div className="mt-[7vh] max-w-2xl lg:my-auto">
              <p className="sky-glass sky-ink inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.14em]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ef8268] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ef8268]" />
                </span>
                {loading || stats.active === 0 ? `${city.label} · map open` : `${stats.active} open in ${city.label} right now`}
              </p>
              <h1 className="sky-ink fn-display mt-5 text-[clamp(2.5rem,10vw,5.4rem)] font-extrabold lg:text-[clamp(3rem,4.4vw,4.5rem)] leading-[1.03] tracking-[-.035em]">
                {city.label}, show us{' '}
                <span className="inline-block whitespace-nowrap rounded-[.3em] bg-[radial-gradient(circle_at_30%_30%,#45c6ae,#075e50_56%,#063b32)] px-[.18em] pb-[.08em] text-white shadow-[0_14px_34px_rgba(6,59,50,.25)]">
                  where it hurts.
                </span>
              </h1>
              <p className="sky-ink-soft mt-5 max-w-[40ch] text-[17px] leading-7 sm:text-lg sm:leading-8">
                Pin the dumped piles and blocked drains on your street. Neighbours rally, crews show up, and the
                before-and-after stays public.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to={`${path('/map')}?action=report`}
                  className="inline-flex min-h-13 items-center gap-2 rounded-full bg-gold-400 px-6 py-3.5 text-base font-extrabold text-emerald-950 shadow-[0_16px_40px_rgba(217,154,22,.38)] transition hover:-translate-y-0.5"
                >
                  📍 Report a spot
                </Link>
                <Link
                  to={path('/map')}
                  className="sky-glass sky-ink group inline-flex min-h-13 items-center gap-3 rounded-full px-6 py-3.5 text-base font-bold transition hover:-translate-y-0.5"
                >
                  See the live map
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 transition group-hover:translate-x-1"
                  >
                    <path d={arrow} />
                  </svg>
                </Link>
              </div>
              <dl className={`mt-8 flex flex-wrap gap-2 ${!loading && stats.total === 0 ? 'hidden' : ''}`}>
                <div className="sky-glass rounded-2xl px-4 py-2.5">
                  <dt className="sky-ink-soft text-[10px] font-extrabold uppercase tracking-[.14em]">Open spots</dt>
                  <dd className="sky-ink text-2xl font-extrabold tabular-nums">{loading ? '—' : stats.active}</dd>
                </div>
                {stats.resolved > 0 ? (
                  <div className="sky-glass rounded-2xl px-4 py-2.5">
                    <dt className="sky-ink-soft text-[10px] font-extrabold uppercase tracking-[.14em]">Cleared</dt>
                    <dd className="sky-ink text-2xl font-extrabold tabular-nums">{stats.resolved}</dd>
                  </div>
                ) : null}
                {!loading && stats.total !== stats.active ? (
                  <div className="sky-glass rounded-2xl px-4 py-2.5">
                    <dt className="sky-ink-soft text-[10px] font-extrabold uppercase tracking-[.14em]">Reports</dt>
                    <dd className="sky-ink text-2xl font-extrabold tabular-nums">{stats.total}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl pb-4 lg:max-w-none lg:pb-0">
            <BrushStrokes className="absolute -bottom-8 -left-12 z-0 w-[78%]" />
            <BrushStrokes className="absolute -right-8 -top-8 z-0 w-40 rotate-180 opacity-90" />
            <div className={`relative z-10 max-h-[78vh] overflow-hidden rounded-[28px] bg-emerald-950 shadow-[0_30px_80px_rgba(6,59,50,.35)] ${isNairobi ? 'aspect-[16/11] sm:aspect-[4/3] lg:aspect-[4/5]' : 'min-h-[280px] lg:aspect-[4/5]'}`}>
              {isNairobi ? (
                <>
                  <img
                    src={HERO_POSTER}
                    alt="A volunteer bagging trash at a Fix Nairobi cleanup"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {showVideo && (
                    <video
                      className="absolute inset-0 h-full w-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      poster={HERO_POSTER}
                      preload="metadata"
                      aria-hidden
                      onError={() => setVideoFailed(true)}
                    >
                      <source src="/hero-nairobi-cleanup.mp4" type="video/mp4" onError={() => setVideoFailed(true)} />
                    </video>
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(4,24,20,.6))]" />
                  <p className="absolute left-4 top-4 rounded-full bg-black/25 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                    🧹 Field day · Mwiki
                  </p>
                </>
              ) : (
                <div className="flex h-full min-h-[280px] flex-col justify-end bg-[radial-gradient(circle_at_75%_20%,rgba(251,191,36,.35),transparent_40%),linear-gradient(150deg,#0b8c76,#063b32_60%)] p-6 pb-20 text-white sm:p-8 sm:pb-20">
                  <p className="text-4xl sm:text-5xl">📍</p>
                  <p className="fn-display mt-3 text-2xl font-extrabold leading-tight tracking-[-.02em] sm:text-3xl">
                    Be one of the first to map {city.label}.
                  </p>
                  <p className="mt-3 max-w-sm text-white/75">
                    Every pin you drop here starts {city.label}&rsquo;s public trash record.
                  </p>
                </div>
              )}
              <Link
                to={path('/map')}
                aria-label="Open the field map"
                className="absolute bottom-0 right-0 rounded-tl-[28px] bg-white px-6 py-4 text-xs font-extrabold uppercase tracking-[.12em] text-ink hover:text-emerald-700"
              >
                Open the map →
              </Link>
            </div>
          </div>
        </div>
      </CitySky>
      <div
        className={`fixed inset-0 z-50 transition ${menuOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-emerald-950/55 backdrop-blur-md transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <nav
          aria-label="Primary navigation"
          className={`absolute inset-4 grid overflow-hidden rounded-[28px] bg-emerald-950 text-white shadow-[0_30px_100px_rgba(0,0,0,.35)] transition duration-500 sm:inset-6 lg:inset-8 lg:grid-cols-[1.35fr_.65fr] ${menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
        >
          <div className="flex min-h-0 flex-col px-6 pb-6 pt-6 sm:px-10 sm:pb-10 sm:pt-8 lg:px-14">
            <div className="flex items-center justify-between border-b border-white/15 pb-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.24em] text-teal-200">
                  Ramani-Taka / menu
                </p>
                <p className="mt-1 text-sm text-white/50">Choose your next move</p>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/25 text-2xl leading-none transition hover:bg-white hover:text-emerald-950"
              >
                ×
              </button>
            </div>
            <ul className="mt-5 overflow-x-hidden overflow-y-auto">
              {CHAPTER_PAGES.map((item, index) => (
                <li key={item.href}>
                  <Link
                    to={path(item.href)}
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-center gap-4 border-b border-white/10 py-3.5 transition hover:pl-3 hover:text-teal-200 sm:py-4"
                  >
                    <span className="w-7 text-[10px] font-bold text-white/35">0{index + 1}</span>
                    <span className="text-[clamp(1.45rem,4vw,2.8rem)] font-semibold leading-none tracking-[-.025em]">
                      {item.label}
                    </span>
                    <span className="ml-auto translate-x-2 text-2xl opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap items-center gap-4 pt-6 text-xs text-white/50">
              <span>Made for the people on the ground.</span>
              <span className="h-1 w-1 rounded-full bg-gold-400" />
              <span>
                {city.label}, {city.country}
              </span>
              <Link to="/" onClick={() => setMenuOpen(false)} className="font-bold text-gold-300 hover:text-white">
                All cities →
              </Link>
            </div>
          </div>
          <div className="relative hidden overflow-hidden bg-[#d9eee7] p-8 text-emerald-950 lg:flex lg:flex-col lg:justify-between lg:p-10">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-300/70 blur-2xl" />
            <div className="relative">
              <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-emerald-700">The field brief</p>
              <h2 className="mt-5 max-w-xs text-4xl font-extrabold leading-[.95] tracking-[-.03em]">
                Put the city back in our hands.
              </h2>
              <p className="mt-5 max-w-xs text-sm leading-6 text-emerald-950/65">
                One report can give a crew the place, the proof, and the reason to show up.
              </p>
            </div>
            <div className="relative rounded-2xl bg-white/75 p-5 shadow-sm">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-muted">Open places today</p>
                  <p className="mt-2 text-5xl font-extrabold tracking-[-.03em]">{loading ? '—' : stats.active}</p>
                </div>
                <span className="mb-1 h-3 w-3 rounded-full bg-[#ef8268] shadow-[0_0_0_7px_rgba(239,130,104,.18)]" />
              </div>
              <Link
                to={path('/map')}
                onClick={() => setMenuOpen(false)}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-900 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Open the field map →
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}
