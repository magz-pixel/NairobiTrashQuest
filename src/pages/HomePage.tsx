import { lazy, Suspense, useEffect, useState } from 'react'
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
  const [reportOpen, setReportOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [eventsOpen, setEventsOpen] = useState(false)
  const [missionsOpen, setMissionsOpen] = useState(false)
  const [blogOpen, setBlogOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [rewardsOpen, setRewardsOpen] = useState(false)

  const realReports = reports.filter((r) => !isDemoReport(r))

  useEffect(() => {
    if (activeTab === 'report') {
      setReportOpen(true)
      setActiveTab('map')
    }
    if (activeTab === 'clear') {
      setClearOpen(true)
      setActiveTab('map')
    }
    if (activeTab === 'events') {
      setEventsOpen(true)
      setActiveTab('map')
    }
    if (activeTab === 'missions') {
      setMissionsOpen(true)
      setActiveTab('map')
    }
    if (activeTab === 'blog') {
      setBlogOpen(true)
      setActiveTab('map')
    }
    if (activeTab === 'log') {
      setLogOpen(true)
      setActiveTab('map')
    }
    if (activeTab === 'profile') {
      setProfileOpen(true)
      setActiveTab('map')
    }
    if (activeTab === 'rewards') {
      setRewardsOpen(true)
      setActiveTab('map')
    }
  }, [activeTab])

  const header = (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between p-4 pl-2 md:pl-4">
      <div className="pointer-events-auto rounded-xl border border-white/10 bg-black/60 px-4 py-2 backdrop-blur-md">
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
      <div className="pointer-events-auto">
        <ProfileBadge />
      </div>
    </div>
  )

  return (
    <GameShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
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
          <MapView reports={reports} heatPoints={heatPoints} />
        </Suspense>
        {header}
        <MapLegend />

        <div className="pointer-events-none absolute bottom-4 left-2 z-[1000] md:left-4">
          <div className="pointer-events-auto flex flex-col gap-2 sm:flex-row">
            <AuthGate onAuthenticated={() => setReportOpen(true)}>
              <button
                type="button"
                onClick={() => user && setReportOpen(true)}
                className="game-action-btn game-action-btn--scan"
              >
                ⊕ Scan trash
              </button>
            </AuthGate>
            <AuthGate onAuthenticated={() => setClearOpen(true)}>
              <button
                type="button"
                onClick={() => user && setClearOpen(true)}
                className="game-action-btn game-action-btn--clear"
              >
                ✓ Verify clear
              </button>
            </AuthGate>
          </div>
        </div>
      </div>

      <EventsPanel open={eventsOpen} onClose={() => setEventsOpen(false)} />
      <MissionsPanel open={missionsOpen} onClose={() => setMissionsOpen(false)} />
      <BlogPanel open={blogOpen} onClose={() => setBlogOpen(false)} />
      <CleanupLogPanel open={logOpen} onClose={() => setLogOpen(false)} onLogged={refetch} />
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
      <RewardsPanel open={rewardsOpen} onClose={() => setRewardsOpen(false)} />

      {user && (
        <>
          <ReportTrashModal
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            onReported={refetch}
          />
          <ClearTrashModal
            open={clearOpen}
            onClose={() => setClearOpen(false)}
            activeReports={realReports}
            onCleared={refetch}
          />
        </>
      )}
    </GameShell>
  )
}
