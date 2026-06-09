import type { SeverityFilter, StatusFilter } from '../../types/database'

interface MapFiltersProps {
  severity: SeverityFilter
  status: StatusFilter
  onSeverityChange: (v: SeverityFilter) => void
  onStatusChange: (v: StatusFilter) => void
}

const SEVERITY: { value: SeverityFilter; label: string }[] = [
  { value: 'all', label: 'All severity' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const STATUS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified_cleared', label: 'Cleared' },
  { value: 'flagged', label: 'Flagged' },
]

export function MapFilters({
  severity,
  status,
  onSeverityChange,
  onStatusChange,
}: MapFiltersProps) {
  return (
    <div className="pointer-events-auto flex flex-wrap gap-2">
      <select
        value={severity}
        onChange={(e) => onSeverityChange(e.target.value as SeverityFilter)}
        className="rounded-lg border border-white/15 bg-black/70 px-2 py-1.5 text-xs text-white backdrop-blur-md"
      >
        {SEVERITY.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        className="rounded-lg border border-white/15 bg-black/70 px-2 py-1.5 text-xs text-white backdrop-blur-md"
      >
        {STATUS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
