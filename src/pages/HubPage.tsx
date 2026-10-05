import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SiteFooter } from '../components/site/SiteNav'
import { FixNairobiMark } from '../components/site/BrandMark'
import { CHAPTER_NAV } from '../lib/chapterPages'
import { cityPath, getActiveCities, type CityConfig } from '../lib/cities'
import { getCurrentPosition } from '../lib/geo'

const CITY_LINES: Record<string, string> = {
  nairobi: 'Open reports and the Amazing Trash Race results live on this chapter.',
  kampala: 'The map is open here. A race has not started in Kampala yet.',
  'dar-es-salaam': 'The map is open, and community cleanup funding sits on this chapter.',
}

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

  const reportTrash = () => {
    setLocating(true)
    getCurrentPosition()
      .then((position) => {
        const city = nearestCity(position.coords.latitude, position.coords.longitude)
        navigate(cityPath(city.slug, '/map'))
      })
      .catch(() => navigate('/nairobi/map'))
      .finally(() => setLocating(false))
  }

  return (
    <div className="fn-rebuild min-h-full bg-[#f4f7f2] text-[#12332d]">
      <header className="sticky inset-x-0 top-0 z-50 border-b border-white/10 bg-emerald-950/95 text-white backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <FixNairobiMark className="shrink-0" />
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight md:text-xl">
              Ramani-Taka
            </span>
          </Link>
          <button
            type="button"
            onClick={reportTrash}
            className="inline-flex min-h-11 items-center rounded-full bg-gold-400 px-4 text-sm font-extrabold text-emerald-950"
          >
            {locating ? 'Finding your city…' : 'Report trash'}
          </button>
        </div>
      </header>

      <main>
        <header className="fn-intro">
          <div className="fn-intro-copy">
            <p className="fn-eyebrow">One product · many cities</p>
            <h1 className="fn-display">Ramani-Taka is the trash map. Each city is a chapter.</h1>
            <p className="fn-intro-body">
              Report a dirty spot, rally a cleanup, and keep the proof public. Same engine in
              Nairobi, Kampala, and Dar es Salaam — local crews, local money, local streets.
            </p>
          </div>
          <div className="fn-intro-signal" aria-hidden="true">
            <span>FIELD SIGNAL</span>
            <i />
            <i />
            <i />
            <i />
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-8 lg:px-12">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700">Choose a city</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-[-.05em] text-[#063b32]">
            Enter the chapter where you live.
          </h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {chapters.map((city) => (
              <article
                key={city.slug}
                className="flex min-h-[280px] flex-col rounded-[1.5rem] bg-[#063b32] p-6 text-white shadow-[var(--shadow-card)] sm:p-8"
              >
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-gold-300">
                  {city.country}
                </p>
                <h3 className="mt-8 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-.04em]">
                  {city.chapterName}
                </h3>
                <p className="mt-3 text-sm leading-6 text-teal-100/75">
                  {CITY_LINES[city.slug] ?? `${city.label} chapter of Ramani-Taka.`}
                </p>
                <Link
                  to={cityPath(city.slug)}
                  className="mt-auto inline-flex min-h-12 items-center pt-6 text-sm font-extrabold text-gold-300"
                >
                  Enter {city.chapterName} →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#e5f0eb] px-5 py-16 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <p className="fn-eyebrow">Same desk, every city</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-[-.05em] text-[#063b32]">
              You keep all the pages. The city is just the filter.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#5d746e]">
              Open a chapter and the whole product is there: map, cleanups, race, leaderboard,
              funds, and mission. Switch cities later — you stay on the same kind of page.
            </p>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CHAPTER_NAV.map((page, index) => (
                <li key={page.href} className="rounded-[1.5rem] bg-white p-6 shadow-[var(--shadow-card)]">
                  <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6a827b]">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-4 text-2xl font-extrabold tracking-[-.04em] text-[#063b32]">
                    {page.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5d746e]">{page.blurb}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <SiteFooter hub />
    </div>
  )
}
