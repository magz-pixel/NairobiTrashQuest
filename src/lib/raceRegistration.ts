import type { RaceRegistration } from '../types/database'
import { AMAZING_TRASH_RACE_S2 } from '../types/database'

const LOCAL_KEY = 'fix_nairobi_race_regs_v1'

function loadAll(): RaceRegistration[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw) as RaceRegistration[]
  } catch {
    /* ignore */
  }
  return []
}

function saveAll(rows: RaceRegistration[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows))
}

export function generateTicketCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `ATR2-${suffix}`
}

export function addLocalRaceRegistration(input: {
  full_name: string
  phone: string
  email: string
  team_name?: string | null
  user_id?: string | null
}): RaceRegistration {
  const rows = loadAll()
  const row: RaceRegistration = {
    id: crypto.randomUUID(),
    event_slug: AMAZING_TRASH_RACE_S2,
    full_name: input.full_name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim().toLowerCase(),
    team_name: input.team_name?.trim() || null,
    ticket_code: generateTicketCode(),
    user_id: input.user_id ?? null,
    created_at: new Date().toISOString(),
  }
  saveAll([row, ...rows])
  return row
}

export function loadLocalRaceRegistrations(): RaceRegistration[] {
  return loadAll()
}

export function deleteLocalRaceRegistration(id: string) {
  saveAll(loadAll().filter((row) => row.id !== id))
}

/** Suggested squad names for Season 2 — warriors can also type a custom name. */
export const RACE_TEAM_PRESETS = [
  'Green Scouts',
  'River Rangers',
  'Kibra Clean Crew',
  'CBD Guardians',
  'Plastic Patrol',
  'XPNC Allies',
] as const

export function groupRegistrationsByTeam(
  rows: RaceRegistration[],
): { team: string; members: RaceRegistration[] }[] {
  const map = new Map<string, RaceRegistration[]>()
  for (const row of rows) {
    const team = row.team_name?.trim() || 'Unassigned'
    const list = map.get(team) ?? []
    list.push(row)
    map.set(team, list)
  }
  return [...map.entries()]
    .map(([team, members]) => ({ team, members }))
    .sort((a, b) => b.members.length - a.members.length || a.team.localeCompare(b.team))
}

export function exportRaceRegistrationsCsv(rows: RaceRegistration[]): void {
  const header = 'ticket_code,full_name,phone,email,team_name,created_at\n'
  const body = rows
    .map(
      (r) =>
        `${r.ticket_code},${r.full_name.replace(/,/g, ' ')},${r.phone},${r.email},${(r.team_name ?? '').replace(/,/g, ' ')},${r.created_at}`,
    )
    .join('\n')
  const blob = new Blob([header + body], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'amazing-trash-race-s2-registrations.csv'
  a.click()
  URL.revokeObjectURL(url)
}
