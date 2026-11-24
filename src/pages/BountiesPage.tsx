import { Thumb } from '../components/ui/Thumb'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BountyProgressBar } from '../components/bounty/BountyProgressBar'
import { useAuth } from '../hooks/useAuth'
import { useReports } from '../hooks/useReports'
import { money, reviewClaim, SPEND_TEMPLATE, STATUS_COPY, useCityBounties, type BountyStatus, type SpendLine } from '../lib/bounties'
import { useCity, useCityPath } from '../lib/CityContext'
import { supabase } from '../lib/supabase'

const STEPS = [
  ['📍', 'Spot mapped', 'Neighbours report and confirm it.'],
  ['💰', 'Bounty raised', 'Pledge with M-Pesa until the target is hit.'],
  ['🙋', 'Crew claims', 'A member in good standing has 48 h.'],
  ['📸', 'Proof checked', 'Before vs after, reviewed by the team.'],
  ['✅', 'Paid out', 'Money released to the crew.'],
]

/** Public bounty board (+ admin queue). Route: /:city/bounties */
export function BountiesPage() {
  const city = useCity()
  const path = useCityPath()
  const { profile } = useAuth()
  const bounties = useCityBounties(city.slug)
  const { allReports } = useReports('all', 'all', city.slug)
  const [tab, setTab] = useState<'funding' | 'open' | 'done'>('funding')

  const rows = useMemo(() => {
    const byId = new Map(allReports.map((r) => [r.id, r]))
    const want: Record<typeof tab, BountyStatus[]> = { funding: ['funding'], open: ['open', 'claimed', 'in_review'], done: ['paid'] }
    return [...bounties.values()]
      .filter((b) => want[tab].includes(b.status))
      .sort((a, b) => b.raised / b.target_amount - a.raised / a.target_amount)
      .map((b) => ({ b, r: byId.get(b.report_id) }))
  }, [bounties, allReports, tab])

  const totals = useMemo(() => {
    const all = [...bounties.values()]
    return {
      raised: all.reduce((s, b) => s + b.raised, 0),
      live: all.filter((b) => b.status === 'funding' || b.status === 'open').length,
      paid: all.filter((b) => b.status === 'paid').length,
    }
  }, [bounties])

  return (
    <div className="min-h-[100dvh] bg-[#06120f] pb-28 text-white">
      <header className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to={path('/feed')} className="text-sm font-extrabold">← Feed</Link>
        <p className="text-sm font-extrabold">Bounties</p>
        <Link to={path('/map')} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">Map</Link>
      </header>

      <section className="mx-auto max-w-2xl px-4">
        <h1 className="fn-display mt-4 text-3xl font-extrabold leading-tight">Put a price on a dirty spot. Pay the crew who cleans it.</h1>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Raised" value={money(city.currency.code, totals.raised)} />
          <Stat label="Live bounties" value={String(totals.live)} />
          <Stat label="Paid out" value={String(totals.paid)} />
        </div>

        <ol className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {STEPS.map(([icon, title, body], i) => (
            <li key={title} className="w-36 shrink-0 rounded-2xl bg-white/5 p-3">
              <p className="text-xl">{icon}</p>
              <p className="mt-1 text-xs font-extrabold">{i + 1}. {title}</p>
              <p className="mt-0.5 text-[11px] text-white/60">{body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex gap-2">
          {(['funding', 'open', 'done'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-extrabold ${tab === t ? 'bg-[#fbbf24] text-[#063b32]' : 'bg-white/10 text-white/80'}`}>
              {t === 'funding' ? 'Raising' : t === 'open' ? 'Open & claimed' : 'Paid out'}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <>
            <div className="rounded-3xl border border-dashed border-white/20 p-6 text-center text-sm text-white/70">
              <p className="text-3xl">💰</p>
              <p className="mt-2 font-bold text-white">No bounties here yet.</p>
              <p className="mt-1">Bounties are switching on now. Open a spot on the map to see where pledging will live.</p>
              <Link to={path('/map')} className="mt-4 inline-flex rounded-full bg-[#fbbf24] px-5 py-2.5 font-extrabold text-[#063b32]">Open the map</Link>
            </div>
            {bounties.size === 0 ? (
              // What a live bounty will look like (clearly marked).
              <div className="mt-3 overflow-hidden rounded-3xl bg-[#0f2420] p-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#fbbf24] px-2 py-0.5 text-[10px] font-extrabold text-[#063b32]">Raising the bounty</span>
                  <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#063b32]">Example</span>
                </div>
                <p className="mt-2 text-lg font-extrabold text-white">Market lane dump</p>
                <p className="mb-3 text-xs text-white/60">23 backers</p>
                <BountyProgressBar raised={9600} pending={1200} target={15000} currency={city.currency.code} dark />
              </div>
            ) : null}
            </>
          ) : (
            rows.map(({ b, r }) => (
              <Link key={b.id} to={path(`/report/${b.report_id}`)} className="block overflow-hidden rounded-3xl bg-[#0f2420]">
                <div className="flex gap-3 p-4">
                  {r?.image_url ? <Thumb src={r.image_url} className="h-16 w-16 shrink-0 rounded-2xl object-cover" /> : null}
                  <div className="min-w-0 flex-1">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold ${STATUS_COPY[b.status].tone}`}>{STATUS_COPY[b.status].label}</span>
                    <p className="mt-1 truncate text-lg font-extrabold">{r?.area_name ?? 'Hotspot'}</p>
                    <p className="text-xs text-white/60">{b.backers} backers</p>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <BountyProgressBar raised={b.raised} pending={b.pending} target={b.target_amount} currency={b.currency} dark />
                </div>
              </Link>
            ))
          )}
        </div>

        {profile?.is_admin ? <AdminQueue /> : null}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-white/60">{label}</p>
      <p className="mt-1 truncate text-lg font-extrabold">{value}</p>
    </div>
  )
}

interface PendingPledge { id: string; amount: number; currency: string; method: string; display_name: string | null; provider_ref: string | null; created_at: string }
interface Review { id: string; bounty_id: string; proof_image_url: string | null; note: string | null; payout_method: string | null; user_id: string }

/** Admin: confirm money that has actually arrived, and approve or reject cleanup proof. */
function AdminQueue() {
  const [pledges, setPledges] = useState<PendingPledge[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const load = useCallback(async () => {
    const [p, c] = await Promise.all([
      supabase.from('bounty_pledges').select('id,amount,currency,method,display_name,provider_ref,created_at').eq('status', 'pending').order('created_at'),
      supabase.from('bounty_claims').select('id,bounty_id,proof_image_url,note,payout_method,user_id').eq('status', 'submitted'),
    ])
    setPledges((p.data ?? []) as PendingPledge[])
    setReviews((c.data ?? []) as Review[])
  }, [])
  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!cancelled) await load()
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  const setPledge = async (id: string, status: 'confirmed' | 'failed') => {
    await supabase.from('bounty_pledges').update({ status, confirmed_at: status === 'confirmed' ? new Date().toISOString() : null }).eq('id', id)
    void load()
  }
  const [msg, setMsg] = useState<string | null>(null)
  // One server call approves the proof, pays the bounty, records spending and marks the spot cleaned.
  const review = async (c: Review, ok: boolean, spend?: SpendLine[], note?: string) => {
    setMsg(null)
    try {
      await reviewClaim(c.id, ok, spend, note)
      setMsg(ok ? 'Approved. The spot is now marked cleaned on the map.' : 'Rejected. The bounty is open to claim again.')
    } catch (e) {
      setMsg(e instanceof Error ? `${e.message} (run migration 031 if this says the function is missing)` : 'Could not save.')
    }
    void load()
  }

  return (
    <section className="mt-10 rounded-3xl bg-white p-5 text-[#12332d]">
      <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#8b6207]">Admin queue</p>
      <h2 className="mt-1 text-xl font-extrabold">Pledges waiting for money ({pledges.length})</h2>
      <p className="text-xs text-[#5d746e]">Only confirm once the M-Pesa / wallet statement shows the payment. M-Pesa STK payments confirm themselves.</p>
      <ul className="mt-3 space-y-2">
        {pledges.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#f3f7f4] p-3 text-sm">
            <span className="flex-1">
              <b>{money(p.currency, p.amount)}</b> · {p.method} · {p.display_name ?? 'A neighbour'} · ref RT-{p.id.slice(0, 8).toUpperCase()}
              {p.provider_ref ? <span className="block break-all font-mono text-[11px] text-[#5d746e]">{p.provider_ref}</span> : null}
            </span>
            <button type="button" onClick={() => void setPledge(p.id, 'confirmed')} className="rounded-lg bg-[#0b8c76] px-3 py-1.5 text-xs font-bold text-white">Money received</button>
            <button type="button" onClick={() => void setPledge(p.id, 'failed')} className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#a44738]">Failed</button>
          </li>
        ))}
      </ul>
      <h2 className="mt-6 text-xl font-extrabold">Cleanup proof to review ({reviews.length})</h2>
      <p className="text-xs text-[#5d746e]">Approving pays the bounty, marks the hotspot cleaned with this after-photo, and publishes how the money was spent.</p>
      {msg ? <p className="mt-2 text-sm font-bold text-[#087766]">{msg}</p> : null}
      <ul className="mt-3 space-y-2">
        {reviews.map((c) => (
          <li key={c.id} className="rounded-xl bg-[#f3f7f4] p-3 text-sm">
            {c.proof_image_url ? <img src={c.proof_image_url} alt="After photo" className="h-40 w-full rounded-lg object-cover" /> : null}
            <p className="mt-2">{c.note ?? 'No note'} · payout via {c.payout_method ?? 'mpesa'}</p>
            <SpendForm onApprove={(spend, note) => void review(c, true, spend, note)} onReject={() => void review(c, false)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Approve with a spending breakdown (how the bounty money was used), or reject. */
function SpendForm({ onApprove, onReject }: { onApprove: (spend: SpendLine[], note: string) => void; onReject: () => void }) {
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const lines = SPEND_TEMPLATE.map((label) => ({ label, amount: Number(amounts[label] || 0) })).filter((l) => l.amount > 0)
  const total = lines.reduce((s, l) => s + l.amount, 0)
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#5d746e]">How was the money spent?</p>
      <div className="grid grid-cols-2 gap-2">
        {SPEND_TEMPLATE.map((label) => (
          <label key={label} className="text-xs text-[#5d746e]">
            {label}
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={amounts[label] ?? ''}
              onChange={(e) => setAmounts((a) => ({ ...a, [label]: e.target.value }))}
              className="fn-field mt-1 py-2 text-sm"
            />
          </label>
        ))}
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note, e.g. 14 bags, county truck collected at 4pm" className="fn-field text-sm" />
      <p className="text-xs text-[#5d746e]">Total: {total.toLocaleString()}</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => onApprove(lines, note)} className="rounded-lg bg-[#0b8c76] px-3 py-2 text-xs font-bold text-white">
          Approve, mark cleaned & paid
        </button>
        <button type="button" onClick={onReject} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#a44738]">
          Reject, reopen
        </button>
      </div>
    </div>
  )
}
