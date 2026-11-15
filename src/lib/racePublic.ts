import { supabase } from './supabase'

export interface PublicRegistration {
  id: string
  event_slug: string
  city: string | null
  team_name: string | null
  /** First name + last initial, e.g. "Andrew K." */
  display_name: string
  created_at: string
}

/**
 * Public, non-personal race sign-ups (migration 026 view). Never select phone/email for public UI.
 * Until 026 is run, falls back to the table but still only asks for non-contact columns.
 */
export async function fetchPublicRegistrations(eventSlug: string, city?: string) {
  let q = supabase
    .from('race_registrations_public')
    .select('id,event_slug,city,team_name,display_name,created_at')
    .eq('event_slug', eventSlug)
  if (city) q = q.eq('city', city)
  const res = await q.order('created_at', { ascending: false })
  if (!res.error) return { data: (res.data ?? []) as PublicRegistration[], error: null }

  let fb = supabase.from('race_registrations').select('id,event_slug,city,team_name,full_name,created_at').eq('event_slug', eventSlug)
  if (city) fb = fb.eq('city', city)
  const old = await fb.order('created_at', { ascending: false })
  if (old.error) return { data: null, error: old.error }
  const data = (old.data ?? []).map((r) => {
    const parts = String(r.full_name ?? '').trim().split(/\s+/)
    const display_name = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]?.toUpperCase()}.` : parts[0] ?? ''
    return { id: r.id, event_slug: r.event_slug, city: r.city, team_name: r.team_name, display_name, created_at: r.created_at } as PublicRegistration
  })
  return { data, error: null }
}
