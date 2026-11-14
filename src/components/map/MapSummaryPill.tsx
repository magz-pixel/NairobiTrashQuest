import { useMemo, useState } from 'react'
import type { Report } from '../../types/database'

interface AreaRow {
  name: string
  count: number
  lat: number
  lng: number
}

/**
 * One glanceable line over the map (Namma Kasa-style): open · cleared · cleanups.
 * Tap it to open "Where it's worst" — areas ranked by open spots; tap one to fly there.
 */
export function MapSummaryPill({
  reports,
  cleanups,
  onFlyTo,
}: {
  reports: Report[]
  cleanups: number
  onFlyTo: (lat: number, lng: number) => void
}) {
  const [open, setOpen] = useState(false)

  const { active, cleared, areas } = useMemo(() => {
    const live = reports.filter((r) => r.status === 'active' || r.status === 'flagged')
    const byArea = new Map<string, { count: number; lat: number; lng: number }>()
    for (const r of live) {
      const name = r.area_name?.trim() || 'Unnamed spot'
      const row = byArea.get(name) ?? { count: 0, lat: 0, lng: 0 }
      row.count += 1
      row.lat += r.latitude
      row.lng += r.longitude
      byArea.set(name, row)
    }
    const rows: AreaRow[] = [...byArea.entries()]
      .map(([name, v]) => ({ name, count: v.count, lat: v.lat / v.count, lng: v.lng / v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
    return {
      active: live.length,
      cleared: reports.filter((r) => r.status === 'verified_cleared').length,
      areas: rows,
    }
  }, [reports])

  const max = areas[0]?.count ?? 1

  return (
    <div className="pointer-events-auto">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="mx-auto flex items-center gap-3 whitespace-nowrap rounded-full border border-white/80 bg-white/95 py-2 pl-4 pr-3 text-sm shadow-[0_14px_36px_rgba(6,59,50,.18)] backdrop-blur"
      >
        <span className="flex items-baseline gap-1.5">
          <strong className="text-lg font-extrabold tabular-nums text-[#d9483b]">{active}</strong>
          <span className="font-semibold text-[#5d746e]">open</span>
        </span>
        <span className="h-4 w-px bg-[#d9e9e4]" />
        <span className="flex items-baseline gap-1.5">
          <strong className="text-lg font-extrabold tabular-nums text-[#0b8c76]">{cleared}</strong>
          <span className="font-semibold text-[#5d746e]">cleared</span>
        </span>
        {cleanups > 0 ? (
          <>
            <span className="h-4 w-px bg-[#d9e9e4]" />
            <span className="flex items-baseline gap-1.5">
              <strong className="text-lg font-extrabold tabular-nums text-[#063b32]">{cleanups}</strong>
              <span className="font-semibold text-[#5d746e]">{cleanups === 1 ? 'cleanup' : 'cleanups'}</span>
            </span>
          </>
        ) : null}
        <span
          className={`grid h-6 w-6 place-items-center rounded-full bg-[#effaf5] text-xs text-[#063b32] transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && areas.length > 0 ? (
        <div className="mx-auto mt-2 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-white/80 bg-white/97 p-3 shadow-[0_20px_50px_rgba(6,59,50,.2)] backdrop-blur">
          <p className="px-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#0b8c76]">Where it’s worst</p>
          <ol className="mt-2 space-y-1">
            {areas.map((a, i) => (
              <li key={a.name}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onFlyTo(a.lat, a.lng)
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-[#f3f7f4]"
                >
                  <span className="w-4 text-xs font-extrabold text-[#9ab0a8]">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2 text-sm font-bold text-[#063b32]">
                      <span className="truncate">{a.name}</span>
                      <span className="tabular-nums text-[#d9483b]">{a.count}</span>
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#f3efe4]">
                      <span
                        className="block h-full rounded-full bg-[linear-gradient(90deg,#f9bf8f,#d9483b)]"
                        style={{ width: `${Math.max(8, (a.count / max) * 100)}%` }}
                      />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}
