import { clusterColor } from '../../lib/clusters'

const SEVERITY_STOPS = [
  { label: 'Low', min: 1, max: 2 },
  { label: 'Moderate', min: 3, max: 4 },
  { label: 'High', min: 5, max: 6 },
  { label: 'Severe', min: 7, max: 8 },
  { label: 'Critical', min: 9, max: 10 },
] as const

export function MapLegend() {
  return (
    <div
      className="map-legend pointer-events-auto absolute right-3 z-[1000] rounded-xl border border-white/10 bg-black/70 p-3 backdrop-blur-md md:bottom-4 md:right-4"
      style={{
        bottom:
          'calc(env(safe-area-inset-bottom) + var(--mobile-nav-height, 64px) + 8px)',
      }}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/50">
        Report severity
      </p>
      <ul className="space-y-1.5">
        {SEVERITY_STOPS.map(({ label, min }) => (
          <li key={label} className="flex items-center gap-2 text-[10px] text-white/70">
            <span
              className="inline-block h-3 w-3 rounded-full border border-white/40"
              style={{ backgroundColor: clusterColor(min) }}
            />
            {label}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-white/35">Zoom in for individual pins</p>
    </div>
  )
}
