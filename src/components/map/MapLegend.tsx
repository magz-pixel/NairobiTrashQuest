import { HEAT_GRADIENT, HEAT_LEGEND_STOPS } from '../../lib/heatmap'

const GRADIENT_CSS = Object.entries(HEAT_GRADIENT)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([stop, color]) => `${color} ${Number(stop) * 100}%`)
  .join(', ')

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
        Pollution intensity
      </p>
      <div
        className="mb-2 h-2.5 w-32 rounded-full md:w-36"
        style={{ background: `linear-gradient(to right, ${GRADIENT_CSS})` }}
      />
      <ul className="flex justify-between gap-2 text-[10px] text-white/70">
        {HEAT_LEGEND_STOPS.map(({ label }) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-white/35">Zoom in to see individual reports</p>
    </div>
  )
}
