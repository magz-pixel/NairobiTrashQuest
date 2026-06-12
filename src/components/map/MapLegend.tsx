import { CLEARED_PIN_COLOR, clusterColor } from '../../lib/clusters'

const SEVERITY_STOPS = [
  { label: 'Low', severity: 2 },
  { label: 'Moderate', severity: 4 },
  { label: 'High', severity: 6 },
  { label: 'Severe', severity: 8 },
  { label: 'Critical', severity: 10 },
] as const

export function MapLegend() {
  return (
    <div
      className="map-legend pointer-events-auto absolute right-4 z-[1000] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-sm)] max-md:bottom-[calc(env(safe-area-inset-bottom)+var(--mobile-nav-height,64px)+var(--action-bar-height,56px)+16px)] md:bottom-4"
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Severity
      </p>
      <ul className="space-y-1.5">
        {SEVERITY_STOPS.map(({ label, severity }) => (
          <li key={label} className="flex items-center gap-2 text-[10px] text-[var(--text-primary)]">
            <span
              className="inline-block h-3 w-3 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: clusterColor(severity) }}
            />
            {label}
          </li>
        ))}
      </ul>
      <p className="mb-2 mt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Status
      </p>
      <ul className="space-y-1.5">
        <li className="flex items-center gap-2 text-[10px] text-[var(--text-primary)]">
          <span
            className="inline-block h-3 w-3 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: CLEARED_PIN_COLOR }}
          />
          Cleared / resolved
        </li>
      </ul>
      <p className="mt-2 text-[10px] text-[var(--text-muted)]">Zoom in for individual pins</p>
    </div>
  )
}
