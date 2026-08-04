import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SignInButton } from '../components/auth/SignInButton'
import { AmazingTrashRaceCard } from '../components/cleanups/AmazingTrashRaceCard'
import { SiteFooter, SiteNav } from '../components/site/SiteNav'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Event } from '../types/database'

export function CleanupsPage() {
  const { user, profile } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [myGoing, setMyGoing] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setStatus(null)
    if (!isSupabaseConfigured) {
      setEvents([])
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date(Date.now() - 86400000).toISOString())
      .order('event_date', { ascending: true })
    if (error) {
      setStatus(error.message)
      setEvents([])
    } else {
      setEvents((data ?? []) as Event[])
    }

    if (user) {
      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('event_id')
        .eq('user_id', user.id)
        .in('status', ['going', 'attended'])
      setMyGoing(new Set((rsvps ?? []).map((r) => r.event_id as string)))
    } else {
      setMyGoing(new Set())
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  const rsvp = async (eventId: string) => {
    if (!user) {
      setStatus('Sign in to RSVP.')
      return
    }
    setStatus(null)
    const { error } = await supabase.from('event_rsvps').upsert(
      {
        event_id: eventId,
        user_id: user.id,
        status: 'going',
      },
      { onConflict: 'event_id,user_id' },
    )
    if (error) {
      setStatus(error.message + ' — run migration 010 if table is missing.')
      return
    }
    setMyGoing((prev) => new Set(prev).add(eventId))
    setStatus('You’re on the list. See you on cleanup day!')
  }

  return (
    <div className="fn-landing min-h-full bg-[var(--fn-night,#0a192f)] text-[#e8f5f1]">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-12 md:px-6 md:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--fn-pin,#ff6b00)]">
          Fix Nairobi · events
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold text-white">
          Cleanups
        </h1>
        <p className="mt-3 text-teal-100/75">
          Weekly Fix Nairobi cleanups plus the Amazing Trash Race. Join a day out, or register
          for Season 2 online.
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {profile?.is_admin && (
            <Link to="/cleanups/manage" className="text-[var(--fn-clear)] underline">
              Team: post a cleanup
            </Link>
          )}
          <Link to="/me" className="text-teal-200/80 underline">
            My impact
          </Link>
          <Link to="/race" className="text-teal-200/80 underline">
            Race ticket
          </Link>
        </div>

        {status && <p className="mt-4 text-sm text-amber-200">{status}</p>}

        <div className="mt-8">
          <AmazingTrashRaceCard />
        </div>

        <h2 className="mt-10 text-sm font-bold uppercase tracking-[0.18em] text-teal-200/80">
          Other cleanups
        </h2>

        {loading && <p className="mt-4 text-sm text-teal-100/60">Loading weekly list…</p>}

        {!loading && events.length === 0 && (
          <p className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-teal-100/70">
            No extra weekly cleanups posted yet. Edwin will add them here; Season 2 is featured
            above.
          </p>
        )}

        <ul className="mt-4 space-y-4">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <h2 className="text-lg font-bold text-white">{ev.title}</h2>
              <p className="mt-1 text-xs text-teal-100/70">
                {new Date(ev.event_date).toLocaleString()} · {ev.location}
              </p>
              {ev.description && (
                <p className="mt-2 text-sm text-teal-50/85">{ev.description}</p>
              )}
              <div className="mt-4">
                {!user ? (
                  <SignInButton variant="dark" label="Sign in to RSVP" />
                ) : myGoing.has(ev.id) ? (
                  <span className="text-sm font-semibold text-[var(--fn-clear)]">
                    You’re signed up
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void rsvp(ev.id)}
                    className="rounded-lg bg-[var(--fn-clear)] px-4 py-2 text-sm font-bold text-[#021a1a]"
                  >
                    I’ll be there
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  )
}
