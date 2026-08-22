import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SignInButton } from '../components/auth/SignInButton'
import { RaceTicket3D } from '../components/site/art/RaceTicket3D'
import { SiteFooter, SiteNav } from '../components/site/SiteNav'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { AMAZING_TRASH_RACE_S2, type Event, type RaceRegistration } from '../types/database'

interface EventRsvp {
  id: string
  event_id: string
  status: string
  points_awarded: number
  events?: Event | null
}

const BADGE = { scout: 'Scout', ranger: 'Ranger', guardian: 'Guardian' } as const

export function ImpactMePage() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const [tickets, setTickets] = useState<RaceRegistration[]>([])
  const [rsvps, setRsvps] = useState<EventRsvp[]>([])
  const [mapStats, setMapStats] = useState({ reports: 0, clears: 0 })
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return
    setBusy(true)
    try {
      const [{ data: regs }, { data: rsvpRows }, reportsRes, clearsRes] = await Promise.all([
        supabase
          .from('race_registrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('event_slug', AMAZING_TRASH_RACE_S2)
          .order('created_at', { ascending: false }),
        supabase
          .from('event_rsvps')
          .select('id, event_id, status, points_awarded, events(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('cleared_by', user.id),
      ])
      setTickets((regs ?? []) as RaceRegistration[])
      setRsvps((rsvpRows ?? []) as unknown as EventRsvp[])
      setMapStats({
        reports: reportsRes.count ?? 0,
        clears: clearsRes.count ?? 0,
      })
      await refreshProfile()
    } finally {
      setBusy(false)
    }
  }, [user, refreshProfile])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="fn-landing min-h-full bg-[var(--fn-night,#0a192f)] text-[#e8f5f1]">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-12 md:px-6 md:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--fn-clear,#00f2fe)]">
          Your impact · XPNC
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold text-white">
          My impact
        </h1>
        <p className="mt-3 text-teal-100/75">
          One account for the map, weekly cleanups, and the Amazing Trash Race.
        </p>

        {loading && <p className="mt-8 text-sm text-teal-100/60">Loading…</p>}

        {!loading && !user && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-teal-50/90">
              Join free to save points when you report trash, clean spots, or attend Fix
              Nairobi cleanups.
            </p>
            <div className="mt-4">
              <SignInButton variant="dark" label="Join / Sign in" />
            </div>
          </div>
        )}

        {user && (
          <div className="mt-8 space-y-6">
            <section className="rounded-2xl border border-[var(--fn-clear)]/25 bg-white/5 p-6">
              <p className="text-sm text-teal-100/70">{user.email}</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                {profile?.username ?? 'Cleaner'}
              </p>
              <p className="mt-1 text-sm capitalize text-teal-100/70">
                {profile ? BADGE[profile.badge_level] : 'Scout'} ·{' '}
                <strong className="text-[var(--fn-clear)]">
                  {profile?.total_impact_points ?? 0} XP
                </strong>
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-teal-100/80">
                <p>
                  Reports submitted{' '}
                  <strong className="text-white">{mapStats.reports}</strong>
                </p>
                <p>
                  Hotspots cleared{' '}
                  <strong className="text-white">{mapStats.clears}</strong>
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => void load()}
                  className="text-[var(--fn-clear)] underline"
                  disabled={busy}
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="text-teal-200/70 underline"
                >
                  Sign out
                </button>
                <Link to="/map" className="text-teal-200/70 underline">
                  Open map
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-orange-300/90">
                Cleanups attended
              </h2>
              {rsvps.length === 0 ? (
                <p className="mt-2 text-sm text-teal-100/60">
                  No cleanups yet.{' '}
                  <Link to="/cleanups" className="text-[var(--fn-clear)] underline">
                    See weekly cleanups
                  </Link>
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {rsvps.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-black/20 px-3 py-2 text-sm"
                    >
                      <span>
                        {(r.events as Event | null | undefined)?.title ?? 'Cleanup'} ·{' '}
                        <span className="capitalize text-teal-100/70">{r.status}</span>
                      </span>
                      {r.points_awarded > 0 && (
                        <span className="text-[var(--fn-clear)]">+{r.points_awarded} XP</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-orange-300/90">
                Trash Race tickets
              </h2>
              {tickets.length === 0 ? (
                <p className="mt-2 text-sm text-teal-100/60">
                  No Season 2 ticket on this account yet.{' '}
                  <Link to="/race" className="text-[var(--fn-clear)] underline">
                    Register free
                  </Link>
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {tickets.map((t) => (
                    <RaceTicket3D
                      key={t.id}
                      code={t.ticket_code}
                      holderName={t.full_name}
                      teamName={t.team_name ?? undefined}
                      compact
                    />
                  ))}
                </div>
              )}
              <p className="mt-4 text-xs text-teal-100/50">
                Medals and NFT shelf — coming after we trust weekly cleanup and race
                attendance on the ledger.
              </p>
            </section>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
