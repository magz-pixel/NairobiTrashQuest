import type { RaceWeightLog, WasteCategory } from '../types/database'
import { AMAZING_TRASH_RACE_S2 } from '../types/database'

const LOCAL_KEY = 'fix_nairobi_race_weights_v1'

function loadAll(): RaceWeightLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw) as RaceWeightLog[]
  } catch {
    /* ignore */
  }
  return []
}

function saveAll(rows: RaceWeightLog[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows))
}

export function loadLocalRaceWeights(): RaceWeightLog[] {
  return loadAll()
}

export function addLocalRaceWeight(input: {
  team_name: string
  kg: number
  waste_category: WasteCategory
  logged_by?: string | null
}): RaceWeightLog {
  const row: RaceWeightLog = {
    id: crypto.randomUUID(),
    event_slug: AMAZING_TRASH_RACE_S2,
    team_name: input.team_name.trim(),
    kg: input.kg,
    waste_category: input.waste_category,
    logged_by: input.logged_by ?? null,
    created_at: new Date().toISOString(),
  }
  saveAll([row, ...loadAll()])
  return row
}

export interface TeamLeaderboardRow {
  team: string
  kg: number
  logs: number
  tickets: number
  score: number
}

/** Score = total kg + 0.5 per registered ticket on that team (small signup bonus). */
export function buildTeamLeaderboard(
  weights: RaceWeightLog[],
  ticketCounts: Record<string, number>,
): TeamLeaderboardRow[] {
  const kgMap = new Map<string, { kg: number; logs: number }>()
  for (const w of weights) {
    const team = w.team_name.trim() || 'Unassigned'
    const cur = kgMap.get(team) ?? { kg: 0, logs: 0 }
    cur.kg += Number(w.kg)
    cur.logs += 1
    kgMap.set(team, cur)
  }

  const teams = new Set([...kgMap.keys(), ...Object.keys(ticketCounts)])
  const rows: TeamLeaderboardRow[] = []
  for (const team of teams) {
    const { kg = 0, logs = 0 } = kgMap.get(team) ?? {}
    const tickets = ticketCounts[team] ?? 0
    rows.push({
      team,
      kg,
      logs,
      tickets,
      score: kg + tickets * 0.5,
    })
  }
  return rows.sort((a, b) => b.score - a.score || b.kg - a.kg || a.team.localeCompare(b.team))
}

export const WASTE_CATEGORIES: { id: WasteCategory; label: string }[] = [
  { id: 'plastic', label: 'Plastic' },
  { id: 'organic', label: 'Organic' },
  { id: 'mixed', label: 'Mixed' },
  { id: 'other', label: 'Other' },
]
