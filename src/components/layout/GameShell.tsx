import type { ReactNode } from 'react'
import { GameSidebar, type GameTab } from './GameSidebar'

export type { GameTab }

interface GameShellProps {
  activeTab: GameTab
  onTabChange: (tab: GameTab) => void
  hotspotCount: number
  loading?: boolean
  header?: ReactNode
  children: ReactNode
  panel?: ReactNode
}

export function GameShell({
  activeTab,
  onTabChange,
  hotspotCount,
  loading,
  header,
  children,
  panel,
}: GameShellProps) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[var(--bg-deep)]">
      <GameSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        hotspotCount={hotspotCount}
        loading={loading}
      />
      <div className="relative flex min-w-0 flex-1 flex-col">
        {header}
        <main className="relative min-h-0 flex-1">{children}</main>
        {panel}
      </div>
    </div>
  )
}
