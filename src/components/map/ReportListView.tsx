import type { Report } from '../../types/database'
import { daysSince, severityLabel } from '../../lib/wards'

interface ReportListViewProps {
  reports: Report[]
  onSelect: (report: Report) => void
}

export function ReportListView({ reports, onSelect }: ReportListViewProps) {
  if (reports.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-[var(--text-muted)]">
        No reports match these filters.
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-app)] p-4 pb-32">
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onSelect(r)}
              className="flex w-full gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-left shadow-[var(--shadow-sm)] hover:border-[var(--brand-teal)]/40"
            >
              <img
                src={r.image_url}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[var(--text-primary)]">
                  {r.area_name ?? 'Nairobi hotspot'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {severityLabel(r.severity_score)} · {r.status.replace('_', ' ')} ·{' '}
                  {daysSince(r.created_at)}d
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
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
