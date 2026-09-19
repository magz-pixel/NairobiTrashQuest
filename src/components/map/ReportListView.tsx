import type { Report } from '../../types/database'
import { useCity } from '../../lib/CityContext'
import { daysSince, severityLabel } from '../../lib/wards'

interface ReportListViewProps {
  reports: Report[]
  selectedId?: string | null
  onSelect: (report: Report) => void
}

export function ReportListView({ reports, selectedId, onSelect }: ReportListViewProps) {
  const city = useCity()

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl bg-[#f4f7f2] px-4 py-8 text-center text-sm leading-6 text-[#5d746e]">
        No spots match these filters in {city.label}. Shift a neighbourhood or report one.
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {reports.map((r) => {
        const selected = r.id === selectedId
        const cleared = r.status === 'verified_cleared'
        return (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onSelect(r)}
              className={`flex min-h-[4.5rem] w-full gap-3 rounded-2xl border p-2 text-left transition md:p-2.5 ${
                selected
                  ? 'border-[#063b32] bg-[#063b32] text-white shadow-[0_12px_30px_rgba(6,59,50,.2)]'
                  : 'border-[#e5efeb] bg-white text-[#12332d] hover:border-[#0b8c76]/40'
              }`}
            >
              <img
                src={r.image_url}
                alt=""
                className="h-14 w-14 shrink-0 rounded-xl object-cover md:h-[4.25rem] md:w-[4.25rem]"
              />
              <div className="min-w-0 flex-1 py-0.5">
                <p className="truncate text-sm font-extrabold">
                  {r.area_name ?? `${city.label} hotspot`}
                </p>
                <p className={`mt-1 text-xs ${selected ? 'text-teal-100/80' : 'text-[#5d746e]'}`}>
                  {cleared ? 'Cleared' : severityLabel(r.severity_score)} · {daysSince(r.created_at)}d
                  open · {r.waste_type ?? 'Mixed waste'}
                </p>
                <p className={`mt-1 text-[10px] font-bold uppercase tracking-[.12em] ${selected ? 'text-gold-300' : 'text-[#0b8c76]'}`}>
                  {r.seen_count} neighbours have seen this
                </p>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
