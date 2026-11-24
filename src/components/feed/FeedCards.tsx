import { Thumb } from '../ui/Thumb'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { BountyItem, EventItem, FeedItem, ProofItem, WinsItem } from '../../data/feedItems'
import { formatEventWhen, relativeDays } from '../../lib/events'
import { BeforeAfterSlider } from './BeforeAfterSlider'

export interface CardActions {
  /** Builds a city-scoped in-app path. */
  path: (p: string) => string
  isGoing: (eventId: string) => boolean
  toggleGoing: (eventId: string) => void
  share: (text: string, url: string) => void
}

export function FeedCard({ item, actions }: { item: FeedItem; actions: CardActions }) {
  switch (item.type) {
    case 'proof':
      return <ProofCard item={item} actions={actions} />
    case 'bounty':
      return <BountyCard item={item} actions={actions} />
    case 'event':
      return <EventCard item={item} actions={actions} />
    case 'wins':
      return <WinsCard item={item} />
  }
}

function Shell({ children, demo, tone = 'dark' }: { children: ReactNode; demo?: boolean; tone?: 'dark' | 'green' | 'gold' }) {
  const bg =
    tone === 'green'
      ? 'bg-[linear-gradient(160deg,#0b8c76,#063b32_65%)]'
      : tone === 'gold'
        ? 'bg-[radial-gradient(circle_at_80%_10%,rgba(251,191,36,.35),transparent_50%),linear-gradient(160deg,#103b33,#06120f)]'
        : 'bg-[#0f2420]'
  return (
    <article className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 text-white shadow-[0_24px_60px_rgba(0,0,0,.45)] ${bg}`}>
      {demo ? (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#063b32]">
          Example
        </span>
      ) : null}
      {children}
    </article>
  )
}

const Kicker = ({ children, className = 'text-[#fbbf24]' }: { children: ReactNode; className?: string }) => (
  <p className={`text-[11px] font-extrabold uppercase tracking-[.16em] ${className}`}>{children}</p>
)
const primary = 'inline-flex min-h-11 whitespace-nowrap items-center justify-center rounded-full bg-[#fbbf24] px-5 text-sm font-extrabold text-[#063b32]'
const secondary = 'inline-flex min-h-11 whitespace-nowrap items-center justify-center rounded-full bg-white/15 px-5 text-sm font-bold backdrop-blur'

/* A. Before & After */
function ProofCard({ item, actions }: { item: ProofItem; actions: CardActions }) {
  const url = `${window.location.origin}${item.reportId ? actions.path(`/report/${item.reportId}`) : actions.path('/feed')}`
  return (
    <Shell demo={item.demo}>
      <div className="relative min-h-0 flex-1">
        <BeforeAfterSlider before={item.beforeImage} after={item.afterImage} />
      </div>
      <div className="p-5">
        <Kicker className="text-[#6ee7b7]">✅ Glow-up · drag to compare</Kicker>
        <h2 className="fn-display mt-1.5 text-2xl font-extrabold leading-tight">{item.place}</h2>
        <p className="mt-1 text-sm text-white/75">{item.impact}</p>
        <div className="mt-4 flex gap-2">
          {item.reportId ? (
            <Link to={actions.path(`/report/${item.reportId}`)} className={primary}>
              See the proof
            </Link>
          ) : null}
          <button type="button" onClick={() => actions.share(`✅ ${item.place} got cleaned up. Before and after:`, url)} className={secondary}>
            Share
          </button>
        </div>
      </div>
    </Shell>
  )
}

/* B. Bounty with animated progress */
function BountyCard({ item, actions }: { item: BountyItem; actions: CardActions }) {
  const pct = Math.min(100, Math.round((item.raised / Math.max(1, item.target)) * 100))
  const left = Math.max(0, item.target - item.raised)
  const money = (n: number) => `${item.currency} ${n.toLocaleString()}`
  // Animate from 0 when the card mounts.
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const t = window.setTimeout(() => setShown(pct), 120)
    return () => window.clearTimeout(t)
  }, [pct])
  const mapHref = item.reportId ? actions.path(`/report/${item.reportId}`) : `${actions.path('/map')}`

  return (
    <Shell demo={item.demo} tone="gold">
      <div className="relative min-h-0 flex-1">
        {item.image ? (
          <Thumb src={item.image} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(217,72,59,.55),transparent_35%),repeating-linear-gradient(35deg,#163a33_0_2px,transparent_2px_26px),#0d2a25]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(6,18,15,.95))]" />
        <span className="absolute left-4 top-4 rounded-full bg-[#d9483b] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.12em]">
          🔥 Bounty building
        </span>
        <p className="absolute bottom-3 left-4 font-mono text-[11px] text-white/70">
          📍 {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
        </p>
      </div>
      <div className="p-5">
        <Kicker>Active bounty · {item.backers} backers</Kicker>
        <h2 className="fn-display mt-1.5 text-2xl font-extrabold leading-tight">{item.place}</h2>
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-sm">
            <strong className="text-lg">{money(item.raised)}</strong>
            <span className="font-bold text-[#fbbf24]">{pct}%</span>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#fbbf24,#f97316)] transition-[width] duration-1000 ease-out" style={{ width: `${shown}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-white/70">
            {left > 0 ? `${money(left)} to go · the crew bounty unlocks at ${money(item.target)}` : '🎉 Fully funded: the cleanup crew is unlocked'}
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <Link to={item.reportId ? actions.path(`/report/${item.reportId}`) : actions.path('/bounties')} className={primary}>
            {item.raised >= item.target ? 'Claim bounty' : 'Fund hotspot'}
          </Link>
          <Link to={mapHref} className={secondary}>
            View on map
          </Link>
        </div>
      </div>
    </Shell>
  )
}

