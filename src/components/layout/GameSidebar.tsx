import { motion } from 'framer-motion'

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
  hotspotCount: number
  loading?: boolean
}

const NAV: { id: GameTab; label: string; icon: string }[] = [
  { id: 'map', label: 'Radar', icon: '◎' },
  { id: 'report', label: 'Scan', icon: '⊕' },
  { id: 'clear', label: 'Clear', icon: '✓' },
  { id: 'log', label: 'Log', icon: '⧗' },
  { id: 'events', label: 'Events', icon: '⚑' },
  { id: 'missions', label: 'Quests', icon: '★' },
  { id: 'blog', label: 'Feed', icon: '✎' },
  { id: 'rewards', label: 'Rewards', icon: '⬡' },
  { id: 'profile', label: 'Profile', icon: '☺' },
]

export function GameSidebar({
  activeTab,
  onTabChange,
  hotspotCount,
  loading,
}: GameSidebarProps) {
  return (
    <aside className="game-sidebar flex h-full w-[4.5rem] shrink-0 flex-col border-r border-[var(--border-glow)] bg-[var(--bg-charcoal)]/95 backdrop-blur-xl md:w-56">
      <motion.div
        className="border-b border-white/10 px-3 py-4 md:px-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="hidden font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.2em] text-[var(--neon-clean)] md:block">
          Trash Locator
        </p>
        <p className="font-[family-name:var(--font-display)] text-lg font-bold text-white md:text-xl">
          NBO
        </p>
        <p className="mt-1 hidden text-[10px] uppercase tracking-wider text-white/40 md:block">
          Nairobi ops
        </p>
      </motion.div>

      <nav className="flex flex-1 flex-col gap-1 p-2 md:p-3">
        {NAV.map((item) => {
          const active = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`group relative flex items-center gap-3 rounded-xl px-2 py-3 text-left transition-all md:px-3 ${
                active
                  ? 'bg-[var(--neon-clean)]/15 text-[var(--neon-clean)] shadow-[inset_0_0_20px_rgba(57,255,20,0.08)]'
                  : 'text-white/55 hover:bg-white/5 hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl border border-[var(--neon-clean)]/40"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/40 font-[family-name:var(--font-display)] text-lg">
                {item.icon}
              </span>
              <span className="relative z-10 hidden text-sm font-semibold md:inline">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      <motion.div
        className="m-2 rounded-xl border border-[var(--neon-clean)]/20 bg-black/50 p-3 md:m-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
          Hotspots
        </p>
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--neon-clean)]">
          {loading ? '—' : hotspotCount}
        </p>
        <p className="mt-1 hidden text-[10px] text-white/40 md:block">
          Active pollution zones
        </p>
      </motion.div>
    </aside>
  )
}
