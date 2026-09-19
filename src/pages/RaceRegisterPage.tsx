import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RaceTicket3D } from '../components/site/art/RaceTicket3D'
import { SignInButton } from '../components/auth/SignInButton'
import { ActionLink, PageIntro, PublicShell } from '../components/site/PagePrimitives'
import { useCity, useCityPath } from '../lib/CityContext'
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

const inputClass = 'fn-field'
const labelClass = 'fn-label'

export function RaceRegisterPage() {
  const { user, profile, loading } = useAuth()
  const city = useCity()
  const path = useCityPath()
  const citySlug = city.slug
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [teamName, setTeamName] = useState('')
  const [customTeam, setCustomTeam] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticket, setTicket] = useState<RaceRegistration | null>(null)
  const [usingLocal, setUsingLocal] = useState(false)

  // Auth-first when Supabase is live; unconfigured mode keeps the local fallback form.
  const needsSignIn = isSupabaseConfigured && !loading && !user
  const canShowForm =
    (!isSupabaseConfigured && !loading) ||
    (isSupabaseConfigured && !loading && Boolean(user))

  const accountEmail = user?.email?.trim().toLowerCase() ?? ''

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSupabaseConfigured && !user) {
      setError('Sign in to register for Season 2.')
      return
    }
    const squad = teamName.trim()
    if (!squad) {
      setError('Pick or enter your squad / micro-team name.')
      return
    }
    const resolvedEmail = (user?.email ?? email).trim().toLowerCase()
    if (!resolvedEmail) {
      setError('Email is required.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload = {
        event_slug: AMAZING_TRASH_RACE_S2,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: resolvedEmail,
        team_name: squad,
        ticket_code: generateTicketCode(),
        user_id: user?.id ?? null,
        city: citySlug,
      }

      if (!isSupabaseConfigured) {
        const row = addLocalRaceRegistration({
          full_name: payload.full_name,
          phone: payload.phone,
          email: payload.email,
          team_name: payload.team_name,
          user_id: payload.user_id,
          city: citySlug,
        })
        setUsingLocal(true)
        setTicket(row)
        return
      }

      // Authenticated path: user_id is always the signed-in account.
      const authenticatedPayload = { ...payload, user_id: user!.id }

      const { data, error: insErr } = await supabase
        .from('race_registrations')
        .insert(authenticatedPayload)
        .select('*')
        .single()

      if (insErr) {
        const row = addLocalRaceRegistration({
          full_name: authenticatedPayload.full_name,
          phone: authenticatedPayload.phone,
          email: authenticatedPayload.email,
          team_name: authenticatedPayload.team_name,
          user_id: authenticatedPayload.user_id,
          city: citySlug,
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
      .eq('city', citySlug)
      .eq('event_slug', AMAZING_TRASH_RACE_S2)
      .order('created_at', { ascending: false })
    if (qErr) {
      setError(qErr.message)
      return
    }
    exportRaceRegistrationsCsv((data ?? []) as RaceRegistration[])
  }

  const introAction = (
    <div className="flex flex-wrap gap-3">
      <ActionLink to={path('/race/leaderboard')} tone="light">
        Live leaderboard
      </ActionLink>
      {profile?.is_admin ? (
        <>
          <Link to={path('/race/admin')} className="fn-action fn-action-light">
            Admin · teams
          </Link>
          <Link to={path('/race/marshal')} className="fn-action fn-action-light">
            Marshal weights
          </Link>
        </>
      ) : null}
    </div>
  )

  return (
    <PublicShell>
      <main>
        <PageIntro
          eyebrow="Season 2"
          title="Amazing Trash Race"
          body="Register for a digital ticket, join a squad, and bring your code on race day."
          action={introAction}
        />
        <section className="mx-auto max-w-xl px-5 pb-20 sm:px-8 lg:px-12">
          {loading && isSupabaseConfigured && !ticket ? (
            <p className="text-sm text-[#5d746e]">Checking your account…</p>
          ) : needsSignIn && !ticket ? (
            <div className="rounded-[1.5rem] border border-[#d9e9e4] bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="text-sm leading-6 text-[#36564e]">
                Create an account to register for Season 2. Your ticket will be saved to your
                profile so it shows up under My impact.
              </p>
              <div className="mt-4">
                <SignInButton
                  variant="dark"
                  label="Sign in to register"
                  className="w-full"
                  authTitle="Register for Season 2"
                  authBlurb="Sign in with Google or email magic link. Your ticket will be saved to your profile under My impact."
                />
              </div>
            </div>
          ) : !ticket && canShowForm ? (
            <form onSubmit={submit} className="space-y-4">
              <label className={labelClass}>
                Full name
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
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
              <label className={labelClass}>
                Email
                {user ? (
                  <input
                    readOnly
                    type="email"
                    value={accountEmail}
                    className={`${inputClass} cursor-default opacity-80`}
                  />
                ) : (
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                )}
              </label>

              <div>
                <p className={labelClass}>Squad / micro-team *</p>
                <div className="mt-2 flex flex-wrap gap-2.5">
                  {RACE_TEAM_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setCustomTeam(false)
                        setTeamName(preset)
                      }}
                      className={`fn-chip-btn ${!customTeam && teamName === preset ? 'is-on' : ''}`}
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
                    className={`fn-chip-btn ${customTeam ? 'is-on' : ''}`}
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
                  <p className="mt-2 text-[11px] font-semibold text-[#8b6207]">Select a squad above.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={busy}
                className="fn-action fn-action-gold w-full justify-center disabled:opacity-50"
              >
                {busy ? 'Issuing ticket…' : 'Get my ticket'}
              </button>
              {error && <p className="text-sm font-semibold text-[#8b6207]">{error}</p>}
            </form>
          ) : ticket ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <RaceTicket3D
                code={ticket.ticket_code}
                holderName={ticket.full_name}
                teamName={ticket.team_name ?? undefined}
                cityLabel={city.chapterName}
              />
              <p className="mt-4 rounded-xl bg-[#eef6f2] px-4 py-3 text-xs leading-5 text-[#36564e]">
                Screenshot this ticket. On race day open the{' '}
                <Link to={path('/map')} className="font-bold text-[#0b8c76]">
                  Trash Map
                </Link>{' '}
                and watch the{' '}
                <Link to={path('/race/leaderboard')} className="font-bold text-[#0b8c76]">
                  live leaderboard
                </Link>
                .
              </p>
              {usingLocal && (
                <p className="mt-3 text-xs text-[#8b6207]">
                  Stored in this browser until migration 007 is applied on Supabase.
                </p>
              )}
              {user && (
                <p className="mt-3 text-xs text-[#0b8c76]">
                  Signed in — open{' '}
                  <Link to={path('/me')} className="font-bold underline">
                    My impact
                  </Link>{' '}
                  to see tickets linked to your account.
                </p>
              )}
              <button
                type="button"
                className="mt-4 text-sm font-bold text-[#0b8c76] underline"
                onClick={() => {
                  setTicket(null)
                  setError(null)
                }}
              >
                Register another person
              </button>
            </motion.div>
          ) : null}

          {profile?.is_admin && (
            <button
              type="button"
              onClick={() => void exportCsv()}
              className="mt-8 text-sm font-bold text-[#0b8c76] underline"
            >
              Export registrations CSV
            </button>
          )}
        </section>
      </main>
    </PublicShell>
  )
}
