import { NavLink, useLocation } from 'react-router-dom'
import { useCityPath } from '../../lib/CityContext'

const tab = (active: boolean) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold ${
    active ? 'text-[#063b32]' : 'text-[#7b8c85]'
  }`

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}

/**
 * Phone bottom tab bar: Map · Cleanups · ＋Report · Feed · Me. Hidden on desktop. On the map page
 * the map shrinks to sit above it (see HomePage), so it needs no spacer there.
 */
export function BottomTabBar() {
  const path = useCityPath()
  const { pathname } = useLocation()
  const onMap = /\/map$/.test(pathname)

  return (
    <>
      {/* Spacer so page content isn't hidden behind the bar (the full-screen feed handles its own). */}
      {!onMap && !/\/feed$/.test(pathname) ? <div className="h-[calc(4.25rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden /> : null}
      <nav
        aria-label="App"
        className="fixed inset-x-0 bottom-0 z-[1200] flex items-end border-t border-[#e5efeb] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(6,59,50,.08)] backdrop-blur md:hidden"
      >
        <NavLink to={path('/map')} className={({ isActive }) => tab(isActive)}>
          <Icon d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15" />
          Map
        </NavLink>
        <NavLink to={path('/cleanups')} className={({ isActive }) => tab(isActive)}>
          <Icon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          Cleanups
        </NavLink>
        <NavLink to={`${path('/map')}?action=report`} className="flex flex-1 flex-col items-center pb-1.5" aria-label="Report a spot">
          <span className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-gold-400 text-3xl font-light text-emerald-950 shadow-[0_10px_24px_rgba(217,154,22,.45)] ring-4 ring-white">
            +
          </span>
          <span className="mt-0.5 text-[10px] font-extrabold text-[#063b32]">Report</span>
        </NavLink>
        <NavLink to={path('/feed')} className={({ isActive }) => tab(isActive)}>
          <Icon d="M4 4h16v6H4zM4 14h16v6H4z" />
          Feed
        </NavLink>
        <NavLink to={path('/me')} className={({ isActive }) => tab(isActive)}>
          <Icon d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
          Me
        </NavLink>
      </nav>
    </>
  )
}
