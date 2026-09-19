import { motion } from 'framer-motion'
import { useCity } from '../../lib/CityContext'

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
  const city = useCity()
  return (
    <aside
      className="flex h-full w-[15.5rem] shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]"
      aria-label="Main navigation"
    >
      <div className="border-b border-[var(--border-subtle)] px-5 py-5">
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-950 text-sm font-extrabold text-gold-300">RT</span><div><p className="text-sm font-extrabold text-[var(--text-primary)]">{city.chapterName}</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.16em] text-[var(--text-muted)]">field workspace</p></div></div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-[var(--text-muted)]">Participate</p>
        {NAV.map((item) => {
          const active = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              aria-label={item.label}
              onClick={() => onTabChange(item.id)}
              className={`relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-emerald-950 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:bg-teal-50 hover:text-[var(--text-primary)]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="rail-active"
                  className="absolute left-0 top-2 h-7 w-1 rounded-full bg-gold-400"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 grid h-7 w-7 place-items-center rounded-lg bg-black/5 text-base leading-none">{item.icon}</span><span className="relative z-10">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
