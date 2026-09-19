import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { useReports } from '../hooks/useReports'
import { useRaceHotspots } from '../hooks/useRaceHotspots'
import { useReportStats } from '../hooks/useReportStats'
import { useCity } from '../lib/CityContext'
import { FieldDock, FieldRail, type SheetHeight } from '../components/map/FieldDock'
import { MapTopBar } from '../components/map/MapTopBar'
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
import { isDemoReport } from '../lib/demoReports'
import type { WardBox } from '../lib/cities'
import { useAuth } from '../hooks/useAuth'
import type { Report, SeverityFilter, StatusFilter } from '../types/database'
import type { GameTab } from '../components/layout/GameShell'
import type { MapFocusTarget } from '../components/map/MapView'

const MapView = lazy(() =>
  import('../components/map/MapView').then((m) => ({ default: m.MapView })),
)

function reportsInWard(list: Report[], ward: WardBox | null) {
  if (!ward) return list
  return list.filter(
    (r) =>
      r.latitude >= ward.minLat &&
      r.latitude <= ward.maxLat &&
      r.longitude >= ward.minLng &&
      r.longitude <= ward.maxLng,
  )
}

export function HomePage() {
  const { user } = useAuth()
  const city = useCity()
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const { reports, mapReports, allReports, loading, refetch } = useReports(
    severityFilter,
    statusFilter,
    city.slug,
  )
  const { activeHotspots: raceMapHotspots } = useRaceHotspots()
  const stats = useReportStats(allReports)
  const [activePanel, setActivePanel] = useState<GameTab | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [quickReportOpen, setQuickReportOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminDrawerOpen, setAdminDrawerOpen] = useState(false)
  const [pulseAt, setPulseAt] = useState<{ latitude: number; longitude: number } | null>(null)
  const [focusAt, setFocusAt] = useState<MapFocusTarget | null>(null)
  const [activeWard, setActiveWard] = useState<WardBox | null>(null)
  const [sheet, setSheet] = useState<SheetHeight>('peek')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [isPhone, setIsPhone] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setIsPhone(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    setActiveWard(null)
    setSelectedReport(null)
    setDetailsOpen(false)
    setFocusAt(null)
    setSheet('peek')
  }, [city.slug])

  const realReports = allReports.filter((r) => !isDemoReport(r))
  const activeHotspots = realReports.filter(
    (r) => r.status === 'active' || r.status === 'flagged',
  )
  const visibleReports = useMemo(
    () => reportsInWard(reports, activeWard),
    [reports, activeWard],
  )
  const visibleMapReports = useMemo(
    () => reportsInWard(mapReports, activeWard),
    [mapReports, activeWard],
  )

  const viewExistingReport = (report: Report) => {
    setQuickReportOpen(false)
    setReportOpen(false)
    selectReport(report)
  }

  const openQuickReport = () => {
    flushSync(() => {
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
      setActivePanel(null)
      setSelectedReport(null)
      setClearOpen(false)
    })
    setReportOpen(true)
  }

  const openClear = () => {
    flushSync(() => {
      setActivePanel(null)
      setSelectedReport(null)
      setReportOpen(false)
      setQuickReportOpen(false)
    })
    setClearOpen(true)
  }

  const selectReport = (report: Report) => {
    flushSync(() => setActivePanel(null))
    setSelectedReport(report)
    if (isPhone) {
      setDetailsOpen(false)
      setSheet((h) => (h === 'full' ? 'full' : 'half'))
    } else {
      setDetailsOpen(true)
    }
    setFocusAt({ lat: report.latitude, lng: report.longitude, zoom: 16 })
  }

  const sheetPad = isPhone ? (sheet === 'peek' ? 120 : sheet === 'half' ? 340 : 560) : 0

  const handleReported = (coords?: { id: string; latitude: number; longitude: number }) => {
    refetch()
    if (coords) {
      setPulseAt({ latitude: coords.latitude, longitude: coords.longitude })
      setFocusAt({ lat: coords.latitude, lng: coords.longitude, zoom: 16 })
    }
  }

  const flyToWard = (ward: WardBox | null) => {
    setActiveWard(ward)
    if (!ward) {
      setFocusAt({ lat: city.center.lat, lng: city.center.lng, zoom: city.mapZoom })
      return
    }
    setFocusAt({
      lat: (ward.minLat + ward.maxLat) / 2,
      lng: (ward.minLng + ward.maxLng) / 2,
      zoom: 15,
    })
  }

  const board = {
    cityLabel: city.label,
    chapterName: city.chapterName,
    stats,
    loading,
    reports: visibleReports,
    selectedId: selectedReport?.id,
    severity: severityFilter,
    status: statusFilter,
    wards: city.wardBoxes,
    activeWardId: activeWard?.id ?? null,
    onSeverityChange: setSeverityFilter,
    onStatusChange: setStatusFilter,
    onSelectWard: flyToWard,
    onSelect: selectReport,
    onReport: openScan,
  }

  return (
    <div className="map-experience flex h-[100dvh] w-full overflow-hidden bg-[#dce8e1]" data-sheet={sheet}>
      <FieldRail {...board} />
      <div className="relative min-h-0 min-w-0 flex-1">
        <Suspense
          fallback={
            <div className="grid h-full place-items-center text-sm font-bold text-[#0b8c76]">
              Opening the {city.label} field…
            </div>
          }
        >
          <MapView
            reports={visibleMapReports}
            hotspots={raceMapHotspots}
            selectedId={selectedReport?.id}
            focusAt={focusAt}
            paddingBottom={sheetPad}
            pulseAt={pulseAt}
            onPulseDone={() => setPulseAt(null)}
            onSelectReport={selectReport}
            onLocated={(lat, lng) => setFocusAt({ lat, lng, zoom: 16 })}
            onMapClick={() => {
              setActivePanel(null)
              if (!isPhone) return
              setSelectedReport(null)
              setDetailsOpen(false)
              setSheet('peek')
            }}
            onDragStart={() => setActivePanel(null)}
          />
        </Suspense>
        <MapTopBar
          onVerify={openClear}
          onOpenPanel={(id) => setActivePanel(id)}
          onAdmin={() => setAdminDrawerOpen(true)}
        />
        <p className="pointer-events-none absolute bottom-4 left-4 z-[1040] hidden text-[10px] font-extrabold uppercase tracking-[.16em] text-[#063b32]/55 md:block">
          {city.label} · {city.country}
        </p>
        {sheet !== 'full' ? (
          <button
            type="button"
            onClick={openScan}
            className="map-report-fab pointer-events-auto absolute right-3 z-[1075] inline-flex h-14 items-center gap-2 rounded-full bg-gold-400 pl-2 pr-5 text-sm font-extrabold text-emerald-950 shadow-[0_16px_40px_rgba(217,154,22,.42)] md:hidden"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#063b32] text-xl leading-none text-white">
              +
            </span>
            Report
          </button>
        ) : null}
        <FieldDock
          height={sheet}
          onHeightChange={setSheet}
          selectedReport={selectedReport}
          onClearSelection={() => {
            setSelectedReport(null)
            setDetailsOpen(false)
          }}
          onOpenDetails={() => setDetailsOpen(true)}
          onVerifySpot={() => {
            setSelectedReport(null)
            setDetailsOpen(false)
            openClear()
          }}
          userLoggedIn={!!user}
          {...board}
        />
      </div>

      <ReportDetailSheet
        report={detailsOpen ? selectedReport : null}
        onClose={() => {
          setDetailsOpen(false)
          if (!isPhone) setSelectedReport(null)
        }}
        onVerify={() => {
          setSelectedReport(null)
          setDetailsOpen(false)
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

      <EventsPanel open={activePanel === 'events'} onClose={() => setActivePanel(null)} />
      <MissionsPanel open={activePanel === 'missions'} onClose={() => setActivePanel(null)} />
      <BlogPanel open={activePanel === 'blog'} onClose={() => setActivePanel(null)} />
      <CleanupLogPanel open={activePanel === 'log'} onClose={() => setActivePanel(null)} onLogged={refetch} />
      <ProfilePanel open={activePanel === 'profile'} onClose={() => setActivePanel(null)} />
      <RewardsPanel open={activePanel === 'rewards'} onClose={() => setActivePanel(null)} />

      {user && (
        <>
          <ReportTrashModal
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            onReported={refetch}
            activeReports={activeHotspots}
            onViewExistingReport={viewExistingReport}
          />
          <ClearTrashModal
            open={clearOpen}
            onClose={() => setClearOpen(false)}
            activeReports={activeHotspots}
            onCleared={refetch}
          />
        </>
      )}
    </div>
  )
}
