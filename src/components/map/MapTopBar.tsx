import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { cityPath, getActiveCities } from '../../lib/cities'
import { useCity, useCityPath, useCitySwitchPath } from '../../lib/CityContext'
import { getLocale, setLocale, whatsappReportUrl } from '../../lib/i18n'
import { SignInButton } from '../auth/SignInButton'
import { FixNairobiMark } from '../site/BrandMark'

interface MapTopBarProps {
  onVerify: () => void
  onOpenPanel: (id: 'log' | 'events' | 'missions' | 'profile') => void
  onAdmin?: () => void
}

export function MapTopBar({ onVerify, onOpenPanel, onAdmin }: MapTopBarProps) {
  const city = useCity()
  const path = useCityPath()
  const switchCity = useCitySwitchPath()
  const navigate = useNavigate()
  const { user, profile, loading } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)
  const [, setLocaleTick] = useState(0)
  const chapters = getActiveCities()

  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moreOpen])

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-[1100] p-2 pt-[max(0.5rem,env(safe-area-inset-top))] md:p-4">
      <div className="pointer-events-auto mx-auto flex max-w-5xl items-center gap-1.5 rounded-2xl border border-white/70 bg-white/94 px-1.5 py-1.5 shadow-[0_18px_50px_rgba(6,59,50,.14)] backdrop-blur-md md:gap-2 md:px-3 md:py-2">
        <Link
          to={path('/')}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl hover:bg-emerald-50 md:flex md:w-auto md:items-center md:gap-2 md:px-1.5"
          aria-label={`${city.chapterName} home`}
        >
          <FixNairobiMark className="shrink-0" />
          <span className="hidden min-w-0 md:block">
            <span className="block truncate text-sm font-extrabold tracking-tight text-[#063b32]">
              {city.chapterName}
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[.14em] text-[#6a827b]">
              Field map
            </span>
          </span>
        </Link>

        <label className="min-w-0 flex-1 md:hidden">
          <span className="sr-only">City chapter</span>
          <select
            value={city.slug}
            onChange={(e) => navigate(switchCity(e.target.value))}
            className="h-11 w-full min-w-0 truncate rounded-xl border-0 bg-transparent px-1 text-[15px] font-extrabold text-[#063b32]"
          >
            {chapters.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.chapterName}
              </option>
            ))}
          </select>
        </label>

        <label className="ml-auto hidden md:block">
          <span className="sr-only">City chapter</span>
          <select
            value={city.slug}
            onChange={(e) => navigate(switchCity(e.target.value))}
            className="h-10 rounded-xl border border-[#d9e9e4] bg-white px-2 text-xs font-bold text-[#12332d]"
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
          className="hidden min-h-10 items-center rounded-xl px-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#0b8c76] hover:bg-emerald-50 md:inline-flex"
        >
          Cities
        </Link>

        {!loading && !user ? (
          <SignInButton label="Join" className="hidden min-h-10 shadow-none md:inline-flex" />
        ) : null}

        <div className="relative shrink-0">
          <button
            type="button"
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            aria-label="More map actions"
            onClick={() => setMoreOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#d9e9e4] text-sm font-extrabold text-[#063b32] hover:bg-emerald-50"
          >
            {moreOpen ? '✕' : '···'}
          </button>
          {moreOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+8px)] z-20 max-h-[min(70dvh,28rem)] w-56 overflow-y-auto rounded-2xl border border-[#d9e9e4] bg-white py-2 shadow-[0_20px_60px_rgba(6,59,50,.18)]"
            >
              {!loading && !user ? (
                <div className="border-b border-[#e5efeb] px-3 py-2 md:hidden">
                  <SignInButton label="Join" className="w-full shadow-none" />
                </div>
              ) : null}
              <Link
                role="menuitem"
                to={cityPath(city.slug)}
                className="block px-4 py-2.5 text-sm font-semibold text-[#12332d] hover:bg-emerald-50"
                onClick={() => setMoreOpen(false)}
              >
                Chapter home
              </Link>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-[#12332d] hover:bg-emerald-50"
                onClick={() => {
                  setMoreOpen(false)
                  onVerify()
                }}
              >
                Verify a clear
              </button>
              {(
                [
                  ['log', 'Cleanup log'],
                  ['events', 'Events'],
                  ['missions', 'Missions'],
                  ['profile', 'My profile'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="menuitem"
                  className="block min-h-11 w-full px-4 py-2.5 text-left text-sm font-semibold text-[#12332d] hover:bg-emerald-50"
                  onClick={() => {
                    setMoreOpen(false)
                    onOpenPanel(id)
                  }}
                >
                  {label}
                </button>
              ))}
              <a
                role="menuitem"
                href={whatsappReportUrl()}
                target="_blank"
                rel="noreferrer"
                className="block px-4 py-2.5 text-sm font-semibold text-[#12332d] hover:bg-emerald-50"
                onClick={() => setMoreOpen(false)}
              >
                Report via WhatsApp
              </a>
              <button
                type="button"
                role="menuitem"
                className="block min-h-11 w-full px-4 py-2.5 text-left text-sm font-semibold text-[#12332d] hover:bg-emerald-50"
                onClick={() => {
                  setLocale(getLocale() === 'en' ? 'sw' : 'en')
                  setLocaleTick((n) => n + 1)
                  setMoreOpen(false)
                }}
              >
                Language · {getLocale() === 'en' ? 'Kiswahili' : 'English'}
              </button>
              {profile?.is_admin && onAdmin ? (
                <button
                  type="button"
                  role="menuitem"
                  className="block min-h-11 w-full px-4 py-2.5 text-left text-sm font-semibold text-[#12332d] hover:bg-emerald-50"
                  onClick={() => {
                    setMoreOpen(false)
                    onAdmin()
                  }}
                >
                  Admin tools
                </button>
              ) : null}
              <Link
                role="menuitem"
                to="/"
                className="block px-4 py-2.5 text-sm font-semibold text-[#0b8c76] hover:bg-emerald-50 md:hidden"
                onClick={() => setMoreOpen(false)}
              >
                All cities
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
