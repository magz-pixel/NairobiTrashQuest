import type { ReactNode } from 'react'
import { GameSidebar, type GameTab } from './GameSidebar'
import { MobileNav } from './MobileNav'
import { ReportActionBar } from './ReportActionBar'

export type { GameTab }

interface GameShellProps {
  activeTab: GameTab
  onTabChange: (tab: GameTab) => void
  onReport: () => void
  reportLabel?: string
  children: ReactNode
}

export function GameShell({
  activeTab,
  onTabChange,
  onReport,
  reportLabel,
  children,
}: GameShellProps) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[var(--bg-app)]">
      <div className="hidden md:block">
        <GameSidebar activeTab={activeTab} onTabChange={onTabChange} />
      </div>
      <div className="relative flex min-w-0 flex-1 flex-col">
        <main className="relative min-h-0 flex-1">{children}</main>
      </div>
      <ReportActionBar onReport={onReport} label={reportLabel} />
      <MobileNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  )
}
