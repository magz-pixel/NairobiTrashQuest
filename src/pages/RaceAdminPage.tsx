import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthGate } from '../components/auth/AuthGate'
import { SiteFooter, SiteNav } from '../components/site/SiteNav'
import { useAuth } from '../hooks/useAuth'
import {
  exportRaceRegistrationsCsv,
  groupRegistrationsByTeam,
  loadLocalRaceRegistrations,
} from '../lib/raceRegistration'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { AMAZING_TRASH_RACE_S2, type RaceRegistration } from '../types/database'

function AdminInner() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<RaceRegistration[]>([])
  const [error, setError] = useState<string | null>(null)
  const [usingLocal, setUsingLocal] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    if (!isSupabaseConfigured) {
      setUsingLocal(true)
      setRows(loadLocalRaceRegistrations())
      return
    }
    const { data, error: qErr } = await supabase
      .from('race_registrations')
      .select('*')
      .eq('event_slug', AMAZING_TRASH_RACE_S2)
      .order('created_at', { ascending: false })
    if (qErr) {
      setUsingLocal(true)
      setRows(loadLocalRaceRegistrations())
      setError(qErr.message)
      return
    }
    setUsingLocal(false)
    setRows((data ?? []) as RaceRegistration[])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (!profile?.is_admin && !usingLocal) {
    return (
      <p className="rounded-xl border border-amber-400/30 bg-amber-950/40 p-4 text-sm text-amber-100">
        Admin access required. Set <code>profiles.is_admin = true</code> for your user.
      </p>
    )
  }

  const groups = groupRegistrationsByTeam(rows)

  return (
    <div className="space-y-6">
      {usingLocal && (
        <p className="text-xs text-amber-200">
          Showing local registrations (run migration 007 for shared data).
        </p>
      )}
      {error && <p className="text-xs text-amber-200">{error}</p>}
      <div className="flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          className="rounded-lg bg-[#2dd4bf] px-3 py-2 font-semibold text-[#042f2e]"
          onClick={() => exportRaceRegistrationsCsv(rows)}
        >
          Export CSV
        </button>
        <button type="button" className="text-teal-200 underline" onClick={() => void load()}>
          Refresh
        </button>
        <Link to="/race/marshal" className="text-teal-200 underline">
          Marshal weights
        </Link>
      </div>
      <p className="text-sm text-teal-100/70">
        {rows.length} warriors · {groups.length} squads
      </p>
      <ul className="space-y-4">
        {groups.map((g) => (
          <li
            key={g.team}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
              {g.team}{' '}
              <span className="text-sm font-normal text-teal-300">({g.members.length})</span>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-teal-100/80">
              {g.members.map((m) => (
                <li key={m.id}>
                  <span className="font-mono text-xs text-[#2dd4bf]">{m.ticket_code}</span>
                  {' · '}
                  {m.full_name}
                  <span className="text-teal-100/50"> · {m.phone}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RaceAdminPage() {
  return (
    <div className="fn-landing min-h-full bg-[#071613] text-[#e8f5f1]">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-12 md:px-6">
        <Link to="/race" className="text-sm text-teal-300 hover:text-white">
          ← Registration
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-white">
          Race admin · teams
        </h1>
        <p className="mt-2 text-sm text-teal-100/70">
          Registrations grouped by squad for Amazing Trash Race Season 2.
        </p>
        <div className="mt-8">
          {!isSupabaseConfigured ? (
            <AdminInner />
          ) : (
            <AuthGate>
              <AdminInner />
            </AuthGate>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
