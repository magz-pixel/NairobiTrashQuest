import { HeatHaze } from './HeatHaze'
import { MapPinsLayer } from './MapPinsLayer'
import { NightSkyline3D } from './NightSkyline3D'
import { RadarSweep } from './RadarSweep'
import { AmbientRadarGrid } from '../fx/AmbientRadarGrid'

// Re-export ticket for any legacy imports
export { RaceTicket3D as RaceTicketStub } from './RaceTicket3D'
export { ScoutModeCanvas as MiniMapIllustration } from './ScoutModeCanvas'

/** Full-bleed hero stack: 3D/SVG skyline + heat + radar + pins + particle grid. */
export function HeroArtScene({ parallaxY = 0 }: { parallaxY?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <NightSkyline3D parallaxY={parallaxY * 0.35} />
      <HeatHaze />
      <RadarSweep />
      <AmbientRadarGrid />
      <div
        className="absolute inset-0 z-[2]"
        style={
          parallaxY
            ? { transform: `translateY(${parallaxY * 0.55}px)` }
            : undefined
        }
      >
        <MapPinsLayer />
      </div>
      <div className="absolute inset-0 z-[3] bg-gradient-to-r from-[var(--fn-night)]/92 via-[var(--fn-night)]/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-[3] h-1/3 bg-gradient-to-t from-[var(--fn-night)] to-transparent" />
    </div>
  )
}

/** Small nav monogram: pin over skyline bar. */
export function FixNairobiMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      width={28}
      height={28}
      aria-hidden
    >
      <rect width="32" height="32" rx="7" fill="#0a192f" />
      <path d="M4 24 L10 18 L16 21 L22 15 L28 20 V28 H4 Z" fill="#1a4a58" />
      <path
        d="M16 6c-2.8 0-5 2.1-5 4.8 0 3.6 5 9.2 5 9.2s5-5.6 5-9.2C21 8.1 18.8 6 16 6z"
        fill="#ff6b00"
      />
      <circle cx="16" cy="10.2" r="1.6" fill="#0a192f" />
    </svg>
  )
}

export function ZoneDashLine({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-3 w-full ${className}`}
      viewBox="0 0 400 12"
      preserveAspectRatio="none"
      aria-hidden
    >
      <line
        x1="0"
        y1="6"
        x2="400"
        y2="6"
        stroke="#ff6b00"
        strokeWidth="2"
        strokeDasharray="10 8"
        strokeOpacity="0.55"
      />
      <circle cx="40" cy="6" r="3.5" fill="#ff6b00" />
      <circle cx="200" cy="6" r="3.5" fill="#00f2fe" />
      <circle cx="360" cy="6" r="3.5" fill="#ff6b00" />
    </svg>
  )
}
