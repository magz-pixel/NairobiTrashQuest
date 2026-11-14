import { useEffect, useState, type ReactNode } from 'react'
import { skyImage, skyPhase, type SkyPhase } from '../../lib/sky'

/**
 * City skyline backdrop: golden-hour photo per city, tinted to the city's local time,
 * with a few drifting birds (stars at night). Text inside should use the `sky-ink` /
 * `sky-ink-soft` classes so it stays readable when the sky turns dark.
 *
 * - variant "hero": full skyline, content sits in the open sky.
 * - variant "band": short strip behind an inner page title, fades into the page.
 * - Pass several cities to cross-fade between them (the hub does this).
 */
export function CitySky({
  cities,
  variant = 'hero',
  className = '',
  intervalMs = 7000,
  children,
}: {
  cities: string[]
  variant?: 'hero' | 'band'
  className?: string
  intervalMs?: number
  children?: ReactNode | ((current: string, phase: SkyPhase) => ReactNode)
}) {
  const [index, setIndex] = useState(0)
  // Only start loading the other cities' photos once the first one is on screen.
  const [warm, setWarm] = useState(cities.length <= 1)
  const current = cities[index % cities.length] ?? 'nairobi'
  const [phase, setPhase] = useState<SkyPhase>(() => skyPhase(current))

  useEffect(() => {
    if (cities.length <= 1) return
    const t = window.setInterval(() => setIndex((i) => (i + 1) % cities.length), intervalMs)
    return () => window.clearInterval(t)
  }, [cities.length, intervalMs])

  // Re-check the time of day every few minutes so an open tab rolls into dusk.
  useEffect(() => {
    const update = () => setPhase(skyPhase(current))
    update()
    const t = window.setInterval(update, 5 * 60 * 1000)
    return () => window.clearInterval(t)
  }, [current])

  return (
    <section className={`city-sky city-sky--${variant} ${className}`} data-phase={phase}>
      <div className="city-sky__layers" aria-hidden>
        {cities.map((slug, i) => {
          const lg = skyImage(slug, 'lg')
          const sm = skyImage(slug, 'sm')
          if (!lg || !sm) return <div key={slug} className="city-sky__fallback" data-on={i === index} />
          if (i !== 0 && !warm) return null
          return (
            <picture key={slug}>
              <source media="(max-width: 767px)" srcSet={sm} />
              <img
                src={lg}
                alt=""
                className="city-sky__img"
                data-on={i === index % cities.length}
                fetchPriority={i === 0 ? 'high' : 'low'}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={i === 0 ? () => setWarm(true) : undefined}
              />
            </picture>
          )
        })}
        <div className="city-sky__tint" />
        <div className="city-sky__wash" />
        {phase === 'night' ? (
          <div className="city-sky__stars" />
        ) : (
          <div className="city-sky__birds">
            {BIRDS.map((b, i) => (
              <svg
                key={i}
                className="city-sky__bird"
                viewBox="0 0 24 10"
                style={{ top: b.top, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`, width: b.size }}
              >
                <path className="city-sky__wing" d="M1 6 Q6 0 12 6 Q18 0 23 6" />
              </svg>
            ))}
          </div>
        )}
        <div className="city-sky__fade" />
      </div>
      <div className="city-sky__content">
        {typeof children === 'function' ? children(current, phase) : children}
      </div>
    </section>
  )
}

/** Hand-tuned so the flock never lines up: different heights, speeds and starting points. */
const BIRDS = [
  { top: '14%', dur: 46, delay: -6, size: 22 },
  { top: '18%', dur: 52, delay: -20, size: 16 },
  { top: '11%', dur: 58, delay: -34, size: 14 },
  { top: '24%', dur: 64, delay: -12, size: 12 },
  { top: '20%', dur: 70, delay: -48, size: 18 },
]

/** Gold + green brush strokes from Edwin's mockup, used as an accent at a hero's edge. */
export function BrushStrokes({ className = '' }: { className?: string }) {
  return (
    <svg className={`pointer-events-none ${className}`} viewBox="0 0 400 120" fill="none" aria-hidden>
      <path
        d="M6 92 C70 60 150 40 230 46 C300 51 350 66 394 58"
        stroke="#0b8c76"
        strokeWidth="26"
        strokeLinecap="round"
        opacity=".9"
      />
      <path
        d="M40 104 C120 82 210 72 300 80 C340 84 370 90 392 86"
        stroke="#063b32"
        strokeWidth="14"
        strokeLinecap="round"
        opacity=".85"
      />
      <path d="M150 30 C220 14 300 10 380 22" stroke="#fbbf24" strokeWidth="12" strokeLinecap="round" opacity=".95" />
    </svg>
  )
}
