import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteFooter, SiteNav } from '../components/site/SiteNav'
import { loadLocalRaceHotspots } from '../lib/raceHotspots'
import { loadLocalRaceRegistrations } from '../lib/raceRegistration'
import {
  buildTeamLeaderboard,
  loadLocalRaceWeights,
  type HotspotPointCredit,
  type TeamLeaderboardRow,
} from '../lib/raceWeights'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { AMAZING_TRASH_RACE_S2, type RaceWeightLog } from '../types/database'

function ticketCountsFromRegs(
  regs: { team_name: string | null }[],
): Record<string, number> {
  const ticketCounts: Record<string, number> = {}
  for (const r of regs) {
    const t = r.team_name?.trim() || 'Unassigned'
    ticketCounts[t] = (ticketCounts[t] ?? 0) + 1
  }
  return ticketCounts
}

function localHotspotCredits(): HotspotPointCredit[] {
  return loadLocalRaceHotspots()
    .filter((h) => h.status === 'cleared')
    .map((h) => ({
      cleared_by_team_name: h.cleared_by_team_name,
      point_value: h.point_value,
    }))
}

export function RaceLeaderboardPage() {
  const [rows, setRows] = useState<TeamLeaderboardRow[]>([])
  const [usingLocal, setUsingLocal] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    let weights: RaceWeightLog[]
    let ticketCounts: Record<string, number>
    let hotspotCredits: HotspotPointCredit[]

    if (!isSupabaseConfigured) {
      setUsingLocal(true)
      weights = loadLocalRaceWeights()
      ticketCounts = ticketCountsFromRegs(loadLocalRaceRegistrations())
      hotspotCredits = localHotspotCredits()
    } else {
      const [
        { data: w, error },
        { data: regs, error: rErr },
        { data: cleared, error: hErr },
      ] = await Promise.all([
        supabase
          .from('race_weight_logs')
          .select('*')
          .eq('event_slug', AMAZING_TRASH_RACE_S2),
        supabase
          .from('race_registrations')
          .select('team_name')
          .eq('event_slug', AMAZING_TRASH_RACE_S2),
        supabase
          .from('race_hotspots')
          .select('cleared_by_team_name, point_value')
          .eq('event_slug', AMAZING_TRASH_RACE_S2)
          .eq('status', 'cleared'),
      ])
      if (error || rErr || hErr) {
        setUsingLocal(true)
        weights = loadLocalRaceWeights()
        ticketCounts = ticketCountsFromRegs(loadLocalRaceRegistrations())
        hotspotCredits = localHotspotCredits()
      } else {
        setUsingLocal(false)
        weights = (w ?? []) as RaceWeightLog[]
        ticketCounts = ticketCountsFromRegs(
          (regs ?? []) as { team_name: string | null }[],
        )
        hotspotCredits = (cleared ?? []) as HotspotPointCredit[]
      }
    }

    setRows(buildTeamLeaderboard(weights, ticketCounts, hotspotCredits))
    setUpdatedAt(new Date().toLocaleTimeString())
  }, [])

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void refresh()
    }, 0)
    const id = window.setInterval(() => void refresh(), 8000)
    return () => {
      window.clearTimeout(boot)
      window.clearInterval(id)
    }
  }, [refresh])

  useEffect(() => {
    if (!isSupabaseConfigured || usingLocal) return
    const channel = supabase
      .channel(`race_weights_lb_${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'race_weight_logs' },
        () => {
          void refresh()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'race_hotspots' },
        () => {
          void refresh()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refresh, usingLocal])

  return (
    <div className="fn-landing min-h-full bg-[#071613] text-[#e8f5f1]">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-12 md:px-6 md:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300/90">
          Season 2 · live
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold text-white md:text-5xl">
          Leaderboard
        </h1>
        <p className="mt-3 text-teal-100/75">
          Ranked by hotspot points cleared. Kilograms stay on the board for CSR /
          impact reporting.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link to="/race" className="text-[#2dd4bf] hover:underline">
            Register
          </Link>
          <Link to="/race/marshal" className="text-teal-200/80 hover:underline">
            Marshal log-in
          </Link>
          {updatedAt && (
            <span className="text-teal-100/50">Updated {updatedAt}</span>
          )}
        </div>
        {usingLocal && (
          <p className="mt-3 text-xs text-amber-200">
            Local demo data — run migrations 007 + 008 + 014 for shared live scoring.
          </p>
        )}

        <ol className="mt-10 space-y-3">
          {rows.length === 0 && (
            <li className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-teal-100/60">
              No squads on the board yet. Clear race hotspots and log kg at marshal
              checkpoints.
            </li>
          )}
          {rows.map((row, i) => (
            <li
              key={row.team}
              className={`flex items-center gap-4 rounded-xl border p-4 ${
                i === 0
                  ? 'border-amber-400/40 bg-amber-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-display)] text-lg font-bold ${
                  i === 0 ? 'bg-amber-400 text-[#042f2e]' : 'bg-[#12352f] text-[#2dd4bf]'
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-white">{row.team}</p>
                <p className="text-xs text-teal-100/60">
                  {row.kg.toFixed(1)} kg · {row.tickets} tickets · {row.logs} weigh-ins
                </p>
              </div>
              <div className="text-right">
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums text-orange-300">
                  {row.points}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-teal-100/50">pts</p>
              </div>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  )
}
