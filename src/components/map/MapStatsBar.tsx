import type { ReportStats } from '../../types/database'

interface MapStatsBarProps {
  stats: ReportStats
  loading?: boolean
}

export function MapStatsBar({ stats, loading }: MapStatsBarProps) {
  return (
    <div className="pointer-events-auto flex gap-2">
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 shadow-[var(--shadow-sm)]">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          Active
        </p>
        <p className="text-lg font-bold text-[var(--urgent-orange-deep)]">
          {loading ? '—' : stats.active}
        </p>
      </div>
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 shadow-[var(--shadow-sm)]">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          Reports
        </p>
        <p className="text-lg font-bold text-[var(--urgent-orange)]">
          {loading ? '—' : stats.total}
        </p>
      </div>
    </div>
  )
}
