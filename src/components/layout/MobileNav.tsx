import type { GameTab } from './GameShell'

interface MobileNavProps {
  activeTab: GameTab
  onTabChange: (tab: GameTab) => void
}

const NAV: { id: GameTab; label: string; icon: string }[] = [
  { id: 'map', label: 'Radar', icon: '◎' },
  { id: 'report', label: 'Scan', icon: '⊕' },
  { id: 'clear', label: 'Clear', icon: '✓' },
  { id: 'log', label: 'Log', icon: '⧗' },
  { id: 'blog', label: 'Feed', icon: '✎' },
  { id: 'profile', label: 'Me', icon: '☺' },
]

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav className="pointer-events-auto fixed inset-x-0 bottom-0 z-[1300] border-t border-white/10 bg-black/75 backdrop-blur-xl md:hidden">
      <div
        className="mx-auto flex max-w-lg items-stretch justify-between px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV.map((item) => {
          const active = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex w-full flex-col items-center gap-1 py-3 text-xs ${
                active ? 'text-[var(--neon-clean)]' : 'text-white/55'
              }`}
            >
              <span className="font-[family-name:var(--font-display)] text-lg leading-none">
                {item.icon}
              </span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