/* C. Cleanups & race drops */
function EventCard({ item, actions }: { item: EventItem; actions: CardActions }) {
  const going = item.eventId ? actions.isGoing(item.eventId) : false
  return (
    <Shell demo={item.demo} tone="green">
      <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#fbbf24]/25 blur-2xl" />
        <div className="rounded-3xl bg-white px-6 py-4 text-center text-[#063b32] shadow-xl">
          <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#ef8268]">
            {new Date(item.when).toLocaleDateString(undefined, { month: 'short' })}
          </p>
          <p className="fn-display text-5xl font-extrabold leading-none">{new Date(item.when).getDate()}</p>
        </div>
      </div>
      <div className="p-5">
        <Kicker>
          {item.kicker}
          {item.eventId ? ` · ${relativeDays(item.when)}` : ''}
        </Kicker>
        <h2 className="fn-display mt-1.5 text-2xl font-extrabold leading-tight">{item.title}</h2>
        <p className="mt-1 text-sm text-white/80">
          {item.eventId ? `📅 ${formatEventWhen(item.when)} · ` : ''}📍 {item.place}
        </p>
        {item.blurb ? <p className="mt-1 line-clamp-2 text-sm text-white/70">{item.blurb}</p> : null}
        {item.eventId ? <p className="mt-1 text-sm text-white/80">🙋 {item.going ? `${item.going} going` : 'Be the first to join'}</p> : null}
        <div className="mt-4 flex gap-2">
          {item.cta.action === 'rsvp' && item.eventId ? (
            <button type="button" onClick={() => actions.toggleGoing(item.eventId!)} className={going ? `${secondary} bg-white !text-[#063b32]` : primary}>
              {going ? '✓ You’re going' : item.cta.label}
            </button>
          ) : item.cta.href?.startsWith('/') ? (
            <Link to={actions.path(item.cta.href)} className={primary}>
              {item.cta.label}
            </Link>
          ) : item.cta.href ? (
            <a href={item.cta.href} target="_blank" rel="noopener noreferrer" className={primary}>
              {item.cta.label}
            </a>
          ) : null}
          {item.eventId ? (
            <Link to={`${actions.path('/map')}?event=${item.eventId}`} className={secondary}>
              Details
            </Link>
          ) : null}
        </div>
      </div>
    </Shell>
  )
}

/* D. Wins & leaderboard */
function WinsCard({ item }: { item: WinsItem }) {
  const medals = ['🥇', '🥈', '🥉']
  return (
    <Shell demo={item.demo}>
      <div className="flex min-h-0 flex-1 flex-col justify-center p-5">
        <p className="text-5xl">{item.emoji ?? '🎉'}</p>
        <Kicker className="mt-4 text-[#6ee7b7]">{item.board ? 'Leaderboard' : 'Milestone'}</Kicker>
        <h2 className="fn-display mt-1.5 text-2xl font-extrabold leading-tight">{item.title}</h2>
        {item.body ? <p className="mt-2 text-sm leading-6 text-white/75">{item.body}</p> : null}
        {item.board ? (
          <ol className="mt-4 space-y-2">
            {item.board.rows.map((row, i) => (
              <li key={row.name} className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2.5">
                <span className="w-6 text-center text-lg">{medals[i] ?? i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-bold">{row.name}</span>
                <span className="font-extrabold tabular-nums text-[#fbbf24]">{row.score}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </Shell>
  )
}
