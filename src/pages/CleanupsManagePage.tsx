import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthGate } from '../components/auth/AuthGate'
import { SiteFooter, SiteNav } from '../components/site/SiteNav'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Event } from '../types/database'

interface RsvpRow {
  id: string
  user_id: string
  status: string
  points_awarded: number
  profiles?: { username: string } | null
}

function ManageInner() {
  const { user, profile } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [rsvps, setRsvps] = useState<RsvpRow[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [points, setPoints] = useState(50)

  const loadEvents = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(40)
    setEvents((data ?? []) as Event[])
  }, [])

  const loadRsvps = useCallback(async (eventId: string) => {
    const { data, error } = await supabase
      .from('event_rsvps')
      .select('id, user_id, status, points_awarded, profiles(username)')
      .eq('event_id', eventId)
    if (error) {
      setStatus(error.message)
      setRsvps([])
      return
    }
    setRsvps((data ?? []) as unknown as RsvpRow[])
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void loadEvents()
  }, [loadEvents])

  useEffect(() => {
    if (selected) void loadRsvps(selected)
  }, [selected, loadRsvps])

  if (!profile?.is_admin) {
    return (
      <p className="rounded-xl border border-amber-400/30 p-4 text-sm text-amber-100">
        Admin only. Set <code>profiles.is_admin = true</code> for your account.
      </p>
    )
  }

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim() || !eventDate) return
    setStatus(null)
    const { error } = await supabase.from('events').insert({
      title: title.trim(),
      description: description.trim() || 'Weekly Fix Nairobi cleanup',
      location: location.trim() || 'Nairobi',
      event_date: new Date(eventDate).toISOString(),
      organizer_id: user.id,
      latitude: null,
      longitude: null,
    })
    if (error) {
      setStatus(error.message)
      return
    }
    setTitle('')
    setLocation('')
    setDescription('')
    setEventDate('')
    setStatus('Cleanup posted.')
    await loadEvents()
  }

  const award = async (userId: string) => {
    if (!selected) return
    setStatus(null)
    const { error } = await supabase.rpc('award_event_attendance', {
      p_event_id: selected,
      p_user_id: userId,
      p_points: points,
    })
    if (error) {
      setStatus(error.message + ' — ensure migration 010 is applied.')
      return
    }
    setStatus(`Awarded ${points} XP.`)
    await loadRsvps(selected)
  }

  return (
    <div className="space-y-8">
      {status && <p className="text-sm text-amber-200">{status}</p>}

      <form onSubmit={createEvent} className="space-y-3 rounded-2xl border border-white/10 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
          Post a cleanup
        </h2>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. CBD Saturday cleanup)"
          className="w-full rounded-lg border border-white/15 bg-[#0a1a17] px-3 py-2 text-white"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Place"
          className="w-full rounded-lg border border-white/15 bg-[#0a1a17] px-3 py-2 text-white"
        />
        <input
          required
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-[#0a1a17] px-3 py-2 text-white"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short note"
          rows={2}
          className="w-full rounded-lg border border-white/15 bg-[#0a1a17] px-3 py-2 text-white"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--fn-clear)] px-4 py-2 text-sm font-bold text-[#021a1a]"
        >
          Publish
        </button>
      </form>

      <div className="rounded-2xl border border-white/10 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
          Award points
        </h2>
        <label className="mt-3 block text-xs text-teal-200/80">
          Cleanup
          <select
            value={selected ?? ''}
            onChange={(e) => setSelected(e.target.value || null)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-[#0a1a17] px-3 py-2 text-white"
          >
            <option value="">Select…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} — {new Date(ev.event_date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-xs text-teal-200/80">
          XP per person
          <input
            type="number"
            min={1}
            max={500}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/15 bg-[#0a1a17] px-3 py-2 text-white"
          />
        </label>
        {selected && (
          <ul className="mt-4 space-y-2">
            {rsvps.length === 0 && (
              <li className="text-sm text-teal-100/60">No RSVPs yet for this cleanup.</li>
            )}
            {rsvps.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm"
              >
                <span>
                  {r.profiles?.username ?? r.user_id.slice(0, 8)} ·{' '}
                  <span className="capitalize text-teal-100/70">{r.status}</span>
                  {r.points_awarded > 0 && (
                    <span className="text-[var(--fn-clear)]"> · +{r.points_awarded}</span>
                  )}
                </span>
                {r.points_awarded === 0 && (
                  <button
                    type="button"
                    onClick={() => void award(r.user_id)}
                    className="text-xs font-bold text-[var(--fn-clear)] underline"
                  >
                    Mark attended + XP
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function CleanupsManagePage() {
  return (
    <div className="fn-landing min-h-full bg-[var(--fn-night,#0a192f)] text-[#e8f5f1]">
      <SiteNav />
      <main className="mx-auto max-w-xl px-4 py-12 md:px-6">
        <Link to="/cleanups" className="text-sm text-teal-300 hover:underline">
          ← Public cleanups
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-white">
          Cleanup admin
        </h1>
        <p className="mt-2 text-sm text-teal-100/70">
          Post weekly cleanups and award attendance points.
        </p>
        <div className="mt-8">
          <AuthGate>
            <ManageInner />
          </AuthGate>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
