import { lazy, Suspense, useState } from 'react'
import { flushSync } from 'react-dom'
import { useReports } from '../hooks/useReports'
import { useReportStats } from '../hooks/useReportStats'
import { AuthGate } from '../components/auth/AuthGate'
import { ProfileBadge } from '../components/auth/ProfileBadge'
import { GameShell, type GameTab } from '../components/layout/GameShell'
import { BottomReportDock } from '../components/layout/BottomReportDock'
import { DigestBanner } from '../components/layout/DigestBanner'
import { MapStatsBar } from '../components/map/MapStatsBar'
import { MapFilters } from '../components/map/MapFilters'
import { MapLegend } from '../components/map/MapLegend'
import { ReportListView } from '../components/map/ReportListView'
import { ReportDetailSheet } from '../components/map/ReportDetailSheet'
import { EventsPanel } from '../components/panels/EventsPanel'
import { BlogPanel } from '../components/panels/BlogPanel'
import { CleanupLogPanel } from '../components/panels/CleanupLogPanel'
import { MissionsPanel } from '../components/panels/MissionsPanel'
import { ProfilePanel } from '../components/panels/ProfilePanel'
import { RewardsPanel } from '../components/panels/RewardsPanel'
import { AnalyticsPanel } from '../components/panels/AnalyticsPanel'
import { AdminReviewPanel } from '../components/panels/AdminReviewPanel'
import { ReportTrashModal } from '../components/reports/ReportTrashModal'
import { QuickReportModal } from '../components/reports/QuickReportModal'
import { ClearTrashModal } from '../components/reports/ClearTrashModal'
import { isDemoReport, showDemoData } from '../lib/demoReports'
import { exportReportsCsv, exportReportsGeoJson, getLocale, publicStatsUrl, setLocale, t, whatsappReportUrl } from '../lib/i18n'
import { useAuth } from '../hooks/useAuth'
import type { Report, SeverityFilter, StatusFilter } from '../types/database'

const MapView = lazy(() =>
  import('../components/map/MapView').then((m) => ({ default: m.MapView })),
)

type ViewMode = 'map' | 'list'

