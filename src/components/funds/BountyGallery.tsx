import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BountyProgress, BountyStatus } from '../../lib/bounties'
import { STATUS_COPY } from '../../lib/bounties'
import { daysSince, severityLabel } from '../../lib/wards'
import type { Report } from '../../types/database'
import { BountyProgressBar } from '../bounty/BountyProgressBar'

type View = 'live' | 'claimable' | 'done'
type Sort = 'closest' | 'raised' | 'severity' | 'newest'

const VIEWS: Record<View, { label: string; statuses: BountyStatus[] }> = {
  live: { label: 'Pledge now', statuses: ['funding'] },
  claimable: { label: 'Funded · claim', statuses: ['open', 'claimed', 'in_review'] },
  done: { label: 'Cleaned & paid', statuses: ['paid'] },
}
const SORTS: Record<Sort, string> = { closest: 'Closest to target', raised: 'Most raised', severity: 'Worst first', newest: 'Newest' }

const sevTone = (s: number) => (s >= 9 ? 'bg-[#d9483b]' : s >= 7 ? 'bg-[#ef8268]' : s >= 5 ? 'bg-[#f59e0b]' : 'bg-[#0b8c76]')

/** Gallery of hotspot bounties: filter by stage, sort by progress / money / severity / age. */
export function BountyGallery({
  bounties,
  reports,
  reportPath,
  mapPath,
}: {
  bounties: Map<string, BountyProgress>
  reports: Report[]
  reportPath: (id: string) => string
  mapPath: string
}) {
  const [view, setView] = useState<View>('live')
  const [sort, setSort] = useState<Sort>('closest')

  const byId = useMemo(() => new Map(reports.map((r) => [r.id, r])), [reports])
  const counts = useMemo(() => {
    const all = [...bounties.values()]
    return Object.fromEntries((Object.keys(VIEWS) as View[]).map((v) => [v, all.filter((b) => VIEWS[v].statuses.includes(b.status)).length])) as Record<View, number>
  }, [bounties])

  const rows = useMemo(() => {
    const list = [...bounties.values()]
      .filter((b) => VIEWS[view].statuses.includes(b.status))
      .map((b) => ({ b, r: byId.get(b.report_id) }))
    const sev = (x: { r?: Report }) => x.r?.severity_score ?? 0
    const sorters: Record<Sort, (a: (typeof list)[0], c: (typeof list)[0]) => number> = {
      closest: (a, c) => c.b.raised / c.b.target_amount - a.b.raised / a.b.target_amount,
      raised: (a, c) => c.b.raised - a.b.raised,
      severity: (a, c) => sev(c) - sev(a),
      newest: (a, c) => c.b.created_at.localeCompare(a.b.created_at),
    }
    return list.sort(sorters[sort])
  }, [bounties, byId, view, sort])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-extrabold ${view === v ? 'bg-[#063b32] text-white' : 'bg-white text-[#063b32] shadow-sm'}`}
          >
            {VIEWS[v].label} <span className="opacity-60">· {counts[v]}</span>
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs font-bold text-[#5d746e]">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-full border border-[#d9e9e4] bg-white px-3 py-2 text-xs font-bold text-[#063b32]">
            {(Object.keys(SORTS) as Sort[]).map((s) => (
              <option key={s} value={s}>
                {SORTS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5 rounded-[1.5rem] border border-dashed border-[#cfe1da] bg-white/70 p-8 text-center text-sm text-[#5d746e]">
          <p className="text-3xl">💰</p>
          <p className="mt-2 font-extrabold text-[#063b32]">
            {view === 'live' ? 'No hotspots are raising right now.' : view === 'claimable' ? 'No funded bounties yet.' : 'Nothing paid out yet.'}
          </p>
          <p className="mt-1">New bounty drops appear here the moment the team opens them. Spot a dump that needs one?</p>
          <Link to={mapPath} className="mt-4 inline-flex rounded-full bg-[#063b32] px-5 py-2.5 font-extrabold text-white">
            Find it on the map
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ b, r }) => (
            <Link key={b.id} to={reportPath(b.report_id)} className="group overflow-hidden rounded-[1.5rem] bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5">
              <div className="relative h-40 bg-[#0f2420]">
                {r?.image_url ? <img src={r.image_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(6,18,15,.75))]" />
                <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${STATUS_COPY[b.status].tone}`}>{STATUS_COPY[b.status].label}</span>
                {r ? (
                  <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-white ${sevTone(r.severity_score)}`}>
                    {severityLabel(r.severity_score)}
                  </span>
                ) : null}
                <p className="absolute bottom-3 left-3 right-3 truncate text-lg font-extrabold text-white">{r?.area_name ?? 'Hotspot'}</p>
              </div>
              <div className="p-4">
                <BountyProgressBar raised={b.raised} pending={b.pending} target={b.target_amount} currency={b.currency} />
                <p className="mt-2 text-xs text-[#5d746e]">
                  {b.backers} {b.backers === 1 ? 'backer' : 'backers'}
                  {r ? ` · open ${daysSince(r.created_at)} days` : ''}
                </p>
                <p className="mt-3 text-sm font-extrabold text-[#0b8c76] group-hover:underline">
                  {b.status === 'funding' ? 'Pledge →' : b.status === 'open' ? 'Claim this bounty →' : 'See the proof →'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
