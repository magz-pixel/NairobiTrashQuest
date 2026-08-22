import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadLocalRaceHotspots } from '../../lib/raceHotspots'
import { loadLocalRaceRegistrations } from '../../lib/raceRegistration'
import {
  buildTeamLeaderboard,
  loadLocalRaceWeights,
  type HotspotPointCredit,
  type TeamLeaderboardRow,
} from '../../lib/raceWeights'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { AMAZING_TRASH_RACE_S2, type RaceWeightLog } from '../../types/database'

/** Compact live top-3 for landing race section. */
export function LandingLeaderboardStrip() {
  const [rows, setRows] = useState<TeamLeaderboardRow[]>([])

  const refresh = useCallback(async () => {
    let weights: RaceWeightLog[] = []
    let ticketCounts: Record<string, number> = {}
    let hotspotCredits: HotspotPointCredit[] = []

    const fillLocal = () => {
      weights = loadLocalRaceWeights()
      ticketCounts = {}
      for (const r of loadLocalRaceRegistrations()) {
        const t = r.team_name?.trim() || 'Unassigned'
        ticketCounts[t] = (ticketCounts[t] ?? 0) + 1
      }
      hotspotCredits = loadLocalRaceHotspots()
        .filter((h) => h.status === 'cleared')
        .map((h) => ({
          cleared_by_team_name: h.cleared_by_team_name,
          point_value: h.point_value,
        }))
    }

    if (!isSupabaseConfigured) {
      fillLocal()
    } else {
      const [{ data: w, error }, { data: regs }, { data: cleared, error: hErr }] =
        await Promise.all([
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
      if (error || hErr) {
        fillLocal()
      } else {
        weights = (w ?? []) as RaceWeightLog[]
        ticketCounts = {}
        for (const r of (regs ?? []) as { team_name: string | null }[]) {
          const t = r.team_name?.trim() || 'Unassigned'
          ticketCounts[t] = (ticketCounts[t] ?? 0) + 1
        }
        hotspotCredits = (cleared ?? []) as HotspotPointCredit[]
      }
    }

    setRows(buildTeamLeaderboard(weights, ticketCounts, hotspotCredits).slice(0, 3))
  }, [])

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void refresh()
    }, 0)
    const id = window.setInterval(() => void refresh(), 10000)
    return () => {
      window.clearTimeout(boot)
      window.clearInterval(id)
    }
  }, [refresh])

  return (
    <div className="mt-6 rounded-xl border border-amber-400/25 bg-black/25 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/90">
          Live top 3 · hotspot pts
        </p>
        <Link to="/race/leaderboard" className="inline-flex min-h-[44px] items-center text-[11px] font-semibold text-[#00f2fe] hover:underline">
          Full board
        </Link>
      </div>
      <ul className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {rows.length === 0 && (
            <li className="text-xs text-amber-50/60">
              No scores yet — clear hotspots and marshal kg.
            </li>
          )}
          {rows.map((r, i) => (
            <motion.li
              key={r.team}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="font-[family-name:var(--font-display)] tabular-nums text-amber-300">
                  {i + 1}
                </span>
                <span className="truncate font-medium text-white">{r.team}</span>
              </span>
              <span className="shrink-0 tabular-nums text-orange-300">
                {r.points} pts
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
