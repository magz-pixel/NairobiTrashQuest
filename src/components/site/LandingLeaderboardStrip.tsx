import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadLocalRaceRegistrations } from '../../lib/raceRegistration'
import {
  buildTeamLeaderboard,
  loadLocalRaceWeights,
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

    if (!isSupabaseConfigured) {
      weights = loadLocalRaceWeights()
      for (const r of loadLocalRaceRegistrations()) {
        const t = r.team_name?.trim() || 'Unassigned'
        ticketCounts[t] = (ticketCounts[t] ?? 0) + 1
      }
    } else {
      const [{ data: w, error }, { data: regs }] = await Promise.all([
        supabase
          .from('race_weight_logs')
          .select('*')
          .eq('event_slug', AMAZING_TRASH_RACE_S2),
        supabase
          .from('race_registrations')
          .select('team_name')
          .eq('event_slug', AMAZING_TRASH_RACE_S2),
      ])
      if (error) {
        weights = loadLocalRaceWeights()
        for (const r of loadLocalRaceRegistrations()) {
          const t = r.team_name?.trim() || 'Unassigned'
          ticketCounts[t] = (ticketCounts[t] ?? 0) + 1
        }
      } else {
        weights = (w ?? []) as RaceWeightLog[]
        for (const r of (regs ?? []) as { team_name: string | null }[]) {
          const t = r.team_name?.trim() || 'Unassigned'
          ticketCounts[t] = (ticketCounts[t] ?? 0) + 1
        }
      }
    }

    setRows(buildTeamLeaderboard(weights, ticketCounts).slice(0, 3))
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), 10000)
    return () => window.clearInterval(id)
  }, [refresh])

  return (
    <div className="mt-6 rounded-xl border border-amber-400/25 bg-black/25 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/90">
          Live top 3 · kg + tickets
        </p>
        <Link to="/race/leaderboard" className="text-[11px] font-semibold text-[#00f2fe] hover:underline">
          Full board
        </Link>
      </div>
      <ul className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {rows.length === 0 && (
            <li className="text-xs text-amber-50/60">No weights yet — register a squad and marshal kg.</li>
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
              <span className="flex items-center gap-2 min-w-0">
                <span className="font-[family-name:var(--font-display)] text-amber-300 tabular-nums">
                  {i + 1}
                </span>
                <span className="truncate font-medium text-white">{r.team}</span>
              </span>
              <span className="shrink-0 tabular-nums text-[#00f2fe]">
                {r.score.toFixed(1)}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
