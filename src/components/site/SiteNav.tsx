import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AuthModal } from '../auth/AuthModal'
import { useAuth } from '../../hooks/useAuth'
import { useCity, useCityPath, useCitySwitchPath } from '../../lib/CityContext'
import { cityPath, getActiveCities } from '../../lib/cities'
import { CHAPTER_NAV } from '../../lib/chapterPages'
import { isRaceLive } from '../../types/database'
import { FixNairobiMark } from './BrandMark'

const navLinkClass = (isActive: boolean, size: 'sm' | 'md' = 'md') =>
  `inline-flex min-h-[44px] items-center rounded-[var(--radius-control)] transition hover:bg-white/10 hover:text-white ${
    size === 'sm' ? 'w-full px-3 py-2.5 text-sm' : 'px-2.5 py-2 text-sm'
  } ${isActive ? 'bg-white/15 text-white' : 'text-teal-100/80'}`

interface SiteNavProps {
  transparentOverHero?: boolean
}

export function SiteNav({ transparentOverHero = false }: SiteNavProps) {
  const [solid, setSolid] = useState(!transparentOverHero)
  const [authOpen, setAuthOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, profile, loading, signOut } = useAuth()
  const raceLive = isRaceLive()
  const city = useCity()
  const path = useCityPath()
  const switchCity = useCitySwitchPath()
  const navigate = useNavigate()
  const chapters = getActiveCities()

  useEffect(() => {
    if (!transparentOverHero) {
      setSolid(true)
      return
    }
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparentOverHero])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header
      className={`${
        transparentOverHero ? 'fixed' : 'sticky'
      } inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid
          ? 'border-b border-white/10 bg-emerald-950/95 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link to={path('/')} className="group flex min-w-0 items-center gap-2.5" onClick={closeMenu}>
          <FixNairobiMark className="shrink-0" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white md:text-xl">
              Ramani-Taka
            </span>
            <span className="truncate text-[10px] font-bold uppercase tracking-[.14em] text-teal-200/80">
              {city.chapterName}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 xl:flex" aria-label="Primary">
          {CHAPTER_NAV.map((item) => (
            <NavLink key={item.href} to={path(item.href)} className={({ isActive }) => navLinkClass(isActive)}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <label className="hidden md:block">
            <span className="sr-only">City chapter</span>
            <select
              value={city.slug}
              onChange={(e) => {
                navigate(switchCity(e.target.value))
              }}
              className="h-10 rounded-lg border border-white/20 bg-emerald-950 px-2 text-xs font-semibold text-teal-50"
            >
              {chapters.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <Link
            to="/"
            className="hidden min-h-[44px] items-center px-2 text-[10px] font-bold uppercase tracking-[.12em] text-teal-200/80 hover:text-white md:inline-flex"
          >
            All cities
          </Link>
          {!loading && user ? (
            <>
              <Link
                to={path('/me')}
                className="hidden min-h-[44px] items-center rounded-lg border border-white/15 px-2.5 py-2 text-xs font-semibold text-teal-100 hover:bg-white/5 xl:inline-flex"
              >
                My impact
                {profile ? (
                  <span className="ml-1.5 text-[var(--fn-clear,#00f2fe)]">
                    {profile.total_impact_points} XP
                  </span>
                ) : null}
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="hidden min-h-[44px] items-center px-2 text-xs text-teal-200/70 hover:text-white xl:inline-flex"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="hidden min-h-[44px] items-center rounded-lg border border-white/20 px-2.5 py-2 text-xs font-semibold text-teal-50 hover:bg-white/5 xl:inline-flex md:text-sm"
            >
              Join / Sign in
            </button>
          )}
          {raceLive ? (
            <Link
              to={path('/race')}
              className="inline-flex min-h-[44px] items-center rounded-[var(--radius-control)] bg-gold-400 px-3 py-2 text-xs font-bold text-emerald-950 transition hover:bg-gold-300 md:text-sm"
            >
              Register
            </Link>
          ) : null}
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/20 text-lg text-teal-50 hover:bg-white/5 xl:hidden"
            aria-expanded={menuOpen}
            aria-controls="site-mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="site-mobile-menu"
          className="border-t border-white/10 px-4 py-3 xl:hidden"
          aria-label="Mobile menu"
        >
          <label className="mb-3 block md:hidden">
            <span className="sr-only">City chapter</span>
            <select
              value={city.slug}
              onChange={(e) => {
                closeMenu()
                navigate(switchCity(e.target.value))
              }}
              className="min-h-11 w-full rounded-lg border border-white/20 bg-emerald-950 px-3 text-sm font-semibold text-teal-50"
            >
              {chapters.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.chapterName}
                </option>
              ))}
            </select>
          </label>
          <Link
            to="/"
            onClick={closeMenu}
            className="mb-2 inline-flex min-h-[44px] w-full items-center rounded-md px-3 py-2.5 text-sm text-teal-100/80 hover:bg-white/5 hover:text-white md:hidden"
          >
            All cities
          </Link>
          <ul className="flex flex-col gap-1">
            {CHAPTER_NAV.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={path(item.href)}
                  onClick={closeMenu}
                  className={({ isActive }) => navLinkClass(isActive, 'sm')}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            {user ? (
              <li>
                <NavLink
                  to={path('/me')}
                  onClick={closeMenu}
                  className={({ isActive }) => navLinkClass(isActive, 'sm')}
                >
                  My impact
                  {profile ? ` · ${profile.total_impact_points} XP` : ''}
                </NavLink>
              </li>
            ) : (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    setAuthOpen(true)
                  }}
                  className="inline-flex min-h-[44px] w-full items-center rounded-md px-3 py-2.5 text-sm text-teal-100/80 hover:bg-white/5 hover:text-white"
                >
                  Join / Sign in
                </button>
              </li>
            )}
            {user ? (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    void signOut()
                  }}
                  className="inline-flex min-h-[44px] w-full items-center rounded-md px-3 py-2.5 text-sm text-teal-200/70 hover:bg-white/5 hover:text-white"
                >
                  Sign out
                </button>
              </li>
            ) : null}
          </ul>
        </nav>
      )}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  )
}

export function SiteFooter({ hub = false }: { hub?: boolean }) {
  if (hub) {
    return (
      <footer className="relative overflow-hidden bg-emerald-950 px-4 pb-6 pt-16 text-white sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-12 border-b border-white/15 pb-14 lg:grid-cols-[1.3fr_.7fr]">
            <div>
              <p className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[.22em] text-teal-200">
                <span className="h-px w-10 bg-gold-400" /> The work continues
              </p>
              <h2 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[.98] tracking-[-.06em] sm:text-6xl">
                One map. Many cities. People on the ground.
              </h2>
              <div className="mt-8 flex flex-wrap gap-3">
                {getActiveCities().map((c) => (
                  <Link
                    key={c.slug}
                    to={cityPath(c.slug)}
                    className="inline-flex min-h-12 items-center rounded-full bg-gold-400 px-5 text-sm font-extrabold text-emerald-950"
                  >
                    {c.chapterName} ↗
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-teal-100/45 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Ramani-Taka. Built for the people on the ground.</p>
            <p>Nairobi · Kampala · Dar es Salaam</p>
          </div>
        </div>
      </footer>
    )
  }

  return <ChapterFooter />
}

function ChapterFooter() {
  const city = useCity()
  const path = useCityPath()
  return (
    <footer className="relative overflow-hidden bg-emerald-950 px-4 pb-6 pt-16 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-teal-400/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-12 border-b border-white/15 pb-14 lg:grid-cols-[1.3fr_.7fr] lg:gap-20">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[.22em] text-teal-200">
              <span className="h-px w-10 bg-gold-400" /> The work continues
            </p>
            <h2 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[.98] tracking-[-.06em] sm:text-6xl">
              Leave {city.label} a little better than you found it.
            </h2>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={path('/map')}
                className="inline-flex min-h-12 items-center rounded-full bg-gold-400 px-6 text-sm font-extrabold text-emerald-950 transition hover:-translate-y-0.5 hover:bg-gold-300"
              >
                Put a spot on the map <span className="ml-3 text-lg">↗</span>
              </Link>
              <Link
                to={path('/mission')}
                className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-6 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Read our mission
              </Link>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-teal-200">Field pulse</p>
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gold-300">
                <span className="h-2 w-2 rounded-full bg-gold-400" /> Live
              </span>
            </div>
            <p className="mt-6 text-5xl font-extrabold tracking-[-.07em]">{city.label}</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-teal-100/65">
              A city held together by people who notice, care, and show up.
            </p>
          </div>
        </div>
        <div className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_.65fr_.65fr_.65fr]">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <FixNairobiMark />
              <span className="text-lg font-extrabold tracking-[-.03em]">Ramani-Taka</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-teal-100/60">
              {city.chapterName} — real cleanups, public proof, and a city that can see its own progress.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-white/40">Explore</p>
            <div className="mt-4 grid gap-3 text-sm text-teal-100/75">
              <Link to={path('/mission')} className="hover:text-white">Our mission</Link>
              <Link to={path('/map')} className="hover:text-white">Trash map</Link>
              <Link to={path('/cleanups')} className="hover:text-white">Cleanups</Link>
              <Link to={path('/race')} className="hover:text-white">Trash Race</Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-white/40">Keep score</p>
            <div className="mt-4 grid gap-3 text-sm text-teal-100/75">
              <Link to={path('/race/leaderboard')} className="hover:text-white">Leaderboard</Link>
              <Link to={path('/me')} className="hover:text-white">My impact</Link>
              <Link to={path('/funds')} className="hover:text-white">Fund ledger</Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-white/40">For teams</p>
            <div className="mt-4 grid gap-3 text-sm text-teal-100/75">
              <Link to={path('/funds/manage')} className="hover:text-white">Team login</Link>
              <Link to={path('/cleanups/manage')} className="hover:text-white">Manage cleanups</Link>
              <Link to={path('/race/admin')} className="hover:text-white">Race admin</Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-teal-100/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Ramani-Taka. Built for the people on the ground.</p>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-300" /> {city.label}, {city.country}
          </p>
        </div>
      </div>
    </footer>
  )
}
