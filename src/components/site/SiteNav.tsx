import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AuthModal } from '../auth/AuthModal'
import { useAuth } from '../../hooks/useAuth'
import { isRaceLive } from '../../types/database'
import { FixNairobiMark } from './art/HeroArtScene'

const links: { to: string; label: string }[] = [
  { to: '/mission', label: 'Mission' },
  { to: '/map', label: 'Trash Map' },
  { to: '/cleanups', label: 'Cleanups' },
  { to: '/race', label: 'Trash Race' },
  { to: '/race/leaderboard', label: 'Leaderboard' },
  { to: '/funds', label: 'Funds' },
]

const navLinkClass = (isActive: boolean, size: 'sm' | 'md' = 'md') =>
  `inline-flex min-h-[44px] items-center rounded-md transition hover:bg-white/5 hover:text-white ${
    size === 'sm' ? 'w-full px-3 py-2.5 text-sm' : 'px-2.5 py-2 text-sm'
  } ${isActive ? 'bg-white/10 text-white' : 'text-teal-100/80'}`

interface SiteNavProps {
  transparentOverHero?: boolean
}

export function SiteNav({ transparentOverHero = false }: SiteNavProps) {
  const [solid, setSolid] = useState(!transparentOverHero)
  const [authOpen, setAuthOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, profile, loading, signOut } = useAuth()
  const raceLive = isRaceLive()

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
          ? 'border-b border-white/10 bg-[#0c1f1c]/95 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link to="/" className="group flex min-w-0 items-center gap-2.5" onClick={closeMenu}>
          <FixNairobiMark className="shrink-0" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[#e8f5f1] md:text-xl">
              Fix Nairobi
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-teal-300/80">
              & XPNC
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => navLinkClass(isActive)}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {!loading && user ? (
            <>
              <Link
                to="/me"
                className="hidden min-h-[44px] items-center rounded-lg border border-white/15 px-2.5 py-2 text-xs font-semibold text-teal-100 hover:bg-white/5 lg:inline-flex"
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
                className="hidden min-h-[44px] items-center px-2 text-xs text-teal-200/70 hover:text-white lg:inline-flex"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="hidden min-h-[44px] items-center rounded-lg border border-white/20 px-2.5 py-2 text-xs font-semibold text-teal-50 hover:bg-white/5 lg:inline-flex md:text-sm"
            >
              Join / Sign in
            </button>
          )}
          {raceLive ? (
            <Link
              to="/race"
              className="inline-flex min-h-[44px] items-center rounded-lg bg-[#2dd4bf] px-3 py-2 text-xs font-semibold text-[#042f2e] transition hover:bg-[#5eead4] md:text-sm"
            >
              Register S2
            </Link>
          ) : null}
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/20 text-lg text-teal-50 hover:bg-white/5 lg:hidden"
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
          className="border-t border-white/10 px-4 py-3 lg:hidden"
          aria-label="Mobile menu"
        >
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  onClick={closeMenu}
                  className={({ isActive }) => navLinkClass(isActive, 'sm')}
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
            {user ? (
              <li>
                <NavLink
                  to="/me"
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

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#071613] px-4 py-10 text-teal-100/70 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-3">
          <FixNairobiMark />
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[#e8f5f1]">
              Fix Nairobi & XPNC
            </p>
            <p className="mt-1 max-w-md text-sm">
              We clean Nairobi together. Fix Nairobi organises real cleanups; XPNC is the
              digital layer that tracks good deeds.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link to="/mission" className="hover:text-white">
            Mission
          </Link>
          <Link to="/map" className="hover:text-white">
            Trash Map
          </Link>
          <Link to="/cleanups" className="hover:text-white">
            Cleanups
          </Link>
          <Link to="/race" className="hover:text-white">
            Amazing Trash Race
          </Link>
          <Link to="/me" className="hover:text-white">
            My impact
          </Link>
          <Link to="/funds" className="hover:text-white">
            Fund ledger
          </Link>
          <Link to="/funds/manage" className="hover:text-white">
            Team login
          </Link>
        </div>
      </div>
    </footer>
  )
}
