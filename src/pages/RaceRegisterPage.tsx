import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RaceTicket3D } from '../components/site/art/RaceTicket3D'
import { SignInButton } from '../components/auth/SignInButton'
import { SiteFooter, SiteNav } from '../components/site/SiteNav'
import { useAuth } from '../hooks/useAuth'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  addLocalRaceRegistration,
  exportRaceRegistrationsCsv,
  generateTicketCode,
  loadLocalRaceRegistrations,
  RACE_TEAM_PRESETS,
} from '../lib/raceRegistration'
import {
  AMAZING_TRASH_RACE_S2,
  type RaceRegistration,
} from '../types/database'

const inputClass =
  'mt-1 w-full rounded-lg border border-white/15 bg-[#0a1a17] px-3 py-2.5 text-white'

export function RaceRegisterPage() {
  const { user, profile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [teamName, setTeamName] = useState('')
  const [customTeam, setCustomTeam] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticket, setTicket] = useState<RaceRegistration | null>(null)
  const [usingLocal, setUsingLocal] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const squad = teamName.trim()
    if (!squad) {
      setError('Pick or enter your squad / micro-team name.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload = {
        event_slug: AMAZING_TRASH_RACE_S2,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        team_name: squad,
        ticket_code: generateTicketCode(),
        user_id: user?.id ?? null,
      }

      if (!isSupabaseConfigured) {
        const row = addLocalRaceRegistration({
          full_name: payload.full_name,
          phone: payload.phone,
          email: payload.email,
          team_name: payload.team_name,
          user_id: payload.user_id,
        })
        setUsingLocal(true)
        setTicket(row)
        return
      }

      const { data, error: insErr } = await supabase
        .from('race_registrations')
        .insert(payload)
        .select('*')
        .single()

      if (insErr) {
        const row = addLocalRaceRegistration({
          full_name: payload.full_name,
          phone: payload.phone,
          email: payload.email,
          team_name: payload.team_name,
          user_id: payload.user_id,
        })
        setUsingLocal(true)
        setTicket(row)
        setError(`Saved locally (server: ${insErr.message}). Run migration 007 for shared tickets.`)
        return
      }

      setUsingLocal(false)
      setTicket(data as RaceRegistration)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  const exportCsv = async () => {
    if (usingLocal || !isSupabaseConfigured) {
      exportRaceRegistrationsCsv(loadLocalRaceRegistrations())
      return
    }
    if (!profile?.is_admin) {
      setError('Admin only for live export.')
      return
    }
    const { data, error: qErr } = await supabase
      .from('race_registrations')
      .select('*')
      .eq('event_slug', AMAZING_TRASH_RACE_S2)
      .order('created_at', { ascending: false })
    if (qErr) {
      setError(qErr.message)
      return
    }
    exportRaceRegistrationsCsv((data ?? []) as RaceRegistration[])
  }

  return (
    <div className="fn-landing min-h-full bg-[#071613] text-[#e8f5f1]">
      <SiteNav />
      <main className="mx-auto max-w-lg px-4 py-12 md:px-6 md:py-16">
        <div className="flex flex-wrap gap-3 text-xs">
          <Link to="/race/leaderboard" className="text-[#2dd4bf] hover:underline">
            Live leaderboard
          </Link>
          {profile?.is_admin && (
            <>
              <Link to="/race/admin" className="text-teal-200/80 hover:underline">
                Admin · teams
              </Link>
              <Link to="/race/marshal" className="text-teal-200/80 hover:underline">
                Marshal weights
              </Link>
            </>
          )}
        </div>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300/90">
          Season 2
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold text-white">
          Amazing Trash Race
        </h1>
        <p className="mt-3 text-teal-100/75">
          Register for a digital ticket, join a squad, and bring your code on race day.
        </p>

        {!ticket ? (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-xs text-teal-200/80">
              Full name
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-xs text-teal-200/80">
              Phone
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="07XX XXX XXX"
              />
            </label>
            <label className="block text-xs text-teal-200/80">
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>

            <div>
              <p className="text-xs text-teal-200/80">Squad / micro-team *</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {RACE_TEAM_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setCustomTeam(false)
                      setTeamName(preset)
                    }}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                      !customTeam && teamName === preset
                        ? 'border-[#2dd4bf] bg-teal-500/20 text-[#2dd4bf]'
                        : 'border-white/15 text-teal-100/80'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setCustomTeam(true)
                    setTeamName('')
                  }}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                    customTeam
                      ? 'border-orange-400 bg-orange-500/15 text-orange-200'
                      : 'border-white/15 text-teal-100/80'
                  }`}
                >
                  Custom…
                </button>
              </div>
              {customTeam && (
                <input
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className={inputClass}
                  placeholder="Your squad name"
                />
              )}
              {!customTeam && !teamName && (
                <p className="mt-2 text-[11px] text-amber-200/80">Select a squad above.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-[#2dd4bf] py-3 text-sm font-bold text-[#042f2e] disabled:opacity-50"
            >
              {busy ? 'Issuing ticket…' : 'Get my ticket'}
            </button>
            {error && <p className="text-sm text-amber-200">{error}</p>}
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8"
          >
            <RaceTicket3D
              code={ticket.ticket_code}
              holderName={ticket.full_name}
              teamName={ticket.team_name ?? undefined}
            />
            <p className="mt-4 rounded-lg bg-black/30 px-3 py-2 text-xs text-teal-100/80">
              Screenshot this ticket. On race day open the{' '}
              <Link to="/map" className="font-semibold text-[#00f2fe]">
                Trash Map
              </Link>{' '}
              and watch the{' '}
              <Link to="/race/leaderboard" className="font-semibold text-[#00f2fe]">
                live leaderboard
              </Link>
              .
            </p>
            {usingLocal && (
              <p className="mt-3 text-xs text-amber-200">
                Stored in this browser until migration 007 is applied on Supabase.
              </p>
            )}
            {!user ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-teal-50/90">
                  Save this ticket to your account so it appears under My impact.
                </p>
                <div className="mt-3">
                  <SignInButton variant="dark" label="Join & save ticket" />
                </div>
                <p className="mt-2 text-[11px] text-teal-100/50">
                  Screenshot still works if you prefer — then register again while signed in.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-[var(--fn-clear,#5eead4)]">
                Signed in — open{' '}
                <Link to="/me" className="underline">
                  My impact
                </Link>{' '}
                to see tickets linked to your account.
              </p>
            )}
            <button
              type="button"
              className="mt-4 text-sm text-teal-300 underline"
              onClick={() => {
                setTicket(null)
                setError(null)
              }}
            >
              Register another person
            </button>
          </motion.div>
        )}

        {profile?.is_admin && (
          <button
            type="button"
            onClick={() => void exportCsv()}
            className="mt-8 text-sm text-teal-200 underline"
          >
            Export registrations CSV
          </button>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
