import { lazy, Suspense, useState } from 'react'
import { flushSync } from 'react-dom'
import { useActiveReports } from '../hooks/useActiveReports'
import { useHeatmapPoints } from '../hooks/useHeatmapPoints'
import { AuthGate } from '../components/auth/AuthGate'
import { ProfileBadge } from '../components/auth/ProfileBadge'
import { GameShell, type GameTab } from '../components/layout/GameShell'
import { MapLegend } from '../components/map/MapLegend'
import { EventsPanel } from '../components/panels/EventsPanel'
import { BlogPanel } from '../components/panels/BlogPanel'
import { CleanupLogPanel } from '../components/panels/CleanupLogPanel'
import { MissionsPanel } from '../components/panels/MissionsPanel'
import { ProfilePanel } from '../components/panels/ProfilePanel'
import { RewardsPanel } from '../components/panels/RewardsPanel'
import { ReportTrashModal } from '../components/reports/ReportTrashModal'
import { ClearTrashModal } from '../components/reports/ClearTrashModal'
import { isDemoReport, showDemoData } from '../lib/demoReports'
import { useAuth } from '../hooks/useAuth'

const MapView = lazy(() =>
  import('../components/map/MapView').then((m) => ({ default: m.MapView })),
)

export function HomePage() {
  const { user } = useAuth()
  const { reports, loading, refetch } = useActiveReports()
  const heatPoints = useHeatmapPoints(reports)
  const [activeTab, setActiveTab] = useState<GameTab>('map')
  const [activePanel, setActivePanel] = useState<GameTab | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)

  const realReports = reports.filter((r) => !isDemoReport(r))

  const closePanelsAndModals = () => {
    setActivePanel(null)
    setReportOpen(false)
    setClearOpen(false)
  }

  const openReport = () => {
    flushSync(() => {
      setActiveTab('map')
      setActivePanel(null)
      setClearOpen(false)
      setReportOpen(false)
    })
    setReportOpen(true)
  }

  const openClear = () => {
    flushSync(() => {
      setActiveTab('map')
      setActivePanel(null)
      setReportOpen(false)
      setClearOpen(false)
    })
    setClearOpen(true)
  }

  const handleTab = (tab: GameTab) => {
    if (tab === 'map') {
      setActiveTab('map')
      closePanelsAndModals()
      return
    }

    if (tab === 'report') {
      openReport()
      return
    }

    if (tab === 'clear') {
      openClear()
      return
    }

    setActivePanel((prev) => {
      const next = prev === tab ? null : tab
      setActiveTab(next ? tab : 'map')
      return next
    })
  }

  const header = (
    <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+10px)] z-[1000] flex items-stretch justify-between gap-2 px-2 md:top-0 md:p-4 md:pl-4">
      <div className="pointer-events-auto flex min-h-[52px] flex-col justify-center rounded-xl border border-white/10 bg-black/60 px-3 py-2 backdrop-blur-md md:px-4">
        <h1 className="font-[family-name:var(--font-display)] text-base font-bold tracking-wide text-white md:text-lg">
          Pollution radar
        </h1>
        <p className="text-xs text-white/55">
          {loading
            ? 'Scanning…'
            : `${reports.length} zones · pollution heat field`}
          {showDemoData && !loading && realReports.length === 0 && (
            <span className="ml-1 text-[var(--neon-clean)]">· demo</span>
          )}
        </p>
      </div>
      <ProfileBadge className="pointer-events-auto min-h-[52px]" />
    </div>
  )

  return (
    <GameShell
      activeTab={activeTab}
      onTabChange={handleTab}
      hotspotCount={reports.length}
      loading={loading}
      header={null}
    >
      <div className="relative h-full w-full">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center font-[family-name:var(--font-display)] text-[var(--neon-clean)]">
              Loading radar…
            </div>
          }
        >
          <MapView
            reports={reports}
            heatPoints={heatPoints}
            onInteract={() => {
              setActivePanel(null)
              setActiveTab('map')
            }}
          />
        </Suspense>
        {header}
        <MapLegend />

        <div
          className="pointer-events-none absolute left-2 z-[1000] md:bottom-4 md:left-4"
          style={{
            bottom:
              'calc(env(safe-area-inset-bottom) + var(--mobile-nav-height, 64px) + 8px)',
          }}
        >
          <div className="pointer-events-auto flex flex-col gap-2 sm:flex-row">
            <AuthGate onAuthenticated={openReport}>
              <button
                type="button"
                onClick={() => user && openReport()}
                className="game-action-btn game-action-btn--scan"
              >
                ⊕ Scan trash
              </button>
            </AuthGate>
            <AuthGate onAuthenticated={openClear}>
              <button
                type="button"
                onClick={() => user && openClear()}
                className="game-action-btn game-action-btn--clear"
              >
                ✓ Verify clear
              </button>
            </AuthGate>
          </div>
        </div>
      </div>

      <EventsPanel
        open={activePanel === 'events'}
        onClose={() => {
          setActivePanel(null)
          setActiveTab('map')
        }}
      />
      <MissionsPanel
        open={activePanel === 'missions'}
        onClose={() => {
          setActivePanel(null)
          setActiveTab('map')
        }}
      />
      <BlogPanel
        open={activePanel === 'blog'}
        onClose={() => {
          setActivePanel(null)
          setActiveTab('map')
        }}
      />
      <CleanupLogPanel
        open={activePanel === 'log'}
        onClose={() => {
          setActivePanel(null)
          setActiveTab('map')
        }}
        onLogged={refetch}
      />
      <ProfilePanel
        open={activePanel === 'profile'}
        onClose={() => {
          setActivePanel(null)
          setActiveTab('map')
        }}
      />
      <RewardsPanel
        open={activePanel === 'rewards'}
        onClose={() => {
          setActivePanel(null)
          setActiveTab('map')
        }}
      />

      {user && (
        <>
          <ReportTrashModal
            open={reportOpen}
            onClose={() => {
              setReportOpen(false)
              setActiveTab('map')
            }}
            onReported={refetch}
          />
          <ClearTrashModal
            open={clearOpen}
            onClose={() => {
              setClearOpen(false)
              setActiveTab('map')
            }}
            activeReports={realReports}
            onCleared={refetch}
          />
        </>
      )}
    </GameShell>
  )
}
