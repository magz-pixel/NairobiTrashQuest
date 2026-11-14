import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useReports } from '../hooks/useReports'
import { useUpcomingEvents } from '../hooks/useUpcomingEvents'
import { useCity, useCityPath } from '../lib/CityContext'
import { formatEventWhen, relativeDays } from '../lib/events'
import { daysSince, severityLabel } from '../lib/wards'
import { formatWasteTypes, type Event, type Report } from '../types/database'

type Card =
  | { kind: 'cleanup'; at: string; event: Event }
  | { kind: 'report'; at: string; report: Report }
  | { kind: 'cleared'; at: string; report: Report }

function share(text: string, url: string) {
  const full = `${text} ${url}`
  if (navigator.share) void navigator.share({ text, url }).catch(() => {})
  else window.open(`https://wa.me/?text=${encodeURIComponent(full)}`, '_blank', 'noopener')
}

/**
 * Activity feed (roadmap #3): a swipeable, full-screen stream of what's happening in the city —
 * upcoming cleanups first, then newly pinned hotspots and verified clears, newest first.
 */
export function FeedPage() {
  const city = useCity()
  const path = useCityPath()
  const { allReports, loading } = useReports('all', 'all', city.slug)
  const { events, going, mine, toggleGoing } = useUpcomingEvents(city.slug)

  const cards = useMemo<Card[]>(() => {
    const items: Card[] = []
    for (const r of allReports) {
      if (r.status === 'verified_cleared') items.push({ kind: 'cleared', at: r.cleared_at ?? r.updated_at, report: r })
      else if (r.status === 'active' || r.status === 'flagged') items.push({ kind: 'report', at: r.created_at, report: r })
    }
    items.sort((a, b) => b.at.localeCompare(a.at))
    const cleanups: Card[] = events.map((e) => ({ kind: 'cleanup', at: e.event_date, event: e }))
    return [...cleanups, ...items].slice(0, 60)
  }, [allReports, events])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="h-[100dvh] bg-[#06120f] text-white">
      <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to={path('/')} className="text-sm font-extrabold">
          ← {city.chapterName}
        </Link>
        <p className="text-sm font-extrabold">Feed</p>
        <Link to={path('/map')} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
          Map
        </Link>
      </header>

      <main className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain">
        {loading && cards.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-white/70">Loading what’s happening in {city.label}…</div>
        ) : null}
        {!loading && cards.length === 0 ? (
          <div className="grid h-full place-items-center p-8 text-center">
            <div>
              <p className="text-2xl font-extrabold">Nothing here yet.</p>
              <p className="mt-2 text-white/70">Be the first to put a spot in {city.label} on the map.</p>
              <Link to={`${path('/map')}?action=report`} className="mt-6 inline-flex rounded-full bg-gold-400 px-6 py-3 font-extrabold text-emerald-950">
                📍 Report a spot
              </Link>
            </div>
          </div>
        ) : null}

        {cards.map((card) => {
          if (card.kind === 'cleanup') {
            const e = card.event
            const n = going.get(e.id)
            const isGoing = mine.has(e.id)
            return (
              <section key={`e-${e.id}`} className="relative flex h-[100dvh] snap-start flex-col justify-end overflow-hidden bg-[radial-gradient(circle_at_70%_20%,rgba(251,191,36,.35),transparent_45%),linear-gradient(160deg,#0b8c76,#063b32_60%,#041b17)] p-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10">
                <p className="text-6xl">🧹</p>
                <p className="mt-4 text-xs font-extrabold uppercase tracking-[.16em] text-gold-300">Cleanup · {relativeDays(e.event_date)}</p>
                <h2 className="fn-display mt-2 text-3xl font-extrabold leading-tight">{e.title}</h2>
                <p className="mt-2 text-white/80">📅 {formatEventWhen(e.event_date)} · 📍 {e.location}</p>
                {typeof n === 'number' ? <p className="mt-1 text-white/80">🙋 {n} going</p> : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleGoing(e.id)}
                    className={`rounded-full px-5 py-3 text-sm font-extrabold ${isGoing ? 'bg-white text-[#063b32]' : 'bg-gold-400 text-emerald-950'}`}
                  >
                    {isGoing ? '✓ You’re going' : 'I’ll be there'}
                  </button>
                  <Link to={`${path('/map')}?event=${e.id}`} className="rounded-full bg-white/15 px-5 py-3 text-sm font-bold backdrop-blur">
                    Details
                  </Link>
                  <button
                    type="button"
                    onClick={() => share(`🧹 ${e.title}, ${formatEventWhen(e.event_date)} at ${e.location}. Join us:`, `${origin}${path('/map')}?event=${e.id}`)}
                    className="rounded-full bg-white/15 px-5 py-3 text-sm font-bold backdrop-blur"
                  >
                    Invite
                  </button>
                </div>
              </section>
            )
          }

          const r = card.report
          const cleared = card.kind === 'cleared'
          const photo = cleared && r.cleared_image_url ? r.cleared_image_url : r.image_url
          const place = r.area_name ?? city.label
          return (
            <section key={`r-${r.id}`} className="relative flex h-[100dvh] snap-start flex-col justify-end overflow-hidden p-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10">
              {photo ? (
                <img src={photo} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 -z-10 bg-[#0f2c27]" />
              )}
              <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,.15)_30%,rgba(0,0,0,.85))]" />
              {cleared && r.image_url && r.cleared_image_url ? (
                <div className="absolute right-4 top-20 w-28 overflow-hidden rounded-xl border-2 border-white/80 shadow-lg">
                  <img src={r.image_url} alt="Before" className="h-28 w-full object-cover" />
                  <p className="bg-black/60 py-0.5 text-center text-[10px] font-bold">BEFORE</p>
                </div>
              ) : null}
              <p className={`w-fit rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.12em] ${cleared ? 'bg-[#0b8c76]' : 'bg-[#d9483b]'}`}>
                {cleared ? '✅ Cleared' : `📍 ${severityLabel(r.severity_score)} · open ${daysSince(r.created_at)} days`}
              </p>
              <h2 className="fn-display mt-3 text-3xl font-extrabold leading-tight">{place}</h2>
              <p className="mt-1 text-white/80">
                {cleared ? 'Before and after are on the map.' : formatWasteTypes(r.waste_type)}
                {!cleared && r.seen_count > 0 ? ` · ${r.seen_count} neighbour${r.seen_count === 1 ? '' : 's'} confirmed` : ''}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={path(`/report/${r.id}`)} className="rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#063b32]">
                  {cleared ? 'See the proof' : 'See on map'}
                </Link>
                {!cleared ? (
                  <Link to={path('/funds')} className="rounded-full bg-gold-400 px-5 py-3 text-sm font-extrabold text-emerald-950">
                    Support a cleanup
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    share(
                      cleared ? `✅ ${place} was cleared! See the before and after:` : `📍 ${place} has been open ${daysSince(r.created_at)} days. Help get it cleared:`,
                      `${origin}${path(`/report/${r.id}`)}`,
                    )
                  }
                  className="rounded-full bg-white/15 px-5 py-3 text-sm font-bold backdrop-blur"
                >
                  Share
                </button>
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
