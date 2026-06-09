import type { Report } from '../../types/database'
import { daysSince, severityLabel } from '../../lib/wards'

interface ReportListViewProps {
  reports: Report[]
  onSelect: (report: Report) => void
}

export function ReportListView({ reports, onSelect }: ReportListViewProps) {
  if (reports.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-white/50">
        No reports match these filters.
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-deep)] p-3 pb-24">
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onSelect(r)}
              className="flex w-full gap-3 rounded-xl border border-white/10 bg-black/50 p-3 text-left hover:border-[var(--neon-clean)]/30"
            >
              <img
                src={r.image_url}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">
                  {r.area_name ?? 'Nairobi hotspot'}
                </p>
                <p className="text-xs text-white/50">
                  {severityLabel(r.severity_score)} · {r.status.replace('_', ' ')} ·{' '}
                  {daysSince(r.created_at)}d
                </p>
                <p className="text-[10px] text-white/40">
                  {r.waste_type ?? 'Mixed waste'} · {r.seen_count} seen
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
