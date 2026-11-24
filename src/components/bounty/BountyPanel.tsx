import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cityPath } from '../../lib/cities'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { createBounty, money, STATUS_COPY, suggestTarget, useBounty, type BountyProgress } from '../../lib/bounties'
import { BountyProgressBar } from './BountyProgressBar'
import { ClaimSheet } from './ClaimSheet'
import { PledgeSheet } from './PledgeSheet'

/** Bounty block inside a hotspot's detail sheet. Shows a "coming soon" preview until migration 025 runs. */
export function BountyPanel({
  reportId,
  place,
  city,
  currency,
  severity,
  seenCount,
}: {
  reportId: string
  place: string
  city: string
  currency: string
  severity: number
  seenCount: number
}) {
  // Per-spot estimate from severity + confirmations, not one generic number for every hotspot.
  const suggested = suggestTarget({ severity_score: severity, seen_count: seenCount }, currency)
  const { user, profile } = useAuth()
  const { bounty, backers, ready, reload } = useBounty(reportId)
  const [pledgeOpen, setPledgeOpen] = useState(false)
  const [claimOpen, setClaimOpen] = useState(false)

  if (ready === null) return null
  if (ready === false) return <Preview currency={currency} suggested={suggested} />

  if (!bounty) {
    return profile?.is_admin && user ? (
      <AdminStart reportId={reportId} city={city} currency={currency} userId={user.id} onDone={reload} suggested={suggested} />
    ) : (
      <section className="mt-5 rounded-2xl border border-dashed border-[#cfe1da] p-4 text-sm text-[#5d746e]">
        <p className="font-extrabold text-[#063b32]">💰 No bounty on this spot yet</p>
        <p className="mt-1">
          Estimated cost to clean: <b className="text-[#063b32]">about {money(currency, suggested)}</b>, based on its severity and how many neighbours confirmed it.
        </p>
        <p className="mt-1">Confirm it with “Seen it too”. The most-confirmed spots get a bounty and open for pledges.</p>
        <HotspotCleanups reportId={reportId} city={city} place={place} light />
      </section>
    )
  }

  const s = STATUS_COPY[bounty.status]
  const mine = (bounty.status === 'claimed' || bounty.status === 'in_review') && bounty.claimed_by === user?.id
  return (
    <section className="relative mt-5 overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_85%_0%,rgba(251,191,36,.3),transparent_45%),#063b32] p-5 text-white">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#fbbf24]">💰 Micro-bounty</p>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${s.tone}`}>{s.label}</span>
      </div>
      <div className="mt-3">
        {bounty.status === 'funding' ? (
          <BountyProgressBar raised={bounty.raised} pending={bounty.pending} target={bounty.target_amount} currency={bounty.currency} dark />
        ) : (
          <p className="text-3xl font-extrabold">{money(bounty.currency, bounty.target_amount)}</p>
        )}
      </div>
      <p className="mt-2 text-xs text-white/70">
        {bounty.backers} {bounty.backers === 1 ? 'backer' : 'backers'}
        {bounty.status === 'claimed' && bounty.claim_expires_at ? ` · crew has until ${new Date(bounty.claim_expires_at).toLocaleString()}` : ''}
      </p>

      {backers.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {backers.map((b, i) => (
            <span key={i} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px]">
              {b.name} · {money(b.currency, b.amount)}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        {bounty.status === 'funding' ? (
          <button type="button" onClick={() => setPledgeOpen(true)} className="flex-1 rounded-full bg-[#fbbf24] py-3 font-extrabold text-[#063b32]">
            Pledge to this spot
          </button>
        ) : bounty.status === 'open' ? (
          <button type="button" onClick={() => setClaimOpen(true)} className="rt-glow flex-1 rounded-full bg-[#fbbf24] py-3 font-extrabold text-[#063b32]">
            Claim · {money(bounty.currency, bounty.target_amount)}
          </button>
        ) : mine && user ? (
          <button type="button" onClick={() => setClaimOpen(true)} className="flex-1 rounded-full bg-white/15 py-3 font-bold">
            My claim / upload proof
          </button>
        ) : null}
      </div>

      {bounty.status === 'paid' && bounty.spend && bounty.spend.length > 0 ? <SpendBreakdown bounty={bounty} /> : null}
      {bounty.status !== 'paid' && bounty.status !== 'cancelled' ? <HotspotCleanups reportId={reportId} city={city} place={place} /> : null}

      <PledgeSheet bounty={bounty} place={place} open={pledgeOpen} onClose={() => setPledgeOpen(false)} onDone={() => void reload()} />
      <ClaimSheet bounty={bounty} place={place} open={claimOpen} onClose={() => setClaimOpen(false)} onDone={() => void reload()} />
    </section>
  )
}

/** Before the database is ready: an honest preview so people can see where this is going. */
function Preview({ currency, suggested }: { currency: string; suggested: number }) {
  const target = suggested
  return (
    <section className="relative mt-5 overflow-hidden rounded-3xl bg-[#063b32] p-5 text-white">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#fbbf24]">💰 Micro-bounties</p>
        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-[#063b32]">Coming soon</span>
      </div>
      <p className="mt-2 text-sm text-white/80">Back this spot with M-Pesa. When the target is hit, a verified local crew claims it, cleans it, and gets paid.</p>
      <div className="mt-3 opacity-80">
        <BountyProgressBar raised={0} target={target} currency={currency} dark />
      </div>
      <button type="button" disabled className="mt-4 w-full rounded-full bg-[#fbbf24]/60 py-3 font-extrabold text-[#063b32]">
        Pledging opens soon
      </button>
    </section>
  )
}

function AdminStart({ reportId, city, currency, userId, onDone, suggested }: { reportId: string; city: string; currency: string; userId: string; onDone: () => void; suggested: number }) {
  const [target, setTarget] = useState(suggested)
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <section className="mt-5 rounded-2xl border border-[#f5d78e] bg-[#fff8e8] p-4">
      <p className="text-sm font-extrabold text-[#8b6207]">Admin · open a bounty on this spot</p>
      <p className="mt-1 text-xs text-[#8b6207]">Set what it costs to clean (labour, bags, transport). Pledges open immediately.</p>
      <div className="mt-2 flex gap-2">
        <input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} className="fn-field mt-0" aria-label={`Target in ${currency}`} />
        <button
          type="button"
          onClick={() =>
            void createBounty(reportId, city, currency, target, userId)
              .then(onDone)
              .catch((e: Error) => setMsg(e.message))
          }
          className="shrink-0 rounded-xl bg-[#063b32] px-4 text-sm font-extrabold text-white"
        >
          Set {currency} target
        </button>
      </div>
      {msg ? <p className="mt-2 text-xs text-[#a44738]">{msg}</p> : null}
    </section>
  )
}

/** Public record of how a paid bounty's money was used (entered by an admin at payout). */
function SpendBreakdown({ bounty }: { bounty: BountyProgress }) {
  const lines = bounty.spend ?? []
  const total = lines.reduce((t, l) => t + Number(l.amount || 0), 0)
  return (
    <div className="mt-4 rounded-2xl bg-white/10 p-3">
      <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#fbbf24]">Where the money went</p>
      <ul className="mt-2 space-y-1 text-sm">
        {lines.map((l) => (
          <li key={l.label} className="flex justify-between gap-3">
            <span className="text-white/80">{l.label}</span>
            <span className="font-bold tabular-nums">{money(bounty.currency, Number(l.amount))}</span>
          </li>
        ))}
        <li className="flex justify-between gap-3 border-t border-white/15 pt-1 font-extrabold">
          <span>Total</span>
          <span className="tabular-nums">{money(bounty.currency, total)}</span>
        </li>
      </ul>
      {bounty.spend_note ? <p className="mt-2 text-xs text-white/70">{bounty.spend_note}</p> : null}
    </div>
  )
}

/**
 * Edwin's step 6: rally the community around a hotspot. Lists upcoming cleanups linked to this spot
 * and offers "Organise a cleanup here" (any signed-in user; needs migration 031 for the link).
 */
function HotspotCleanups({ reportId, city, place, light = false }: { reportId: string; city: string; place: string; light?: boolean }) {
  const [events, setEvents] = useState<{ id: string; title: string; event_date: string }[]>([])
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    void supabase
      .from('events')
      .select('id,title,event_date')
      .eq('report_id', reportId)
      .gte('event_date', new Date().toISOString())
      .order('event_date')
      .then(({ data, error }) => {
        if (!cancelled && !error) setEvents((data ?? []) as typeof events)
      })
    return () => {
      cancelled = true
    }
  }, [reportId])

  const organise = `${cityPath(city, '/cleanups/manage')}?report=${reportId}&place=${encodeURIComponent(place)}`
  return (
    <div className={`mt-4 rounded-2xl p-3 ${light ? 'bg-[#effaf5] text-[#063b32]' : 'bg-white/10'}`}>
      {events.length > 0 ? (
        <ul className="mb-2 space-y-1">
          {events.map((e) => (
            <li key={e.id}>
              <Link to={`${cityPath(city, '/map')}?event=${e.id}`} className="text-sm font-bold underline">
                🧹 {e.title} · {new Date(e.event_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <Link
        to={organise}
        className={`inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-sm font-extrabold ${
          light ? 'bg-[#063b32] text-white' : 'bg-white text-[#063b32]'
        }`}
      >
        🧹 Organise a cleanup here
      </Link>
      <p className={`mt-1 text-center text-[11px] ${light ? 'text-[#5d746e]' : 'text-white/60'}`}>
        Pick a date, invite neighbours, and it shows on the map for everyone.
      </p>
    </div>
  )
}
