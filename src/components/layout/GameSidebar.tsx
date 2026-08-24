import { motion } from 'framer-motion'
import { marketConfig } from '../../lib/marketConfig'

export type GameTab =
  | 'map'
  | 'report'
  | 'clear'
  | 'events'
  | 'missions'
  | 'profile'
  | 'rewards'
  | 'blog'
  | 'log'

interface GameSidebarProps {
  activeTab: GameTab
  onTabChange: (tab: GameTab) => void
}

const NAV: { id: GameTab; label: string; icon: string }[] = [
  { id: 'map', label: 'Map', icon: '◎' },
  { id: 'report', label: 'Report', icon: '⊕' },
  { id: 'clear', label: 'Verify', icon: '✓' },
  { id: 'log', label: 'Log', icon: '⧗' },
  { id: 'events', label: 'Events', icon: '⚑' },
  { id: 'missions', label: 'Missions', icon: '★' },
  { id: 'blog', label: 'Feed', icon: '✎' },
  { id: 'rewards', label: 'Rewards', icon: '⬡' },
  { id: 'profile', label: 'Profile', icon: '☺' },
]

export function GameSidebar({ activeTab, onTabChange }: GameSidebarProps) {
  return (
    <aside
      className="flex h-full w-[var(--nav-rail-width,3.5rem)] shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]"
      aria-label="Main navigation"
    >
      <div className="flex h-14 items-center justify-center border-b border-[var(--border-subtle)]">
        <span
          className="text-lg font-bold text-[var(--brand-teal)]"
          title={marketConfig.appName}
        >
          {marketConfig.appShortName}
        </span>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1 p-2">
        {NAV.map((item) => {
          const active = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              aria-label={item.label}
              onClick={() => onTabChange(item.id)}
              className={`relative flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-colors ${
                active
                  ? 'bg-[var(--brand-teal)]/10 text-[var(--brand-teal)]'
                  : 'text-[var(--text-muted)] hover:bg-gray-100 hover:text-[var(--text-primary)]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="rail-active"
                  className="absolute inset-0 rounded-lg border border-[var(--brand-teal)]/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.icon}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
