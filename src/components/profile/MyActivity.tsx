import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { useCityPath } from '../../lib/CityContext'
import { daysSince, severityLabel } from '../../lib/wards'
import { statusMeta, type FeatureKind } from '../../lib/mapFeatures'

interface MyReport {
  id: string
  area_name: string | null
  status: string
  severity_score: number
  created_at: string
  image_url: string | null
  cleared_by: string | null
}

interface MyFeature {
  id: string
  kind: FeatureKind
  status: string
  origin: string | null
  created_at: string
}

const STATUS_CHIP: Record<string, string> = {
  active: 'bg-[#ffe0d8] text-[#a44738]',
  flagged: 'bg-[#fff1b8] text-[#8b6207]',
  pending: 'bg-[#eef2f1] text-[#5d746e]',
  verified_cleared: 'bg-[#d9f7e9] text-[#087766]',
  rejected: 'bg-[#eef2f1] text-[#5d746e]',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Open',
  flagged: 'Flagged',
  pending: 'In review',
  verified_cleared: 'Cleared',
  rejected: 'Not accepted',
}

/**
 * Roadmap #8: everything this person has done, in one place — reports they submitted (with
 * live status), spots they cleared, bins and trees they mapped, and impact totals.
 */
export function MyActivity({ userId, cleanupsAttended }: { userId: string; cleanupsAttended: number }) {
  const path = useCityPath()
  const [reports, setReports] = useState<MyReport[]>([])
  const [cleared, setCleared] = useState(0)
  const [features, setFeatures] = useState<MyFeature[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    void Promise.all([
      supabase
        .from('reports')
        .select('id,area_name,status,severity_score,created_at,image_url,cleared_by')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('cleared_by', userId),
      supabase.from('map_features').select('id,kind,status,origin,created_at').eq('created_by', userId).limit(500),
    ]).then(([mine, clears, feats]) => {
      if (cancelled) return
      setReports((mine.data ?? []) as MyReport[])
      setCleared(clears.count ?? 0)
      setFeatures(feats.error ? [] : ((feats.data ?? []) as MyFeature[]))
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const bins = features.filter((f) => f.kind === 'bin').length
  const planted = features.filter((f) => f.kind === 'tree' && f.origin === 'planted').length
  const treesMapped = features.filter((f) => f.kind === 'tree').length
  const myOpenCleared = reports.filter((r) => r.status === 'verified_cleared').length

  const totals: [string, number, string][] = [
    ['Spots reported', reports.length, '📍'],
    ['Your spots now cleared', myOpenCleared, '✅'],
    ['Spots you cleared', cleared, '🧹'],
    ['Cleanups joined', cleanupsAttended, '🙋'],
    ['Bins mapped', bins, '🗑️'],
    ['Trees planted', planted, '🌱'],
    ['Trees mapped', treesMapped, '🌳'],
  ]

  return (
    <section className="rounded-[1.5rem] bg-white p-6 shadow-[var(--shadow-card)]">
      <p className="fn-eyebrow">Your record</p>
      <h2 className="fn-display mt-3 text-2xl font-extrabold text-[#063b32]">Impact, in numbers</h2>
      <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
        {totals.map(([label, n, icon]) => (
          <div key={label} className="rounded-2xl bg-[#f3f7f4] p-3">
            <dt className="text-[11px] font-bold leading-4 text-[#5d746e]">
              {icon} {label}
            </dt>
            <dd className="mt-1.5 text-2xl font-extrabold tabular-nums text-[#063b32]">{loaded ? n : '—'}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-7 text-sm font-extrabold uppercase tracking-[.12em] text-[#6a827b]">My reports</h3>
      {loaded && reports.length === 0 ? (
        <p className="mt-3 text-sm text-[#617972]">
          You haven’t reported a spot while signed in yet.{' '}
          <Link to={`${path('/map')}?action=report`} className="font-bold text-[#0b8c76]">
            Report one →
          </Link>
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[#eef2f1]">
          {reports.map((r) => (
            <li key={r.id}>
              <Link to={path(`/report/${r.id}`)} className="flex items-center gap-3 py-3 hover:bg-[#f8fbf9]">
                {r.image_url ? (
                  <img src={r.image_url} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#f3f7f4]">📍</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-[#063b32]">{r.area_name ?? 'Unnamed spot'}</span>
                  <span className="block text-xs text-[#71867f]">
                    {severityLabel(r.severity_score)} · reported {daysSince(r.created_at)} days ago
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${STATUS_CHIP[r.status] ?? STATUS_CHIP.pending}`}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {features.length > 0 ? (
        <>
          <h3 className="mt-7 text-sm font-extrabold uppercase tracking-[.12em] text-[#6a827b]">Bins & trees I mapped</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {features.slice(0, 30).map((f) => {
              const m = statusMeta(f.kind, f.status)
              return (
                <li key={f.id} className="rounded-full bg-[#f3f7f4] px-3 py-1.5 text-xs font-bold text-[#36564e]">
                  {f.kind === 'bin' ? '🗑️' : f.origin === 'planted' ? '🌱' : '🌳'} {m.label}
                </li>
              )
            })}
          </ul>
        </>
      ) : null}
    </section>
  )
}
