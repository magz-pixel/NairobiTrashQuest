import { useCallback, useEffect, useState } from 'react'
import { AuthGate } from '../components/auth/AuthGate'
import { OpsFrame } from '../components/site/PagePrimitives'
import { useAuth } from '../hooks/useAuth'
import { useCity } from '../lib/CityContext'
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
  const { user, profile, loading } = useAuth()
  const city = useCity()
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
      .eq('city', city.slug)
      .order('event_date', { ascending: false })
      .limit(40)
    setEvents((data ?? []) as Event[])
  }, [city.slug])

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
    const t = window.setTimeout(() => {
      void loadEvents()
    }, 0)
    return () => window.clearTimeout(t)
  }, [loadEvents])

  useEffect(() => {
    if (!selected) return
    const t = window.setTimeout(() => {
      void loadRsvps(selected)
    }, 0)
    return () => window.clearTimeout(t)
  }, [selected, loadRsvps])

  if (loading) {
    return <p className="text-sm text-[#5d746e]">Checking admin access…</p>
  }

  if (!profile?.is_admin) {
    return (
      <p className="fn-warn">
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
      description: description.trim() || `Weekly ${city.chapterName} cleanup`,
      location: location.trim() || city.label,
      event_date: new Date(eventDate).toISOString(),
      organizer_id: user.id,
      latitude: null,
      longitude: null,
      city: city.slug,
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
      {status && <p className="text-sm font-semibold text-[#8b6207]">{status}</p>}

      <form onSubmit={createEvent} className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#063b32]">
          Post a cleanup
        </h2>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. CBD Saturday cleanup)"
          className="fn-field"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Place"
          className="fn-field"
        />
        <input
          required
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="fn-field"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short note"
          rows={2}
          className="fn-field"
        />
        <button type="submit" className="fn-action fn-action-gold justify-center">
          Publish
        </button>
      </form>

      <div className="rounded-[1.5rem] border border-[#d9e9e4] bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#063b32]">
          Award points
        </h2>
        <label className="fn-label mt-3">
          Cleanup
          <select
            value={selected ?? ''}
            onChange={(e) => setSelected(e.target.value || null)}
            className="fn-field"
          >
            <option value="">Select…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} — {new Date(ev.event_date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </label>
        <label className="fn-label mt-3">
          XP per person
          <input
            type="number"
            min={1}
            max={500}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="fn-field"
          />
        </label>
        {selected && (
          <ul className="mt-4 space-y-2">
            {rsvps.length === 0 && (
              <li className="text-sm text-[#71867f]">No RSVPs yet for this cleanup.</li>
            )}
            {rsvps.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f3f7f4] px-3 py-2 text-sm"
              >
                <span className="text-[#36564e]">
                  {r.profiles?.username ?? r.user_id.slice(0, 8)} ·{' '}
                  <span className="capitalize text-[#71867f]">{r.status}</span>
                  {r.points_awarded > 0 && (
                    <span className="font-bold text-[#0b8c76]"> · +{r.points_awarded}</span>
                  )}
                </span>
                {r.points_awarded === 0 && (
                  <button
                    type="button"
                    onClick={() => void award(r.user_id)}
                    className="text-xs font-bold text-[#0b8c76] underline"
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
    <OpsFrame
      title="Cleanup admin"
      eyebrow="Field ops"
      description="Post weekly cleanups and award attendance points."
      backTo="/cleanups"
    >
      <AuthGate>
        <ManageInner />
      </AuthGate>
    </OpsFrame>
  )
}
