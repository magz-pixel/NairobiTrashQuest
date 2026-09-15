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
  /** Sum of cleared race_hotspots.point_value for this squad — primary ranking. */
  points: number
  /** @deprecated Prefer `points`; kept as alias for the points total. */
  score: number
}

export type HotspotPointCredit = {
  cleared_by_team_name: string | null
  point_value: number
}

/** Rank by hotspot points (primary), then kg (informational / CSR). */
export function buildTeamLeaderboard(
  weights: RaceWeightLog[],
  ticketCounts: Record<string, number>,
  hotspotCredits: HotspotPointCredit[] = [],
): TeamLeaderboardRow[] {
  const kgMap = new Map<string, { kg: number; logs: number }>()
  for (const w of weights) {
    const team = w.team_name.trim() || 'Unassigned'
    const cur = kgMap.get(team) ?? { kg: 0, logs: 0 }
    cur.kg += Number(w.kg)
    cur.logs += 1
    kgMap.set(team, cur)
  }

  const pointsMap = new Map<string, number>()
  for (const h of hotspotCredits) {
    const team = h.cleared_by_team_name?.trim() || 'Unassigned'
    pointsMap.set(team, (pointsMap.get(team) ?? 0) + Number(h.point_value))
  }

  const teams = new Set([
    ...kgMap.keys(),
    ...Object.keys(ticketCounts),
    ...pointsMap.keys(),
  ])
  const rows: TeamLeaderboardRow[] = []
  for (const team of teams) {
    const { kg = 0, logs = 0 } = kgMap.get(team) ?? {}
    const tickets = ticketCounts[team] ?? 0
    const points = pointsMap.get(team) ?? 0
    rows.push({
      team,
      kg,
      logs,
      tickets,
      points,
      score: points,
    })
  }
  return rows.sort(
    (a, b) => b.points - a.points || b.kg - a.kg || a.team.localeCompare(b.team),
  )
}

export const WASTE_CATEGORIES: { id: WasteCategory; label: string }[] = [
  { id: 'plastic', label: 'Plastic' },
  { id: 'organic', label: 'Organic' },
  { id: 'mixed', label: 'Mixed' },
  { id: 'other', label: 'Other' },
]
