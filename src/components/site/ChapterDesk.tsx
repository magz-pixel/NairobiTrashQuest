import { Link, useLocation } from 'react-router-dom'
import { cityPath, getActiveCities } from '../../lib/cities'
import { CHAPTER_NAV, CHAPTER_PAGES } from '../../lib/chapterPages'

const tones = ['dark', 'mint', 'gold'] as const

interface ChapterDeskProps {
  slug: string
  chapterName: string
}

export function ChapterDesk({ slug, chapterName }: ChapterDeskProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-2xl">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700">Chapter desk</p>
        <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-[-.05em] sm:text-5xl">
          Every page in {chapterName}.
        </h2>
        <p className="mt-4 max-w-lg text-base leading-7 text-[#5d746e]">
          Same tools in Nairobi, Kampala, and Dar es Salaam. Pick a door — the map, the race, the
          ledger — and stay in this city.
        </p>
        <ChapterSwitcherPills slug={slug} />
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHAPTER_PAGES.map((page, index) => {
          const tone = tones[index % tones.length]
          const surface =
            tone === 'dark'
              ? 'bg-[#063b32] text-white'
              : tone === 'gold'
                ? 'bg-gold-100 text-emerald-950'
                : 'bg-[#dff0e9] text-[#12332d]'
          return (
            <Link
              key={page.href}
              to={cityPath(slug, page.href)}
              className={`group flex min-h-[220px] flex-col rounded-[1.5rem] p-6 transition hover:-translate-y-0.5 sm:p-7 ${surface}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-extrabold uppercase tracking-[.18em] opacity-65">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-2xl transition group-hover:translate-x-1">↗</span>
              </div>
              <div className="mt-auto pt-10">
                <h3 className="text-2xl font-extrabold tracking-[-.04em]">{page.label}</h3>
                <p className="mt-3 text-sm leading-6 opacity-70">{page.blurb}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function ChapterSwitcherPills({ slug }: { slug: string }) {
  const { pathname } = useLocation()
  const suffix = pathname.replace(new RegExp(`^/${slug}`), '') || ''
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {getActiveCities().map((city) => {
        const active = city.slug === slug
        return (
          <Link
            key={city.slug}
            to={`/${city.slug}${suffix}`}
            className={`inline-flex min-h-10 items-center rounded-full px-4 text-xs font-extrabold ${
              active
                ? 'bg-emerald-950 text-white'
                : 'border border-[#063b32]/15 bg-white text-[#063b32] hover:bg-[#dff0e9]'
            }`}
          >
            {city.chapterName}
          </Link>
        )
      })}
    </div>
  )
}

export function ChapterPageChips({ slug }: { slug: string }) {
  return (
    <ul className="mt-6 flex flex-wrap gap-2">
      {CHAPTER_NAV.map((page) => (
        <li key={page.href}>
          <Link
            to={cityPath(slug, page.href)}
            className="inline-flex min-h-9 items-center rounded-full border border-white/20 bg-white/5 px-3 text-xs font-bold text-teal-50 transition hover:bg-white hover:text-emerald-950"
          >
            {page.short}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function ChapterEscapeLinks({ slug }: { slug: string }) {
  const essentials = CHAPTER_NAV.filter((page) =>
    ['/map', '/cleanups', '/race', '/funds', '/mission'].includes(page.href),
  )
  return (
    <nav aria-label="Chapter pages" className="pointer-events-auto flex flex-wrap items-center gap-1.5">
      <Link
        to={cityPath(slug)}
        className="inline-flex min-h-[44px] items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-2 text-[10px] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
      >
        Chapter home
      </Link>
      {essentials.map((page) => (
        <Link
          key={page.href}
          to={cityPath(slug, page.href)}
          className="inline-flex min-h-[44px] items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-2 text-[10px] font-medium text-[var(--text-muted)] shadow-[var(--shadow-sm)] hover:text-[var(--text-primary)]"
        >
          {page.short}
        </Link>
      ))}
    </nav>
  )
}
