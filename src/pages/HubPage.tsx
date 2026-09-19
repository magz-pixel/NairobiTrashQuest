import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/site/SiteNav'
import { FixNairobiMark } from '../components/site/BrandMark'
import { NAIROBI, cityPath, getActiveCities } from '../lib/cities'

const chapters = getActiveCities()

export function HubPage() {
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
          <p className="hidden text-xs font-semibold text-teal-100/70 sm:block">East Africa trash map</p>
        </div>
      </header>

      <main>
        <header className="fn-intro">
          <div className="fn-intro-index" aria-hidden="true">
            <span>RT</span>
            <b>2026</b>
          </div>
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
            Open the map where you live.
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
                  {city.label} chapter of Ramani-Taka. Same map, same race, same public ledger —
                  filtered to this city.
                </p>
                <Link
                  to={cityPath(city.slug, '/map')}
                  className="mt-auto inline-flex min-h-12 items-center pt-8 text-sm font-extrabold text-gold-300"
                >
                  Open the {city.label} map ↗
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#e5f0eb] px-5 py-16 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="fn-eyebrow">Amazing Trash Race</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-[-.05em] text-[#063b32]">
                Squads, hotspots, a public scoreboard.
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-[#5d746e]">
                The race runs as a city chapter. Register in Nairobi today; Kampala and Dar es
                Salaam use the same ticket engine when local crews go live.
              </p>
              <Link
                to={cityPath(NAIROBI, '/race')}
                className="mt-7 inline-flex min-h-12 items-center rounded-[var(--radius-control)] bg-gold-400 px-6 text-sm font-extrabold text-emerald-950"
              >
                Enter the Nairobi race ↗
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-white p-6 shadow-[var(--shadow-card)]">
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6a827b]">Chapters</p>
                <p className="mt-3 text-4xl font-extrabold text-[#063b32]">{chapters.length}</p>
                <p className="mt-2 text-sm text-[#5d746e]">Nairobi · Kampala · Dar es Salaam</p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-6 shadow-[var(--shadow-card)]">
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6a827b]">One build</p>
                <p className="mt-3 text-4xl font-extrabold text-[#063b32]">1</p>
                <p className="mt-2 text-sm text-[#5d746e]">Codebase, database, and deployment.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter hub />
    </div>
  )
}
