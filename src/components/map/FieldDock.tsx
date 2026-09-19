import type { Report, ReportStats, SeverityFilter, StatusFilter } from '../../types/database'
import type { WardBox } from '../../lib/cities'
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

export function FieldBoard({
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
  onReport,
}: FieldBoardProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pb-3 pt-1">
        <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#0b8c76]">
          {chapterName}
        </p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-extrabold tracking-[-.04em] text-[#063b32]">
            {loading ? 'Reading the street…' : `${stats.active} open in ${cityLabel}`}
          </h2>
          <p className="shrink-0 text-xs font-bold text-[#6a827b]">{stats.total} reports</p>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => onSelectWard(null)}
            className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-xs font-extrabold ${
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
              className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-xs font-extrabold ${
                activeWardId === ward.id ? 'bg-[#063b32] text-white' : 'bg-[#e7f4ef] text-[#063b32]'
              }`}
            >
              {ward.name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STATUS_PILLS.map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => onStatusChange(pill.value)}
              className={`inline-flex min-h-8 items-center rounded-full px-3 text-[11px] font-bold ${
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
              className={`inline-flex min-h-8 items-center rounded-full px-3 text-[11px] font-bold ${
                severity === pill.value
                  ? 'bg-[#063b32] text-white'
                  : 'border border-[#d9e9e4] bg-white text-[#5d746e]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-24 md:pb-6">
        <ReportListView reports={reports} selectedId={selectedId} onSelect={onSelect} />
      </div>
      <div className="hidden border-t border-[#e5efeb] p-4 md:block">
        <button
          type="button"
          onClick={onReport}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gold-400 text-sm font-extrabold text-emerald-950"
        >
          Report a dirty spot
        </button>
      </div>
    </div>
  )
}

interface FieldDockProps extends FieldBoardProps {
  height: SheetHeight
  onHeightChange: (h: SheetHeight) => void
}

const HEIGHT_CLASS: Record<SheetHeight, string> = {
  peek: 'h-[9.5rem]',
  half: 'h-[48dvh]',
  full: 'h-[min(86dvh,calc(100dvh-4.75rem))]',
}

export function FieldDock({ height, onHeightChange, ...board }: FieldDockProps) {
  const cycle = () => {
    onHeightChange(height === 'peek' ? 'half' : height === 'half' ? 'full' : 'peek')
  }

  return (
    <section
      className={`pointer-events-auto absolute inset-x-0 bottom-0 z-[1080] flex flex-col overflow-hidden rounded-t-[1.75rem] border border-white/80 bg-white/96 shadow-[0_-18px_50px_rgba(6,59,50,.16)] backdrop-blur-md transition-[height] duration-300 ease-out md:hidden ${HEIGHT_CLASS[height]}`}
      aria-label="Field reports"
    >
      <div className="flex shrink-0 items-center gap-2 px-4 pb-1 pt-2">
        <button
          type="button"
          className="flex min-h-11 flex-1 flex-col items-center justify-center"
          aria-label="Resize field list"
          onClick={cycle}
        >
          <span className="h-1.5 w-12 rounded-full bg-[#cfe1da]" />
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#6a827b]">
            {height === 'peek' ? 'Open list' : height === 'half' ? 'Expand' : 'Peek map'}
          </span>
        </button>
        <button
          type="button"
          onClick={board.onReport}
          className="inline-flex min-h-11 items-center rounded-full bg-gold-400 px-4 text-xs font-extrabold text-emerald-950"
        >
          Report
        </button>
      </div>
      <FieldBoard {...board} />
    </section>
  )
}

export function FieldRail(props: FieldBoardProps) {
  return (
    <aside className="hidden h-full w-[23rem] shrink-0 flex-col border-r border-[#d9e9e4] bg-white md:flex">
      <FieldBoard {...props} />
    </aside>
  )
}
