import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SiteFooter } from '../components/site/SiteNav'
import { FixNairobiMark } from '../components/site/BrandMark'
import { BrushStrokes, CitySky } from '../components/site/CitySky'
import { useCityCounts } from '../hooks/useCityCounts'
import { RegionSection } from '../components/hub/RegionSection'
import { cityPath, getActiveCities, getCity, type CityConfig } from '../lib/cities'
import { getCurrentPosition } from '../lib/geo'
import { isStandalone, lastCity } from '../lib/pwa'
import { skyImage } from '../lib/sky'

const CITY_LINES: Record<string, string> = {
  nairobi: 'Home of the Amazing Trash Race. The most active map in the network.',
  kampala: 'The map is open. Be one of the first to put Kampala’s hotspots on it.',
  'dar-es-salaam': 'The map is open, with community funding for cleanups.',
}

const STEPS = [
  {
    n: '01',
    title: 'Snap it',
    copy: 'See a dumped pile or a blocked drain? One photo and a pin. No account, about 30 seconds.',
    icon: '📸',
  },
  {
    n: '02',
    title: 'Rally your street',
    copy: 'Neighbours confirm it, crews see it, and cleanups get planned around real hotspots.',
    icon: '🧹',
  },
  {
    n: '03',
    title: 'Prove the change',
    copy: 'A before and after photo on the same spot. Public, permanent, hard to fake.',
    icon: '✅',
  },
]

function nearestCity(lat: number, lng: number): CityConfig {
  const cities = getActiveCities()
  return cities.reduce((best, city) => {
    const bestD = (best.center.lat - lat) ** 2 + (best.center.lng - lng) ** 2
    const nextD = (city.center.lat - lat) ** 2 + (city.center.lng - lng) ** 2
    return nextD < bestD ? city : best
  }, cities[0])
}

const chapters = getActiveCities()

