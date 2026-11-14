import type { Campaign } from '../../data/fundCampaigns'
import { campaignRaised, categoriseSpend, SPEND_CATEGORIES } from '../../data/fundCampaigns'
import type { FundEntry } from '../../types/database'
import { BountyProgressBar } from '../bounty/BountyProgressBar'

/** Grid of what we're raising for. Each card is independent; add more in data/fundCampaigns.ts. */
export function CampaignGrid({
  campaigns,
  entries,
  currency,
  onDonate,
}: {
  campaigns: Campaign[]
  entries: FundEntry[]
  currency: string
  onDonate: (c: Campaign) => void
}) {
  const tags = campaigns.map((c) => c.tag).filter(Boolean) as string[]
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((c) => {
        const raised = campaignRaised(c, entries, tags)
        return (
          <article key={c.id} className="flex flex-col rounded-[1.5rem] bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-3">
              <p className="text-3xl">{c.emoji}</p>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] ${
                  c.status === 'live' ? 'bg-[#d9f7e9] text-[#087766]' : c.status === 'soon' ? 'bg-[#fff1b8] text-[#8b6207]' : 'bg-[#eef6f2] text-[#5d746e]'
                }`}
              >
                {c.status === 'live' ? 'Raising now' : c.status === 'soon' ? 'Coming soon' : 'Done'}
              </span>
            </div>
            <h3 className="fn-display mt-3 text-xl font-extrabold text-[#063b32]">{c.title}</h3>
            <p className="mt-1 flex-1 text-sm leading-6 text-[#5d746e]">{c.blurb}</p>
            {c.when ? <p className="mt-2 text-xs font-bold text-[#ef8268]">📅 {c.when}</p> : null}
            <div className="mt-4">
              <BountyProgressBar raised={raised} target={c.target} currency={currency} goalText="goal" />
            </div>
            {c.status === 'live' ? (
              <button type="button" onClick={() => onDonate(c)} className="mt-4 rounded-full bg-[#fbbf24] py-3 text-sm font-extrabold text-[#063b32]">
                Support this {c.tag ? `· note “${c.tag}”` : ''}
              </button>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

/** Stacked bar + list: expenses grouped by category (keywords in the ledger note). */
export function SpendBreakdown({ entries, bountiesPaid, format }: { entries: FundEntry[]; bountiesPaid: number; format: (n: number) => string }) {
  const totals = new Map<string, number>()
  for (const e of entries) {
    if (e.kind !== 'expense' || e.voided) continue
    const k = categoriseSpend(e.note)
    totals.set(k, (totals.get(k) ?? 0) + Number(e.amount_kes))
  }
  if (bountiesPaid > 0) totals.set('crew', (totals.get('crew') ?? 0) + bountiesPaid)
  const cats = [...SPEND_CATEGORIES, { id: 'other', label: 'Other', color: '#9ab0a8', keywords: [] }]
    .map((c) => ({ ...c, amount: totals.get(c.id) ?? 0 }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
  const sum = cats.reduce((s, c) => s + c.amount, 0)

  if (sum === 0) {
    return (
      <p className="rounded-[1.5rem] bg-white/70 p-6 text-sm text-[#5d746e]">
        No spending logged yet. Each expense the team logs shows up here, grouped by what it paid for.
      </p>
    )
  }
  return (
    <div className="rounded-[1.5rem] bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex h-4 overflow-hidden rounded-full" role="img" aria-label="Spending by category">
        {cats.map((c) => (
          <div key={c.id} style={{ width: `${(c.amount / sum) * 100}%`, background: c.color }} title={c.label} />
        ))}
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {cats.map((c) => (
          <li key={c.id} className="flex items-center gap-3 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
            <span className="flex-1 text-[#12332d]">{c.label}</span>
            <span className="font-extrabold tabular-nums text-[#063b32]">{format(c.amount)}</span>
            <span className="w-10 text-right text-xs text-[#5d746e]">{Math.round((c.amount / sum) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
