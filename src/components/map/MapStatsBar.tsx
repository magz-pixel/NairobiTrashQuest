import type { ReportStats } from '../../types/database'

interface MapStatsBarProps {
  stats: ReportStats
  loading?: boolean
}

export function MapStatsBar({ stats, loading }: MapStatsBarProps) {
  return (
    <div className="pointer-events-auto flex gap-2">
      <div className="rounded-lg border border-white/10 bg-black/70 px-3 py-1.5 backdrop-blur-md">
        <p className="text-[10px] uppercase tracking-wider text-white/45">Active</p>
        <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[#ff6b6b]">
          {loading ? '—' : stats.active}
        </p>
      </div>
      <div className="rounded-lg border border-white/10 bg-black/70 px-3 py-1.5 backdrop-blur-md">
        <p className="text-[10px] uppercase tracking-wider text-white/45">Reports</p>
        <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[#ffb347]">
          {loading ? '—' : stats.total}
        </p>
      </div>
    </div>
  )
}
