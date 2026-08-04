import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import {
  AMAZING_TRASH_RACE_S2,
  type RaceRegistration,
} from '../../types/database'
import { loadLocalRaceRegistrations } from '../../lib/raceRegistration'

/** Season 2 race day (Nairobi) — featured on Cleanups. */
export const ATR2_EVENT = {
  title: 'Amazing Trash Race · Season 2',
  dateLabel: '15 August 2026',
  when: new Date('2026-08-15T08:00:00+03:00'),
  place: 'Nairobi · Fix Nairobi × XPNC',
  synopsis:
    'A fun, all-day city cleanup race. Register free, join a squad, get a digital ticket, then map trash, clear hotspots, and log kilos with marshals. Squade scores go live on the leaderboard. Families, students, and warriors welcome — no experience needed.',
}

interface RaceStats {
  people: number
  teams: number
  rows: RaceRegistration[]
  usingLocal: boolean
}

export function AmazingTrashRaceCard() {
  const [open, setOpen] = useState(false)
  const [stats, setStats] = useState<RaceStats>({
    people: 0,
    teams: 0,
    rows: [],
    usingLocal: false,
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    let rows: RaceRegistration[] = []
    let usingLocal = false

    if (!isSupabaseConfigured) {
      rows = loadLocalRaceRegistrations()
      usingLocal = true
    } else {
      const { data, error } = await supabase
        .from('race_registrations')
        .select('*')
        .eq('event_slug', AMAZING_TRASH_RACE_S2)
        .order('created_at', { ascending: false })
      if (error || !data) {
        rows = loadLocalRaceRegistrations()
        usingLocal = true
      } else {
        rows = data as RaceRegistration[]
      }
    }

    const teamSet = new Set(
      rows.map((r) => (r.team_name?.trim() || 'Unassigned').toLowerCase()),
    )
    setStats({
      people: rows.length,
      teams: teamSet.size,
      rows,
      usingLocal,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), 15000)
    return () => window.clearInterval(id)
  }, [load])

  const daysLeft = Math.max(
    0,
    Math.ceil((ATR2_EVENT.when.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  )

  return (
    <article className="overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-br from-[#1a1208] via-[#0c1a14] to-[#0a192f] shadow-[0_0_40px_rgba(255,107,0,0.12)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full p-5 text-left"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300/90">
              Featured · Season 02
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-white md:text-2xl">
              {ATR2_EVENT.title}
            </h2>
            <p className="mt-1 text-sm text-amber-50/75">
              {ATR2_EVENT.dateLabel} · {ATR2_EVENT.place}
            </p>
          </div>
          <span className="rounded-lg border border-amber-400/40 bg-black/30 px-3 py-1.5 text-xs font-semibold text-amber-100">
            {daysLeft === 0 ? 'Race week' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} to go`}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-200/70">
              Warriors joined
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums text-[var(--fn-clear,#00f2fe)]">
              {loading ? '…' : stats.people}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-200/70">
              Squads
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums text-[var(--fn-pin,#ff6b00)]">
              {loading ? '…' : stats.teams}
            </p>
          </div>
          <div className="col-span-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 sm:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-200/70">
              Details
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {open ? 'Hide list ↑' : 'Tap to expand ↓'}
            </p>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 px-5 pb-5 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300/90">
            About the race
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-teal-50/90">{ATR2_EVENT.synopsis}</p>

          <h3 className="mt-5 text-xs font-bold uppercase tracking-wider text-amber-300/90">
            Who has joined
          </h3>
          {stats.usingLocal && (
            <p className="mt-1 text-[11px] text-amber-200/80">
              Showing this browser’s list until migration 007 is live on Supabase.
            </p>
          )}
          {stats.rows.length === 0 ? (
            <p className="mt-2 text-sm text-teal-100/60">
              Be the first — get your free Season 2 ticket.
            </p>
          ) : (
            <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2">
              {stats.rows.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5"
                >
                  <span className="font-medium text-white">{r.full_name}</span>
                  <span className="text-xs text-teal-100/65">
                    {r.team_name?.trim() || 'Unassigned'}
                    <span className="ml-2 font-mono text-teal-100/40">{r.ticket_code}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              to="/race"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-[var(--fn-clear,#00f2fe)] px-5 py-3 text-center text-sm font-extrabold text-[#021a1a] shadow-[0_0_24px_rgba(0,242,254,0.3)] transition hover:brightness-110"
            >
              Register for Season 2 — free ticket
            </Link>
            <Link
              to="/race/leaderboard"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-teal-100 hover:bg-white/5"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      )}
    </article>
  )
}
