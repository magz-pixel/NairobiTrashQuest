import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useReports } from '../hooks/useReports'
import { useRaceHotspots } from '../hooks/useRaceHotspots'
import { useUpcomingEvents } from '../hooks/useUpcomingEvents'
import { EventDetailSheet } from '../components/events/EventDetailSheet'
import { MapSummaryPill } from '../components/map/MapSummaryPill'
import { WardCard } from '../components/map/WardCard'
import { MapIntro } from '../components/map/MapIntro'
import { useCityWards } from '../hooks/useCityWards'
import { useMapFeatures } from '../hooks/useMapFeatures'
import { featuresToGeoJSON, type FeatureKind } from '../lib/mapFeatures'
import { PinFeatureModal } from '../components/features/PinFeatureModal'
import { FeatureCard } from '../components/features/FeatureCard'
import { formatEventWhen, hasPin, relativeDays } from '../lib/events'
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
import type { Event, Report, SeverityFilter, StatusFilter } from '../types/database'
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
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const city = useCity()
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const { reports, mapReports, allReports, loading, refetch } = useReports(
    severityFilter,
    statusFilter,
    city.slug,
  )
  const { activeHotspots: raceMapHotspots } = useRaceHotspots()
  const { events: upcoming, going, mine, toggleGoing } = useUpcomingEvents(city.slug)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const selectedEvent = upcoming.find((e) => e.id === selectedEventId) ?? null
  const stats = useReportStats(allReports)
  const [activePanel, setActivePanel] = useState<GameTab | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  // Home-screen shortcut / shared links: /nairobi/map?action=report opens the quick report straight away.
  const [searchParams, setSearchParams] = useSearchParams()
  const [quickReportOpen, setQuickReportOpen] = useState(() => searchParams.get('action') === 'report')
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

  const realReports = useMemo(() => allReports.filter((r) => !isDemoReport(r)), [allReports])
  const { wards, summaries: wardSummaries } = useCityWards(city.slug, realReports)
  const { features: mapFeatures, ready: featuresReady, reload: reloadFeatures } = useMapFeatures(city.slug)
  const featuresGeo = useMemo(() => featuresToGeoJSON(mapFeatures), [mapFeatures])
  const [layers, setLayers] = useState({ trash: true, bins: true, trees: true })
  const [pinKind, setPinKind] = useState<FeatureKind | null>(null)
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null)
  const selectedFeature = mapFeatures.find((f) => f.id === selectedFeatureId) ?? null
  const binCount = mapFeatures.filter((f) => f.kind === 'bin').length
  const treeCount = mapFeatures.filter((f) => f.kind === 'tree').length
  const [selectedWardId, setSelectedWardId] = useState<number | null>(null)
  const [focusBounds, setFocusBounds] = useState<[number, number, number, number] | null>(null)
  const selectedWard = selectedWardId !== null ? (wardSummaries[selectedWardId] ?? null) : null
  const worstWards = useMemo(
    () =>
      wardSummaries
        .filter((w) => w.open > 0)
        .sort((a, b) => b.open - a.open)
        .slice(0, 6)
        .map((w) => ({
          key: String(w.id),
          name: w.name,
          count: w.open,
          onPick: () => {
            setSelectedWardId(w.id)
            setFocusBounds(w.bbox)
          },
        })),
    [wardSummaries],
  )
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

  // Shared cleanup links: /nairobi/map?event=<id> opens that cleanup's details.
  // Shared ward links: /nairobi/map?ward=Mwiki opens that ward's card.
  const wardParam = searchParams.get('ward')
  const [openedWardParam, setOpenedWardParam] = useState<string | null>(null)
  if (wardParam && wardParam !== openedWardParam && wardSummaries.length > 0) {
    const w = wardSummaries.find((x) => x.name.toLowerCase() === wardParam.toLowerCase())
    setOpenedWardParam(wardParam)
    if (w) {
      setSelectedWardId(w.id)
      setFocusBounds(w.bbox)
    }
  }

  const selectWard = (id: number) => {
    flushSync(() => {
      setActivePanel(null)
      setSelectedReport(null)
      setDetailsOpen(false)
      setSelectedEventId(null)
    })
    setSelectedWardId(id)
  }

  const eventParam = searchParams.get('event')
  const [openedEventParam, setOpenedEventParam] = useState<string | null>(null)
  if (eventParam && eventParam !== openedEventParam && upcoming.some((e) => e.id === eventParam)) {
    setOpenedEventParam(eventParam)
    setSelectedEventId(eventParam)
  }

  const openEvent = (event: Event) => {
    flushSync(() => {
      setSelectedWardId(null)
      setActivePanel(null)
      setSelectedReport(null)
      setDetailsOpen(false)
    })
    setSelectedEventId(event.id)
    if (hasPin(event)) setFocusAt({ lat: event.latitude, lng: event.longitude, zoom: 16 })
  }

  const closeEvent = () => {
    setSelectedEventId(null)
    if (searchParams.has('event')) {
      const next = new URLSearchParams(searchParams)
      next.delete('event')
      setSearchParams(next, { replace: true })
    }
  }

  const nextEvent = upcoming[0] ?? null
  const eventPageUrl = (id: string) => `${window.location.origin}/${city.slug}/map?event=${id}`

  // Drop ?action=report from the URL once it has opened the quick report (see useState above).
  useEffect(() => {
    if (searchParams.get('action') !== 'report') return
    const next = new URLSearchParams(searchParams)
    next.delete('action')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

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
    flushSync(() => {
      setActivePanel(null)
      setSelectedWardId(null)
    })
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
    events: upcoming,
    going,
    onSelectEvent: openEvent,
    onPostEvent: profile?.is_admin ? () => navigate(`/${city.slug}/cleanups/manage`) : undefined,
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
            events={upcoming}
            selectedEventId={selectedEventId}
            onSelectEvent={openEvent}
            wards={wards}
            selectedWard={selectedWard?.name ?? null}
            onSelectWard={selectWard}
            focusBounds={focusBounds}
            features={featuresGeo}
            layers={layers}
            onSelectFeature={(id) => {
              setSelectedWardId(null)
              setSelectedReport(null)
              setSelectedFeatureId(id)
            }}
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
          onPin={(kind) => setPinKind(kind)}
        />
        <p className="pointer-events-none absolute bottom-4 left-4 z-[1040] hidden text-[10px] font-extrabold uppercase tracking-[.16em] text-[#063b32]/55 md:block">
          {city.label} · {city.country}
        </p>
        {/* Summary pill with the layer toggles directly under it (one column, so they never overlap). */}
        <div className="pointer-events-none absolute inset-x-3 top-[calc(env(safe-area-inset-top)+5.1rem)] z-[1061] flex flex-col items-center gap-2 md:inset-x-6 md:top-[5.4rem]">
          <MapSummaryPill
            reports={realReports}
            cleanups={upcoming.length}
            ranking={worstWards}
            rankingLabel="Worst wards right now"
            onFlyTo={(lat, lng) => setFocusAt({ lat, lng, zoom: 15 })}
          />
          {/* Layer toggles: Trash · Bins · Trees */}
          <div className="pointer-events-auto flex justify-center gap-1.5">
          {(
            [
              ['trash', '📍', 'Trash', null],
              ['bins', '🗑️', 'Bins', binCount],
              ['trees', '🌳', 'Trees', treeCount],
            ] as const
          ).map(([key, icon, label, n]) => (
            <button
              key={key}
              type="button"
              aria-pressed={layers[key]}
              onClick={() => setLayers((l) => ({ ...l, [key]: !l[key] }))}
              className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-xs font-bold shadow-[0_8px_20px_rgba(6,59,50,.12)] backdrop-blur ${
                layers[key] ? 'border-[#063b32] bg-[#063b32] text-white' : 'border-white/80 bg-white/90 text-[#5d746e]'
              }`}
            >
              {icon} {label}
              {typeof n === 'number' && featuresReady ? <span className="opacity-70">· {n}</span> : null}
            </button>
          ))}
          </div>
        </div>
        {nextEvent && sheet === 'peek' && !selectedReport ? (
          <button
            type="button"
            onClick={() => openEvent(nextEvent)}
            className="pointer-events-auto absolute left-3 top-[calc(env(safe-area-inset-top)+11.2rem)] z-[1060] inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-[#cfe9df] bg-white/95 py-1.5 pl-1.5 pr-3.5 text-left shadow-[0_10px_30px_rgba(6,59,50,.18)] backdrop-blur md:left-[24.5rem] md:top-4"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0b8c76] text-sm">🧹</span>
            <span className="min-w-0">
              <span className="block text-[10px] font-extrabold uppercase tracking-[.12em] text-[#ef8268]">
                Next cleanup · {relativeDays(nextEvent.event_date)}
              </span>
              <span className="block truncate text-xs font-bold text-[#063b32]">
                {nextEvent.title} · {formatEventWhen(nextEvent.event_date)}
              </span>
            </span>
          </button>
        ) : null}
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

      <WardCard
        ward={selectedWard}
        city={city}
        shareUrl={selectedWard ? `${window.location.origin}/${city.slug}/map?ward=${encodeURIComponent(selectedWard.name)}` : ''}
        onClose={() => setSelectedWardId(null)}
        onZoom={(w) => setFocusBounds([...w.bbox])}
        onSelectReport={(r) => selectReport(r)}
      />
      <PinFeatureModal
        kind={pinKind}
        onClose={() => setPinKind(null)}
        onSaved={(at) => {
          void reloadFeatures()
          setLayers((l) => ({ ...l, bins: true, trees: true }))
          setPulseAt({ latitude: at.lat, longitude: at.lng })
        }}
      />
      <FeatureCard feature={selectedFeature} onClose={() => setSelectedFeatureId(null)} onUpdated={() => void reloadFeatures()} />
      <MapIntro city={city} wards={wardSummaries.length} open={stats.active} onReport={openQuickReport} />
      <EventDetailSheet
        event={selectedEvent}
        goingCount={selectedEvent ? going.get(selectedEvent.id) : undefined}
        isGoing={selectedEvent ? mine.has(selectedEvent.id) : false}
        signedIn={!!user}
        pageUrl={selectedEvent ? eventPageUrl(selectedEvent.id) : ''}
        onToggleGoing={toggleGoing}
        onClose={closeEvent}
      />
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