export function HubPage() {
  const navigate = useNavigate()
  const [locating, setLocating] = useState(false)
  const { counts, total, loaded } = useCityCounts()
  const home = lastCity()

  const reportTrash = () => {
    setLocating(true)
    getCurrentPosition()
      .then((position) => {
        const city = nearestCity(position.coords.latitude, position.coords.longitude)
        navigate(`${cityPath(city.slug, '/map')}?action=report`)
      })
      .catch(() => navigate(`${cityPath(home, '/map')}?action=report`))
      .finally(() => setLocating(false))
  }

  return (
    <div className="fn-rebuild min-h-full bg-[#f4f7f2] text-[#12332d]">
      <main>
        <CitySky cities={chapters.map((c) => c.slug)} className="min-h-[100svh] md:min-h-[min(100svh,860px)]">
          {(current) => {
            const city = getCity(current)
            const c = counts[current]
            return (
              <div className="mx-auto flex min-h-[100svh] max-w-7xl flex-col px-5 pb-10 pt-4 sm:px-8 md:min-h-[min(100svh,860px)] lg:px-12">
                {/* Top bar sits on the sky */}
                <header className="flex items-center justify-between gap-3">
                  <Link to="/" className="flex items-center gap-2.5">
                    <FixNairobiMark className="shrink-0" />
                    <span className="sky-ink whitespace-nowrap font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight max-[359px]:sr-only">
                      Ramani-Taka
                    </span>
                  </Link>
                  <div className="flex items-center gap-2">
                    {!isStandalone() ? (
                      <Link
                        to="/install"
                        className="sky-glass sky-ink inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-3.5 text-sm font-bold"
                      >
                        Get the app
                      </Link>
                    ) : null}
                    <Link
                      to={cityPath(home, '/map')}
                      className="inline-flex min-h-10 items-center whitespace-nowrap rounded-full bg-[#063b32] px-4 text-sm font-bold text-white max-sm:hidden"
                    >
                      Open map
                    </Link>
                  </div>
                </header>

                {/* Headline in the open sky */}
                <div className="mt-[9vh] max-w-2xl md:mt-[11vh] lg:max-w-[52rem]">
                  <p className="sky-glass sky-ink inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.14em]">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ef8268] opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ef8268]" />
                    </span>
                    Live in Nairobi · Kampala · Dar
                  </p>
                  <h1 className="sky-ink fn-display mt-5 text-[clamp(2.6rem,10.5vw,5.2rem)] font-extrabold leading-[1.02] tracking-[-.035em]">
                    Every trash pile has an{' '}
                    <span className="inline-block whitespace-nowrap rounded-[.32em] bg-[radial-gradient(circle_at_30%_30%,#45c6ae,#075e50_56%,#063b32)] px-[.18em] pb-[.08em] text-white shadow-[0_14px_34px_rgba(6,59,50,.25)]">
                      address.
                    </span>
                  </h1>
                  <p className="sky-ink-soft mt-5 max-w-[34ch] text-[17px] leading-7 sm:text-lg sm:leading-8">
                    Snap it, pin it, and watch your street get cleaned. The live, people-powered trash map for East
                    Africa’s cities.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={reportTrash}
                      className="inline-flex min-h-13 items-center gap-2 rounded-full bg-gold-400 px-6 py-3.5 text-base font-extrabold text-emerald-950 shadow-[0_16px_40px_rgba(217,154,22,.38)] transition hover:-translate-y-0.5"
                    >
                      {locating ? 'Finding your city…' : '📍 Report a spot'}
                    </button>
                    <Link
                      to={cityPath(home, '/map')}
                      className="sky-glass sky-ink inline-flex min-h-13 items-center gap-2 rounded-full px-6 py-3.5 text-base font-bold transition hover:-translate-y-0.5"
                    >
                      Explore the map →
                    </Link>
                  </div>
                </div>

                {/* Live numbers + which city the sky is showing */}
                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-10">
                  <dl className="flex flex-wrap gap-2">
                    <div className="sky-glass rounded-2xl px-4 py-2.5">
                      <dt className="sky-ink-soft text-[10px] font-extrabold uppercase tracking-[.14em]">Open spots</dt>
                      <dd className="sky-ink text-2xl font-extrabold tabular-nums">{loaded ? total.open : '—'}</dd>
                    </div>
                    {total.cleared > 0 ? (
                      <div className="sky-glass rounded-2xl px-4 py-2.5">
                        <dt className="sky-ink-soft text-[10px] font-extrabold uppercase tracking-[.14em]">Cleared</dt>
                        <dd className="sky-ink text-2xl font-extrabold tabular-nums">{total.cleared}</dd>
                      </div>
                    ) : null}
                    <div className="sky-glass rounded-2xl px-4 py-2.5">
                      <dt className="sky-ink-soft text-[10px] font-extrabold uppercase tracking-[.14em]">Cities</dt>
                      <dd className="sky-ink text-2xl font-extrabold tabular-nums">{chapters.length}</dd>
                    </div>
                  </dl>
                  <Link
                    to={cityPath(current)}
                    className="sky-glass sky-ink inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold"
                  >
                    <span className="opacity-70 max-sm:hidden">Now showing</span> 📍 {city.label}
                    <span className="opacity-70 max-sm:hidden">, {city.country}</span>
                    {c ? <span className="opacity-70">· {c.open} open</span> : null} →
                  </Link>
                </div>
              </div>
            )
          }}
        </CitySky>

        {/* Quiet pointer to /story. Must not compete with "Report a spot". */}
        <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[#063b32]/10 bg-[#fffdf7] p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex shrink-0 -space-x-2" aria-hidden>
              <img src="/story/arnold-magezi.webp" alt="" width={40} height={40} loading="lazy" className="h-10 w-10 rounded-full border-2 border-white object-cover object-top" />
              <img src="/story/edwin-macharia.webp" alt="" width={40} height={40} loading="lazy" className="h-10 w-10 rounded-full border-2 border-white object-cover object-top" />
            </div>
            <p className="flex-1 text-sm leading-6 text-[#12332d]">
              New here? Read how a social-tech entrepreneur, a community environmentalist and one trash pile started Ramani-Taka.
            </p>
            <div className="flex shrink-0 items-center gap-4">
              <Link to="/story" className="inline-flex min-h-11 items-center text-sm font-extrabold text-[#0b8c76]">
                Read our story →
              </Link>
              <Link to="/story?lang=sw" lang="sw" className="inline-flex min-h-11 items-center text-xs font-bold text-[#617972] underline">
                Soma kwa Kiswahili
              </Link>
            </div>
          </div>
        </section>

        <RegionSection />

        <section className="relative mx-auto max-w-7xl px-5 pb-6 pt-14 sm:px-8 lg:px-12">
          <BrushStrokes className="absolute -top-6 right-4 hidden w-56 opacity-80 md:block" />
          <p className="fn-eyebrow">Pick your city</p>
          <h2 className="fn-display mt-3 max-w-2xl text-[clamp(2rem,6vw,3rem)] font-extrabold leading-tight tracking-[-.03em] text-[#063b32]">
            Same map. Your streets.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {chapters.map((city) => {
              const c = counts[city.slug]
              const img = skyImage(city.slug, 'sm')
              return (
                <Link
                  key={city.slug}
                  to={cityPath(city.slug)}
                  className="group relative flex min-h-[260px] flex-col overflow-hidden rounded-[1.75rem] bg-[#063b32] p-6 text-white shadow-[0_24px_60px_rgba(6,59,50,.18)] transition hover:-translate-y-1"
                >
                  {img ? (
                    <img
                      src={img}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 -z-0 h-full w-full object-cover object-[center_70%] transition duration-700 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,30,26,.15)_0%,rgba(4,30,26,.35)_45%,rgba(4,30,26,.92)_100%)]" />
                  <div className="relative mt-auto">
                    <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-gold-300">{city.country}</p>
                    <h3 className="fn-display mt-1 text-3xl font-extrabold tracking-[-.025em]">{city.chapterName}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/80">{CITY_LINES[city.slug] ?? `${city.label} on Ramani-Taka.`}</p>
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
                      {c ? `${c.open} open spot${c.open === 1 ? '' : 's'}` : 'Map open'}
                      <span className="transition group-hover:translate-x-1">→</span>
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12">
          <p className="fn-eyebrow">How it works</p>
          <h2 className="fn-display mt-3 max-w-2xl text-[clamp(2rem,6vw,3rem)] font-extrabold leading-tight tracking-[-.03em] text-[#063b32]">
            From “someone should fix this” to fixed.
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-[1.5rem] border border-[#d9e9e4] bg-white p-6 shadow-[0_14px_40px_rgba(6,59,50,.06)]">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#effaf5] text-2xl">{s.icon}</span>
                  <span className="text-xs font-extrabold tracking-[.16em] text-[#9ab0a8]">{s.n}</span>
                </div>
                <h3 className="mt-6 text-2xl font-extrabold tracking-[-.02em] text-[#063b32]">{s.title}</h3>
                <p className="mt-2 leading-7 text-[#5d746e]">{s.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="px-5 pb-16 sm:px-8 lg:px-12">
          <div className="fn-panel-dark relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#063b32] px-6 py-12 text-white sm:px-12">
            <BrushStrokes className="absolute -bottom-6 -right-10 w-80 opacity-40" />
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-gold-300">Open data</p>
            <h2 className="fn-display mt-3 max-w-2xl text-[clamp(1.9rem,5vw,2.8rem)] font-extrabold leading-tight tracking-[-.03em]">
              The waste map your city never had, built by the people who live in it.
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-teal-50/75">
              Every pin, cleanup and cleared spot becomes public data that counties, NGOs and funders can act on.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reportTrash}
                className="inline-flex min-h-12 items-center rounded-full bg-gold-400 px-6 text-sm font-extrabold text-emerald-950"
              >
                Report your first spot
              </button>
              <Link
                to="/story"
                className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-6 text-sm font-bold text-white hover:bg-white/10"
              >
                Our story →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter hub />
    </div>
  )
}
