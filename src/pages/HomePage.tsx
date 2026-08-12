import { lazy, Suspense, useState } from 'react'
import { flushSync } from 'react-dom'
import { useReports } from '../hooks/useReports'
import { useRaceHotspots } from '../hooks/useRaceHotspots'
import { useReportStats } from '../hooks/useReportStats'
import { ProfileBadge } from '../components/auth/ProfileBadge'
import { SignInButton } from '../components/auth/SignInButton'
import { GameShell, type GameTab } from '../components/layout/GameShell'
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
import { AdminDrawer } from '../components/panels/AdminDrawer'
import { ReportTrashModal } from '../components/reports/ReportTrashModal'
import { QuickReportModal } from '../components/reports/QuickReportModal'
import { ClearTrashModal } from '../components/reports/ClearTrashModal'
import { isDemoReport, showDemoData } from '../lib/demoReports'
import { getLocale, setLocale, t, whatsappReportUrl } from '../lib/i18n'
import { marketConfig } from '../lib/marketConfig'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Report, SeverityFilter, StatusFilter } from '../types/database'

const MapView = lazy(() =>
  import('../components/map/MapView').then((m) => ({ default: m.MapView })),
)

function MapJoinButton() {
  return (
    <div className="pointer-events-auto">
      <SignInButton label="Join / Sign in" className="min-h-[48px] shadow-[var(--shadow-sm)]" />
    </div>
  )
}

type ViewMode = 'map' | 'list'

export function HomePage() {
  const { user, profile } = useAuth()
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const { reports, mapReports, allReports, loading, refetch } = useReports(
    severityFilter,
    statusFilter,
  )
  const { activeHotspots: raceMapHotspots } = useRaceHotspots()
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
  const [adminDrawerOpen, setAdminDrawerOpen] = useState(false)
  const [pulseAt, setPulseAt] = useState<{ latitude: number; longitude: number } | null>(null)
  const [, setLocaleTick] = useState(0)

  const realReports = allReports.filter((r) => !isDemoReport(r))
  const activeHotspots = realReports.filter(
    (r) => r.status === 'active' || r.status === 'flagged',
  )

  const viewExistingReport = (report: Report) => {
    setQuickReportOpen(false)
    setReportOpen(false)
    selectReport(report)
  }

  const closePanelsAndModals = () => {
    setActivePanel(null)
    setQuickReportOpen(false)
    setReportOpen(false)
    setClearOpen(false)
    setSelectedReport(null)
    setAnalyticsOpen(false)
    setAdminOpen(false)
    setAdminDrawerOpen(false)
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

  const handleReported = (coords?: { id: string; latitude: number; longitude: number }) => {
    refetch()
    if (coords) {
      setPulseAt({ latitude: coords.latitude, longitude: coords.longitude })
    }
  }

  const hudTop = (
    <div
      className="pointer-events-none absolute inset-x-0 z-[1000] space-y-2 px-4"
      style={{ top: 'calc(env(safe-area-inset-top) + 8px)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2">
          <div className="pointer-events-auto flex items-center gap-2">
            <Link
              to="/"
              className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] shadow-[var(--shadow-sm)]"
            >
              Fix Nairobi
            </Link>
            <h1 className="text-sm font-semibold text-[var(--text-primary)] md:text-base">
              {marketConfig.appName}
            </h1>
            <button
              type="button"
              className="pointer-events-auto rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] shadow-[var(--shadow-sm)]"
              onClick={() => {
                setLocale(getLocale() === 'en' ? 'sw' : 'en')
                setLocaleTick((n) => n + 1)
              }}
            >
              {getLocale() === 'en' ? 'SW' : 'EN'}
            </button>
            {profile?.is_admin && (
              <button
                type="button"
                onClick={() => setAdminDrawerOpen(true)}
                className="pointer-events-auto rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] shadow-[var(--shadow-sm)]"
                aria-label="Admin tools"
              >
                ⚙
              </button>
            )}
          </div>
          <MapStatsBar stats={stats} loading={loading} />
          <MapFilters
            severity={severityFilter}
            status={statusFilter}
            onSeverityChange={setSeverityFilter}
            onStatusChange={setStatusFilter}
          />
        </div>
        <div className="flex w-[min(13.5rem,calc(100vw-9.5rem))] shrink-0 flex-col items-end gap-2">
          <ProfileBadge className="pointer-events-auto min-h-[48px]" />
          {!user && <MapJoinButton />}
          <DigestBanner />
        </div>
      </div>
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setViewMode('map')}
          className={`rounded-lg px-3 py-1 text-xs font-semibold shadow-[var(--shadow-sm)] ${
            viewMode === 'map'
              ? 'border border-[var(--brand-teal)]/30 bg-[var(--brand-teal)]/10 text-[var(--brand-teal)]'
              : 'border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
          }`}
        >
          {t('map')}
        </button>
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`rounded-lg px-3 py-1 text-xs font-semibold shadow-[var(--shadow-sm)] ${
            viewMode === 'list'
              ? 'border border-[var(--brand-teal)]/30 bg-[var(--brand-teal)]/10 text-[var(--brand-teal)]'
              : 'border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
          }`}
        >
          {t('list')}
        </button>
        <a
          href={whatsappReportUrl()}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-medium text-green-700 shadow-[var(--shadow-sm)]"
        >
          {t('whatsappReport')}
        </a>
        {showDemoData && !loading && realReports.length === 0 && (
          <span className="text-[10px] font-medium text-[var(--text-muted)]">· demo data</span>
        )}
      </div>
    </div>
  )

  return (
    <GameShell
      activeTab={activeTab}
      onTabChange={handleTab}
      onReport={openQuickReport}
      reportLabel={t('reportTrash')}
      userLoggedIn={!!user}
    >
      <div className="relative h-full w-full">
        {viewMode === 'map' ? (
          <>
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-[var(--brand-teal)]">
                  Loading map…
                </div>
              }
            >
              <MapView
                reports={mapReports}
                hotspots={raceMapHotspots}
                pulseAt={pulseAt}
                onPulseDone={() => setPulseAt(null)}
                onSelectReport={selectReport}
                onInteract={() => {
                  setActivePanel(null)
                  setActiveTab('map')
                }}
              />
            </Suspense>
            {hudTop}
            <MapLegend />
          </>
        ) : (
          <>
            {hudTop}
            <div className="h-full bg-[var(--bg-app)] pt-44">
              <ReportListView reports={reports} onSelect={selectReport} />
            </div>
          </>
        )}
      </div>

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
        onReported={handleReported}
        activeReports={activeHotspots}
        onViewExistingReport={viewExistingReport}
      />

      <AdminDrawer
        open={adminDrawerOpen}
        onClose={() => setAdminDrawerOpen(false)}
        reports={allReports}
        onOpenModeration={() => setAdminOpen(true)}
        onOpenAnalytics={() => setAnalyticsOpen(true)}
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
          <ReportTrashModal
            open={reportOpen}
            onClose={() => {
              setReportOpen(false)
              setActiveTab('map')
            }}
            onReported={refetch}
            activeReports={activeHotspots}
            onViewExistingReport={viewExistingReport}
          />
          <ClearTrashModal
            open={clearOpen}
            onClose={() => {
              setClearOpen(false)
              setActiveTab('map')
            }}
            activeReports={activeHotspots}
            onCleared={refetch}
          />
        </>
      )}
    </GameShell>
  )
}
