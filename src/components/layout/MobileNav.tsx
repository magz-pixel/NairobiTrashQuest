import type { GameTab } from './GameSidebar'

interface MobileNavProps {
  activeTab: GameTab
  onTabChange: (tab: GameTab) => void
  userLoggedIn?: boolean
}

const NAV_BASE: { id: GameTab; label: string; icon: string }[] = [
  { id: 'map', label: 'Map', icon: '◎' },
  { id: 'report', label: 'Report', icon: '⊕' },
]

const NAV_VERIFY: { id: GameTab; label: string; icon: string } = {
  id: 'clear',
  label: 'Verify',
  icon: '✓',
}

const NAV_TAIL: { id: GameTab; label: string; icon: string }[] = [
  { id: 'log', label: 'Log', icon: '⧗' },
  { id: 'blog', label: 'Feed', icon: '✎' },
  { id: 'profile', label: 'Me', icon: '☺' },
]

const NAV_TAIL_SIGNED_IN: { id: GameTab; label: string; icon: string }[] = [
  { id: 'log', label: 'Log', icon: '⧗' },
  { id: 'profile', label: 'Me', icon: '☺' },
]

export function MobileNav({ activeTab, onTabChange, userLoggedIn }: MobileNavProps) {
  const nav = userLoggedIn
    ? [...NAV_BASE, NAV_VERIFY, ...NAV_TAIL_SIGNED_IN]
    : [...NAV_BASE, ...NAV_TAIL]

  return (
    <nav className="pointer-events-auto fixed inset-x-3 bottom-3 z-[1300] rounded-2xl border border-white/70 bg-white/95 shadow-[0_16px_45px_rgba(6,59,50,.18)] backdrop-blur-md md:hidden">
      <div
        className="mx-auto flex max-w-lg items-stretch justify-between px-2"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: 'calc(var(--mobile-nav-height, 64px) + env(safe-area-inset-bottom))',
        }}
      >
        {nav.map((item) => {
          const active = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`relative flex w-full flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-xs ${
                active ? 'bg-emerald-950 text-white' : 'text-[var(--text-muted)]'
              }`}
            >
              {active && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold-400" />
              )}
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
