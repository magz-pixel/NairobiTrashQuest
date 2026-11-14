import { supabase, isSupabaseConfigured } from './supabase'
import type { Event } from '../types/database'

/** Events stay "upcoming" for a few hours after their start so a live cleanup still shows on the map. */
const STILL_ON_MS = 4 * 60 * 60 * 1000

export async function fetchUpcomingEvents(citySlug: string): Promise<Event[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('city', citySlug)
    .gte('event_date', new Date(Date.now() - STILL_ON_MS).toISOString())
    .order('event_date', { ascending: true })
    .limit(30)
  if (error) return []
  return (data ?? []) as Event[]
}

/**
 * Public "N going" counts. RSVP rows are private (RLS), so this goes through the
 * event_going_counts RPC (migration 022). Until that migration runs, counts are simply hidden.
 */
export async function fetchGoingCounts(eventIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (!isSupabaseConfigured || eventIds.length === 0) return counts
  const { data, error } = await supabase.rpc('event_going_counts', { p_event_ids: eventIds })
  if (error || !Array.isArray(data)) return counts
  for (const id of eventIds) counts.set(id, 0) // the RPC only returns events with at least one RSVP
  for (const row of data as { event_id: string; going: number }[]) counts.set(row.event_id, Number(row.going) || 0)
  return counts
}

export async function fetchMyGoing(userId: string, eventIds: string[]): Promise<Set<string>> {
  if (!isSupabaseConfigured || eventIds.length === 0) return new Set()
  const { data } = await supabase
    .from('event_rsvps')
    .select('event_id')
    .eq('user_id', userId)
    .in('event_id', eventIds)
    .in('status', ['going', 'attended'])
  return new Set((data ?? []).map((r) => r.event_id as string))
}

export async function setGoing(eventId: string, userId: string, going: boolean): Promise<string | null> {
  const { error } = await supabase
    .from('event_rsvps')
    .upsert(
      { event_id: eventId, user_id: userId, status: going ? 'going' : 'cancelled' },
      { onConflict: 'event_id,user_id' },
    )
  return error ? error.message : null
}

export function hasPin(e: Event): e is Event & { latitude: number; longitude: number } {
  return typeof e.latitude === 'number' && typeof e.longitude === 'number'
}

export function isHappeningNow(e: Event): boolean {
  const start = new Date(e.event_date).getTime()
  return Date.now() >= start && Date.now() < start + STILL_ON_MS
}

/** "Sat 22 Nov · 9:00 am" in the viewer's locale/time zone. */
export function formatEventWhen(iso: string): string {
  const d = new Date(iso)
  const day = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time}`
}

/** Short badge for the map pin: "SAT 22". */
export function eventPinLabel(iso: string): { dow: string; day: string } {
  const d = new Date(iso)
  return {
    dow: d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
    day: String(d.getDate()),
  }
}

export function relativeDays(iso: string): string {
  const start = new Date(iso)
  const today = new Date()
  const days = Math.round(
    (new Date(start.toDateString()).getTime() - new Date(today.toDateString()).getTime()) / 86400000,
  )
  if (days <= 0) return isHappeningNow({ event_date: iso } as Event) ? 'Happening now' : 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 7) return `In ${days} days`
  return `In ${Math.round(days / 7)} week${days >= 14 ? 's' : ''}`
}

/** Google Calendar "add event" link (2-hour default slot). */
export function calendarUrl(e: Event, pageUrl: string): string {
  const start = new Date(e.event_date)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', e.title)
  url.searchParams.set('dates', `${fmt(start)}/${fmt(end)}`)
  url.searchParams.set('location', e.location)
  url.searchParams.set('details', `${e.description}\n\n${pageUrl}`)
  return url.toString()
}

export function whatsappShareUrl(e: Event, pageUrl: string): string {
  const text = `🧹 ${e.title}\n📅 ${formatEventWhen(e.event_date)}\n📍 ${e.location}\n\nJoin us on Ramani-Taka: ${pageUrl}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function directionsUrl(e: Event): string | null {
  if (!hasPin(e)) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${e.latitude},${e.longitude}`
}
