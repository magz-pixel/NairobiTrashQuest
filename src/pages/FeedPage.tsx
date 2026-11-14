import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FeedCard, type CardActions } from '../components/feed/FeedCards'
import { assembleFeed, buildLiveFeed, CATEGORY_LABELS, type FeedCategory } from '../data/feedItems'
import { useReports } from '../hooks/useReports'
import { useUpcomingEvents } from '../hooks/useUpcomingEvents'
import { useCity, useCityPath } from '../lib/CityContext'
import { getLocale } from '../lib/i18n'
import { useCityBounties } from '../lib/bounties'

function share(text: string, url: string) {
  if (navigator.share) void navigator.share({ text, url }).catch(() => {})
  else window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener')
}

const FILTERS: (FeedCategory | 'all')[] = ['all', 'proof', 'bounty', 'event', 'wins']

/**
 * "Action & Proof" feed (roadmap #3): a curated card carousel — glow-ups, hotspots with funding
 * momentum, cleanups and race drops, and team wins. Content lives in src/data/feedItems.ts.
 */
export function FeedPage() {
  const city = useCity()
  const path = useCityPath()
  const lang = getLocale()
  const { allReports, loading } = useReports('all', 'all', city.slug)
  const { events, going, mine, toggleGoing } = useUpcomingEvents(city.slug)
  const bounties = useCityBounties(city.slug)
  const [filter, setFilter] = useState<FeedCategory | 'all'>('all')
  const [active, setActive] = useState(0)
  const rail = useRef<HTMLDivElement>(null)

  const items = useMemo(() => {
    const live = buildLiveFeed(allReports, events, going, city.currency.code, bounties)
    const all = assembleFeed(live, city.slug)
    return filter === 'all' ? all : all.filter((i) => i.type === filter)
  }, [allReports, events, going, city.currency.code, city.slug, filter, bounties])

  const actions: CardActions = {
    path,
    isGoing: (id) => mine.has(id),
    toggleGoing: (id) => void toggleGoing(id),
    share,
  }

  const onScroll = () => {
    const el = rail.current
    const first = el?.firstElementChild as HTMLElement | null
    if (!el || !first) return
    setActive(Math.round(el.scrollLeft / (first.offsetWidth + 12)))
  }
  const go = (i: number) => {
    const el = rail.current
    const card = el?.children[Math.max(0, Math.min(items.length - 1, i))] as HTMLElement | undefined
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - 16, behavior: 'smooth' })
  }
  const pick = (f: FeedCategory | 'all') => {
    setFilter(f)
    setActive(0)
    rail.current?.scrollTo({ left: 0 })
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-[#06120f] text-white">
      <header className="flex shrink-0 items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to={path('/')} className="text-sm font-extrabold">
          ← {city.chapterName}
        </Link>
        <p className="text-sm font-extrabold">{lang === 'sw' ? 'Habari' : 'Action & Proof'}</p>
        <Link to={path('/bounties')} className="rounded-full bg-[#fbbf24] px-3 py-1.5 text-xs font-extrabold text-[#063b32]">
          💰 Bounties
        </Link>
      </header>

      <nav aria-label="Feed filters" className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => pick(f)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-extrabold ${filter === f ? 'bg-[#fbbf24] text-[#063b32]' : 'bg-white/10 text-white/80'}`}
          >
            {CATEGORY_LABELS[f][lang]}
          </button>
        ))}
      </nav>

      <div className="relative min-h-0 flex-1">
        {loading && items.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-white/70">Loading what’s happening in {city.label}…</p>
        ) : items.length === 0 ? (
          <div className="grid h-full place-items-center p-8 text-center">
            <div>
              <p className="text-xl font-extrabold">Nothing here yet.</p>
              <p className="mt-2 text-sm text-white/70">Updates show up here once spots get funded or cleaned.</p>
              <button type="button" onClick={() => pick('all')} className="mt-5 rounded-full bg-white/15 px-5 py-2.5 text-sm font-bold">
                Show everything
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={rail}
            onScroll={onScroll}
            className="flex h-full snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]"
          >
            {items.map((item) => (
              <div key={item.id} className="h-full w-[86%] max-w-[400px] shrink-0 snap-center">
                <FeedCard item={item} actions={actions} />
              </div>
            ))}
            <div className="w-1 shrink-0" aria-hidden="true" />
          </div>
        )}

        {items.length > 1 ? (
          <>
            <button type="button" aria-label="Previous" onClick={() => go(active - 1)} disabled={active === 0} className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#063b32] shadow-lg disabled:opacity-0 md:grid">
              ‹
            </button>
            <button type="button" aria-label="Next" onClick={() => go(active + 1)} disabled={active >= items.length - 1} className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#063b32] shadow-lg disabled:opacity-0 md:grid">
              ›
            </button>
          </>
        ) : null}
      </div>

      {items.length > 1 ? (
        <div className="flex shrink-0 justify-center gap-1.5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3 md:pb-6">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Card ${i + 1}`}
              onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-[#fbbf24]' : 'w-1.5 bg-white/30'}`}
            />
          ))}
        </div>
      ) : (
        <div className="shrink-0 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6" />
      )}
    </div>
  )
}
