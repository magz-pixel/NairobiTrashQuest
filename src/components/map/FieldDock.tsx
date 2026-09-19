import { useRef } from 'react'
import type { Report, ReportStats, SeverityFilter, StatusFilter } from '../../types/database'
import type { WardBox } from '../../lib/cities'
import { useCity } from '../../lib/CityContext'
import { daysSince, severityLabel } from '../../lib/wards'
import { ReportListView } from './ReportListView'

export type SheetHeight = 'peek' | 'half' | 'full'

interface FieldBoardProps {
  cityLabel: string
  chapterName: string
  stats: ReportStats
  loading: boolean
  reports: Report[]
  selectedId?: string | null
  severity: SeverityFilter
  status: StatusFilter
  wards: WardBox[]
  activeWardId?: string | null
  onSeverityChange: (v: SeverityFilter) => void
  onStatusChange: (v: StatusFilter) => void
  onSelectWard: (ward: WardBox | null) => void
  onSelect: (report: Report) => void
  onReport: () => void
}

const STATUS_PILLS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Open' },
  { value: 'verified_cleared', label: 'Cleared' },
  { value: 'flagged', label: 'Flagged' },
]

const SEVERITY_PILLS: { value: SeverityFilter; label: string }[] = [
  { value: 'all', label: 'Any heat' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

function FieldBoard({
  cityLabel,
  chapterName,
  stats,
  loading,
  reports,
  selectedId,
  severity,
  status,
  wards,
  activeWardId,
  onSeverityChange,
  onStatusChange,
  onSelectWard,
  onSelect,
  onReport: _onReport,
  density = 'rail',
  hideHeading = false,
}: FieldBoardProps & { density?: 'half' | 'full' | 'rail'; hideHeading?: boolean }) {
  void _onReport
  const compact = density === 'half'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!hideHeading ? (
        <div className={`shrink-0 ${compact ? 'px-4 pb-2 pt-0' : 'px-4 pb-3 pt-1'}`}>
          {density !== 'half' ? (
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#0b8c76]">
              {chapterName}
            </p>
          ) : null}
          <div className={`flex items-end justify-between gap-3 ${density === 'half' ? '' : 'mt-1'}`}>
            <h2
              className={`font-extrabold tracking-[-.04em] text-[#063b32] ${
                compact ? 'text-lg' : 'text-2xl'
              }`}
            >
              {loading ? 'Reading the street…' : `${stats.active} open in ${cityLabel}`}
            </h2>
            <p className="shrink-0 text-xs font-bold text-[#6a827b]">{stats.total} reports</p>
          </div>
          <div className={`flex gap-2 overflow-x-auto pb-1 ${compact ? 'mt-2' : 'mt-3'}`}>
            <button
              type="button"
              onClick={() => onSelectWard(null)}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-xs font-extrabold ${
                !activeWardId ? 'bg-[#063b32] text-white' : 'bg-[#e7f4ef] text-[#063b32]'
              }`}
            >
              Whole city
            </button>
            {wards.map((ward) => (
              <button
                key={ward.id}
                type="button"
                onClick={() => onSelectWard(ward)}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-xs font-extrabold ${
                  activeWardId === ward.id ? 'bg-[#063b32] text-white' : 'bg-[#e7f4ef] text-[#063b32]'
                }`}
              >
                {ward.name}
              </button>
            ))}
          </div>
          {density !== 'half' ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {STATUS_PILLS.map((pill) => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => onStatusChange(pill.value)}
                  className={`inline-flex min-h-9 items-center rounded-full px-3 text-[11px] font-bold ${
                    status === pill.value
                      ? 'bg-gold-400 text-emerald-950'
                      : 'border border-[#d9e9e4] bg-white text-[#5d746e]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
              {SEVERITY_PILLS.map((pill) => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => onSeverityChange(pill.value)}
                  className={`inline-flex min-h-9 items-center rounded-full px-3 text-[11px] font-bold ${
                    severity === pill.value
                      ? 'bg-[#063b32] text-white'
                      : 'border border-[#d9e9e4] bg-white text-[#5d746e]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="shrink-0 px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => onSelectWard(null)}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-xs font-extrabold ${
                !activeWardId ? 'bg-[#063b32] text-white' : 'bg-[#e7f4ef] text-[#063b32]'
              }`}
            >
              Whole city
            </button>
            {wards.map((ward) => (
              <button
                key={ward.id}
                type="button"
                onClick={() => onSelectWard(ward)}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-xs font-extrabold ${
                  activeWardId === ward.id ? 'bg-[#063b32] text-white' : 'bg-[#e7f4ef] text-[#063b32]'
                }`}
              >
                {ward.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pb-6">
        <ReportListView reports={reports} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </div>
  )
}

function ReportCta({ onReport }: { onReport: () => void }) {
  return (
    <button
      type="button"
      onClick={onReport}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gold-400 text-sm font-extrabold text-emerald-950"
    >
      Report a dirty spot
    </button>
  )
}

function MobileSpotCard({
  report,
  onClose,
  onDetails,
  onVerify,
  userLoggedIn,
}: {
  report: Report
  onClose: () => void
  onDetails: () => void
  onVerify?: () => void
  userLoggedIn?: boolean
}) {
  const city = useCity()
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`
  const title = report.area_name ?? `${city.label} hotspot`
  const cleared = report.status === 'verified_cleared'

  return (
    <article className="mx-3 mb-3 overflow-hidden rounded-2xl border border-[#e5efeb] bg-[#f7fbf9] shadow-[0_10px_28px_rgba(6,59,50,.08)]">
      <div className="relative">
        <img src={report.image_url} alt="" className="h-28 w-full object-cover" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-white/95 text-base font-extrabold text-[#063b32] shadow"
          aria-label="Close spot"
        >
          ✕
        </button>
        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#063b32]">
          {cleared ? 'Cleared' : severityLabel(report.severity_score)}
        </span>
      </div>
      <div className="p-3">
        <h3 className="truncate text-lg font-extrabold tracking-tight text-[#063b32]">{title}</h3>
        <p className="mt-0.5 text-xs font-bold text-[#6a827b]">
          {daysSince(report.created_at)}d open · {report.waste_type ?? 'Mixed waste'} · {report.seen_count}{' '}
          seen
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#063b32] px-3 text-sm font-extrabold text-white"
          >
            Directions
          </a>
          <button
            type="button"
            onClick={onDetails}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d9e9e4] bg-white px-3 text-sm font-extrabold text-[#063b32]"
          >
            Full report
          </button>
        </div>
        {userLoggedIn && onVerify && !cleared ? (
          <button
            type="button"
            onClick={onVerify}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gold-400 text-sm font-extrabold text-emerald-950"
          >
            Verify cleanup
          </button>
        ) : null}
      </div>
    </article>
  )
}

interface FieldDockProps extends FieldBoardProps {
  height: SheetHeight
  onHeightChange: (h: SheetHeight) => void
  selectedReport?: Report | null
  onClearSelection?: () => void
  onOpenDetails?: (report: Report) => void
  onVerifySpot?: () => void
  userLoggedIn?: boolean
}

const NEXT_UP: Record<SheetHeight, SheetHeight> = {
  peek: 'half',
  half: 'full',
  full: 'full',
}

const NEXT_DOWN: Record<SheetHeight, SheetHeight> = {
  peek: 'peek',
  half: 'peek',
  full: 'half',
}

export function FieldDock({
  height,
  onHeightChange,
  selectedReport,
  onClearSelection,
  onOpenDetails,
  onVerifySpot,
  userLoggedIn,
  ...board
}: FieldDockProps) {
  const startY = useRef(0)
  const moved = useRef(false)

  const skipClick = useRef(false)

  const cycle = () => {
    onHeightChange(height === 'peek' ? 'half' : height === 'half' ? 'full' : 'peek')
  }

  const snap = (dy: number) => {
    if (dy > 40) onHeightChange(NEXT_UP[height])
    else if (dy < -40) onHeightChange(NEXT_DOWN[height])
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    moved.current = false
    startY.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (Math.abs(startY.current - e.clientY) > 8) moved.current = true
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!moved.current) return
    skipClick.current = true
    snap(startY.current - e.clientY)
  }

  const showingSpot = Boolean(selectedReport) && height !== 'peek'
  const listDensity = height === 'full' ? 'full' : 'half'

  return (
    <section
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-[1080] flex flex-col overflow-hidden rounded-t-[1.6rem] border border-white/80 bg-white/97 shadow-[0_-18px_50px_rgba(6,59,50,.16)] backdrop-blur-md transition-[height] duration-300 ease-out md:hidden"
      style={{ height: 'var(--map-sheet)' }}
      aria-label="Field reports"
    >
      <div
        role="button"
        tabIndex={0}
        className="flex shrink-0 touch-none flex-col items-stretch px-4 pb-1 pt-2"
        aria-label={
          height === 'peek' ? 'Open nearby spots' : height === 'half' ? 'Expand list' : 'Show more map'
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => {
          if (skipClick.current) {
            skipClick.current = false
            return
          }
          cycle()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            cycle()
          }
        }}
      >
        <span className="flex min-h-10 flex-col items-center justify-center">
          <span className="h-1.5 w-12 rounded-full bg-[#cfe1da]" />
        </span>
        {height === 'peek' || (height === 'half' && !showingSpot) ? (
          <div className="flex items-center justify-between gap-3 pb-1 pt-0.5">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold tracking-tight text-[#063b32]">
                {board.loading ? 'Reading the street…' : `${board.stats.active} open in ${board.cityLabel}`}
              </p>
              <p className="text-[11px] font-bold text-[#6a827b]">
                {height === 'peek' ? 'Swipe up for nearby spots' : 'Swipe up for filters · tap a card'}
              </p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7f4ef] text-[#063b32]" aria-hidden>
              ⌃
            </span>
          </div>
        ) : null}
      </div>

      {showingSpot && selectedReport ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <MobileSpotCard
            report={selectedReport}
            onClose={() => {
              onClearSelection?.()
              onHeightChange('peek')
            }}
            onDetails={() => onOpenDetails?.(selectedReport)}
            onVerify={onVerifySpot}
            userLoggedIn={userLoggedIn}
          />
          {height === 'full' ? (
            <div className="px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#6a827b]">
                Nearby spots
              </p>
              <ReportListView
                reports={board.reports}
                selectedId={board.selectedId}
                onSelect={board.onSelect}
              />
            </div>
          ) : null}
        </div>
      ) : height !== 'peek' ? (
        <FieldBoard {...board} density={listDensity} hideHeading={height === 'half'} />
      ) : null}
    </section>
  )
}

export function FieldRail(props: FieldBoardProps) {
  return (
    <aside className="hidden h-full min-h-0 w-[23rem] shrink-0 flex-col border-r border-[#d9e9e4] bg-white md:flex">
      <FieldBoard {...props} density="rail" />
      <div className="border-t border-[#e5efeb] p-4">
        <ReportCta onReport={props.onReport} />
      </div>
    </aside>
  )
}
