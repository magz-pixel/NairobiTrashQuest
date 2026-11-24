import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AuthGate } from '../components/auth/AuthGate'
import { OpsFrame } from '../components/site/PagePrimitives'
import { useAuth } from '../hooks/useAuth'
import { useCity } from '../lib/CityContext'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Event } from '../types/database'
import { ReportPinMap } from '../components/reports/ReportPinMap'
import { getCurrentPosition } from '../lib/geo'
import { OrganizerApply } from '../components/organizers/OrganizerApply'
import { DocumentCleanup, OrganizerApplicationsQueue, OrganizerBadge } from '../components/organizers/OrganizerPieces'

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
  const isAdmin = Boolean(profile?.is_admin)
  // "Organise a cleanup here" on a hotspot links here with ?report=<id>&place=<name>.
  const [params] = useSearchParams()
  const reportId = params.get('report')
  const place = params.get('place')
  const [events, setEvents] = useState<Event[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [rsvps, setRsvps] = useState<RsvpRow[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [title, setTitle] = useState(() => (place ? `Cleanup at ${place}` : ''))
  const [location, setLocation] = useState(() => place ?? '')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [points, setPoints] = useState(50)
  const [expected, setExpected] = useState('')

  // Admins manage every cleanup in the city; everyone else manages the ones they organise.
  const loadEvents = useCallback(async () => {
    let q = supabase.from('events').select('*').eq('city', city.slug)
    if (!isAdmin && user) q = q.eq('organizer_id', user.id)
    const { data } = await q.order('event_date', { ascending: false }).limit(40)
    setEvents((data ?? []) as Event[])
  }, [city.slug, isAdmin, user])

  // Pre-place the meeting pin on the hotspot being cleaned.
  useEffect(() => {
    if (!reportId || !isSupabaseConfigured) return
    let cancelled = false
    void supabase
      .from('reports')
      .select('latitude,longitude')
      .eq('id', reportId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setPin({ lat: data.latitude as number, lng: data.longitude as number })
      })
    return () => {
      cancelled = true
    }
  }, [reportId])

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

  // Removes the cleanup from the map and lists; its RSVPs go with it (on delete cascade). Needs migration 027.
  const deleteCleanup = async (eventId: string) => {
    const ev = events.find((e) => e.id === eventId)
    const going = rsvps.length
    const ok = window.confirm(
      `Delete "${ev?.title ?? 'this cleanup'}"?

It disappears from the map, feed and cleanups page${going ? `, and ${going} RSVP${going === 1 ? '' : 's'} are removed` : ''}. This can't be undone.`,
    )
    if (!ok) return
    const { error, count } = await supabase.from('events').delete({ count: 'exact' }).eq('id', eventId)
    if (error || !count) {
      setStatus(error?.message ?? 'Delete was blocked. Run migration 027 in Supabase so admins can delete cleanups.')
      return
    }
    setSelected(null)
    setRsvps([])
    setStatus('Cleanup deleted.')
    void loadEvents()
  }

  if (loading) {
    return <p className="text-sm text-[#5d746e]">Loading your account…</p>
  }

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim() || !eventDate) return
    setStatus(null)
    const row = {
      title: title.trim(),
      description: description.trim() || (place ? `Community cleanup of the ${place} hotspot` : `${city.chapterName} community cleanup`),
      location: location.trim() || city.label,
      event_date: new Date(eventDate).toISOString(),
      organizer_id: user.id,
      latitude: pin?.lat ?? null,
      longitude: pin?.lng ?? null,
      city: city.slug,
      ...(expected ? { expected_participants: Number(expected) } : {}),
    }
    const linked: Record<string, unknown> = reportId ? { ...row, report_id: reportId } : row
    let { error } = await supabase.from('events').insert(linked)
    // Before migration 031 the report link column doesn't exist: post without it.
    if (error && reportId && /report_id/.test(error.message)) ({ error } = await supabase.from('events').insert(row))
    if (error) {
      setStatus(error.message)
      return
    }
    setTitle('')
    setLocation('')
    setDescription('')
    setEventDate('')
    setStatus(pin ? 'Cleanup posted — it now shows on the map.' : 'Cleanup posted (no map pin).')
    setPin(null)
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

  // Edwin's rule: anyone can report and join; only verified organisers (or admins) publish cleanups.
  const canPost = isAdmin || profile?.organizer_status === 'verified'
  if (!canPost) return <OrganizerApply />

  const selectedEvent = events.find((ev) => ev.id === selected) ?? null
  // Started already (the database also only accepts results for cleanups that have begun).
  const finished = selectedEvent ? selectedEvent.event_date < new Date().toISOString() : false

  return (
    <div className="space-y-8">
      {status && <p className="text-sm font-semibold text-[#8b6207]">{status}</p>}
      {isAdmin ? <OrganizerApplicationsQueue /> : null}
      {user ? <OrganizerBadge organizerId={user.id} /> : null}

      <form onSubmit={createEvent} className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#063b32]">
          {place ? `Organise a cleanup at ${place}` : 'Post a cleanup'}
        </h2>
        <p className="text-sm text-[#5d746e]">
          Anyone can organise a cleanup. It appears on the map and feed so neighbours can join. Keep it real: cleanups
          flagged by 3 people are hidden until we review them.
        </p>
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
        <div className="rounded-xl border border-[#d9e9e4] bg-[#f8fbf9] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#063b32]">Meeting point on the map</p>
            {pin ? (
              <button type="button" onClick={() => setPin(null)} className="text-xs font-bold text-[#a44738]">
                Remove pin
              </button>
            ) : null}
          </div>
          {pin ? (
            <>
              <div className="mt-2 overflow-hidden rounded-lg">
                <ReportPinMap lat={pin.lat} lng={pin.lng} onChange={(lat, lng) => setPin({ lat, lng })} />
              </div>
              <p className="mt-1 text-xs text-[#71867f]">Drag the pin to where people should meet.</p>
            </>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="fn-chip-btn"
                onClick={() =>
                  void getCurrentPosition()
                    .then((p) => setPin({ lat: p.coords.latitude, lng: p.coords.longitude }))
                    .catch(() => setStatus('Could not read your location — drop the pin from the city centre instead.'))
                }
              >
                📍 Use my location
              </button>
              <button
                type="button"
                className="fn-chip-btn"
                onClick={() => setPin({ lat: city.center.lat, lng: city.center.lng })}
              >
                🗺️ Drop pin in {city.label}
              </button>
            </div>
          )}
          <p className="mt-2 text-xs text-[#71867f]">With a pin, the cleanup appears on the public map.</p>
        </div>
        <input
          type="number"
          min={1}
          max={5000}
          inputMode="numeric"
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          placeholder="Expected participants (e.g. 25)"
          className="fn-field"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What to bring, where to meet, what you'll clean"
          rows={2}
          className="fn-field"
        />
        <button type="submit" className="fn-action fn-action-gold justify-center">
          Publish
        </button>
      </form>

      <div className="rounded-[1.5rem] border border-[#d9e9e4] bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#063b32]">
          {isAdmin ? 'Your cleanups & attendance' : 'Your cleanups'}
        </h2>
        {!isAdmin ? (
          <p className="mt-1 text-xs text-[#71867f]">Pick one of your cleanups to see who's coming, or delete it.</p>
        ) : null}
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
        {selected ? (
          <button
            type="button"
            onClick={() => void deleteCleanup(selected)}
            className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-[#f2c4bb] bg-white px-4 text-sm font-bold text-[#a44738] hover:bg-[#fff4f1]"
          >
            Delete this cleanup
          </button>
        ) : null}
        {isAdmin ? (
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
        ) : null}
        {selected && finished && user && selectedEvent && selectedEvent.organizer_id === user.id ? (
          <DocumentCleanup eventId={selected} organizerId={user.id} onDone={() => setStatus('Cleanup documented. Thank you!')} />
        ) : null}
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
                {isAdmin && r.points_awarded === 0 && (
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
      title="Organise a cleanup"
      eyebrow="Community"
      description="Post a cleanup anyone can join, invite neighbours, and manage your events."
      backTo="/cleanups"
    >
      <AuthGate>
        <ManageInner />
      </AuthGate>
    </OpsFrame>
  )
}