export function HomePage() {
  const { user, profile } = useAuth()
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const { reports, mapReports, allReports, loading, refetch } = useReports(
    severityFilter,
    statusFilter,
  )
  const stats = useReportStats(allReports)
  const [activeTab, setActiveTab] = useState<GameTab>('map')
  const [activePanel, setActivePanel] = useState<GameTab | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [quickReportOpen, setQuickReportOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [lightMap, setLightMap] = useState(false)
  const [, setLocaleTick] = useState(0)

  const realReports = allReports.filter((r) => !isDemoReport(r))

  const closePanelsAndModals = () => {
    setActivePanel(null)
    setQuickReportOpen(false)
    setReportOpen(false)
    setClearOpen(false)
    setSelectedReport(null)
    setAnalyticsOpen(false)
    setAdminOpen(false)
  }

  const openQuickReport = () => {
    flushSync(() => {
      setActiveTab('map')
      setActivePanel(null)
      setSelectedReport(null)
      setClearOpen(false)
      setReportOpen(false)
    })
    setQuickReportOpen(true)
  }

  const openScan = () => (user ? openReport() : openQuickReport())

  const openReport = () => {
    flushSync(() => {
      setActiveTab('map')
      setActivePanel(null)
      setSelectedReport(null)
      setClearOpen(false)
    })
    setReportOpen(true)
  }

  const openClear = () => {
    flushSync(() => {
      setActiveTab('map')
      setActivePanel(null)
      setSelectedReport(null)
      setReportOpen(false)
      setQuickReportOpen(false)
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
      openScan()
      return
    }
    if (tab === 'clear') {
      openClear()
      return
    }
    setSelectedReport(null)
    setActivePanel((prev) => {
      const next = prev === tab ? null : tab
      setActiveTab(next ? tab : 'map')
      return next
    })
  }

  const selectReport = (report: Report) => {
    flushSync(() => {
      setActivePanel(null)
      setActiveTab('map')
    })
    setSelectedReport(report)
  }

  const hudTop = (
    <div
      className="pointer-events-none absolute inset-x-0 z-[1000] space-y-2 px-2 md:px-4"
      style={{ top: 'calc(env(safe-area-inset-top) + 8px)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2">
          <div className="pointer-events-auto flex items-center gap-2">
            <h1 className="font-[family-name:var(--font-display)] text-sm font-bold text-white md:text-base">
              Nairobi Trash Locator
            </h1>
            <button
              type="button"
              className="pointer-events-auto rounded border border-white/15 px-2 py-0.5 text-[10px] text-white/60"
              onClick={() => {
                setLocale(getLocale() === 'en' ? 'sw' : 'en')
                setLocaleTick((n) => n + 1)
              }}
            >
              {getLocale() === 'en' ? 'SW' : 'EN'}
            </button>
          </div>
          <MapStatsBar stats={stats} loading={loading} />
          <MapFilters
            severity={severityFilter}
            status={statusFilter}
            onSeverityChange={setSeverityFilter}
            onStatusChange={setStatusFilter}
          />
        </div>
        <div className="flex flex-col items-end gap-2">
          <ProfileBadge className="pointer-events-auto min-h-[48px]" />
          <DigestBanner />
        </div>
      </div>
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setViewMode('map')}
          className={`rounded-lg px-3 py-1 text-xs font-semibold ${viewMode === 'map' ? 'bg-[var(--neon-clean)]/20 text-[var(--neon-clean)]' : 'bg-black/50 text-white/55'}`}
        >
          {t('map')}
        </button>
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`rounded-lg px-3 py-1 text-xs font-semibold ${viewMode === 'list' ? 'bg-[var(--neon-clean)]/20 text-[var(--neon-clean)]' : 'bg-black/50 text-white/55'}`}
        >
          {t('list')}
        </button>
        <button
          type="button"
          onClick={() => setLightMap((v) => !v)}
          className="rounded-lg bg-black/50 px-3 py-1 text-xs text-white/55"
        >
          {lightMap ? 'Dark map' : 'Light map'}
        </button>
        <button
          type="button"
          onClick={() => setAnalyticsOpen(true)}
          className="rounded-lg bg-black/50 px-3 py-1 text-xs text-white/55"
        >
          {t('analytics')}
        </button>
        <button
          type="button"
          onClick={() => exportReportsCsv(allReports)}
          className="rounded-lg bg-black/50 px-3 py-1 text-xs text-white/55"
        >
          {t('dataExport')}
        </button>
        <button
          type="button"
          onClick={() => exportReportsGeoJson(allReports)}
          className="rounded-lg bg-black/50 px-3 py-1 text-xs text-white/55"
        >
          {t('geoExport')}
        </button>
        {publicStatsUrl() && (
          <a
            href={publicStatsUrl()}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-black/50 px-3 py-1 text-xs text-white/55"
          >
            {t('publicApi')}
          </a>
        )}
        <a
          href={whatsappReportUrl()}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-green-900/40 px-3 py-1 text-xs text-green-400"
        >
          {t('whatsappReport')}
        </a>
        {profile?.is_admin && (
          <button
            type="button"
            onClick={() => setAdminOpen(true)}
            className="rounded-lg bg-amber-900/40 px-3 py-1 text-xs text-amber-300"
          >
            Admin
          </button>
        )}
        {showDemoData && !loading && realReports.length === 0 && (
          <span className="text-[10px] text-[var(--neon-clean)]">· demo data</span>
        )}
      </div>
    </div>
  )

  return (
    <GameShell
      activeTab={activeTab}
      onTabChange={handleTab}
      hotspotCount={mapReports.length}
      loading={loading}
      header={null}
    >
      <div className="relative h-full w-full">
        {viewMode === 'map' ? (
          <>
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center font-[family-name:var(--font-display)] text-[var(--neon-clean)]">
                  Loading radar…
                </div>
              }
            >
              <MapView
                reports={mapReports}
                lightBasemap={lightMap}
                onSelectReport={selectReport}
                onInteract={() => {
                  setActivePanel(null)
                  setActiveTab('map')
                }}
              />
            </Suspense>
            {hudTop}
            <MapLegend />
            <div
              className="pointer-events-none absolute right-2 z-[1000] hidden md:block"
              style={{
                bottom:
                  'calc(env(safe-area-inset-bottom) + var(--mobile-nav-height, 64px) + 8px)',
              }}
            >
              <div className="pointer-events-auto flex flex-col gap-2">
                <button type="button" onClick={openScan} className="game-action-btn game-action-btn--scan">
                  ⊕ {t('reportTrash')}
                </button>
                <AuthGate onAuthenticated={openClear}>
                  <button
                    type="button"
                    onClick={() => user && openClear()}
                    className="game-action-btn game-action-btn--clear"
                  >
                    ✓ {t('verifyClear')}
                  </button>
                </AuthGate>
              </div>
            </div>
          </>
        ) : (
          <>
            {hudTop}
            <div className="h-full pt-44">
              <ReportListView reports={reports} onSelect={selectReport} />
            </div>
          </>
        )}
      </div>

      <BottomReportDock onReport={openQuickReport} label={t('reportTrash')} />

      <ReportDetailSheet
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onVerify={() => {
          setSelectedReport(null)
          openClear()
        }}
        onUpdated={refetch}
        userLoggedIn={!!user}
      />

      <QuickReportModal
        open={quickReportOpen}
        onClose={() => setQuickReportOpen(false)}
        onReported={refetch}
      />

      <AnalyticsPanel open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} stats={stats} />
      <AdminReviewPanel open={adminOpen} onClose={() => setAdminOpen(false)} onReviewed={refetch} />

      <EventsPanel open={activePanel === 'events'} onClose={() => { setActivePanel(null); setActiveTab('map') }} />
      <MissionsPanel open={activePanel === 'missions'} onClose={() => { setActivePanel(null); setActiveTab('map') }} />
      <BlogPanel open={activePanel === 'blog'} onClose={() => { setActivePanel(null); setActiveTab('map') }} />
      <CleanupLogPanel open={activePanel === 'log'} onClose={() => { setActivePanel(null); setActiveTab('map') }} onLogged={refetch} />
      <ProfilePanel open={activePanel === 'profile'} onClose={() => { setActivePanel(null); setActiveTab('map') }} />
      <RewardsPanel open={activePanel === 'rewards'} onClose={() => { setActivePanel(null); setActiveTab('map') }} />

      {user && (
        <>
          <ReportTrashModal open={reportOpen} onClose={() => { setReportOpen(false); setActiveTab('map') }} onReported={refetch} />
          <ClearTrashModal open={clearOpen} onClose={() => { setClearOpen(false); setActiveTab('map') }} activeReports={realReports.filter((r) => r.status === 'active')} onCleared={refetch} />
        </>
      )}
    </GameShell>
  )
}
