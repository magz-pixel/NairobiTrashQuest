/**
 * Verified community organisers (migration 031).
 *   apply → team reviews → verified → can post cleanups → documents each cleanup → track record.
 * "Trusted" = verified + 3 documented cleanups. Organisers must document a finished cleanup within
 * 7 days before posting another (enforced in the database).
 */
import { supabase } from './supabase'

export type OrganizerStatus = 'pending' | 'verified' | 'declined' | null

export interface OrganizerApplication {
  user_id: string
  full_name: string
  phone: string
  city: string
  neighbourhood: string
  motivation: string
  experience: string | null
  links: string | null
  status: 'pending' | 'approved' | 'declined'
  admin_note: string | null
  created_at: string
}

export interface OrganizerStats {
  organizer_id: string
  username: string
  organizer_status: OrganizerStatus
  cleanups_held: number
  documented: number
  people_mobilised: number
  kg_collected: number
  bags_collected: number
  trusted: boolean
}

export interface EventReport {
  event_id: string
  organizer_id: string
  before_url: string | null
  after_url: string
  attendees: number
  bags: number | null
  kg: number | null
  notes: string | null
  created_at: string
}

export const TRUSTED_AFTER = 3

export async function myApplication(userId: string) {
  const { data } = await supabase.from('organizer_applications').select('*').eq('user_id', userId).maybeSingle()
  return (data as OrganizerApplication | null) ?? null
}

export async function applyAsOrganizer(input: Omit<OrganizerApplication, 'status' | 'admin_note' | 'created_at'>, reapply: boolean) {
  const row = { ...input, status: 'pending' as const }
  const { error } = reapply
    ? await supabase.from('organizer_applications').update(row).eq('user_id', input.user_id)
    : await supabase.from('organizer_applications').insert(row)
  if (error) throw error
}

export async function pendingApplications() {
  const { data, error } = await supabase.from('organizer_applications').select('*').eq('status', 'pending').order('created_at')
  if (error) return []
  return data as OrganizerApplication[]
}

export async function reviewApplication(userId: string, approve: boolean, note?: string) {
  const { error } = await supabase.rpc('review_organizer_application', { p_user: userId, p_approve: approve, p_note: note?.trim() || null })
  if (error) throw error
}

export async function organizerStats(organizerId: string) {
  const { data } = await supabase.from('organizer_stats').select('*').eq('organizer_id', organizerId).maybeSingle()
  if (!data) return null
  const d = data as OrganizerStats
  return { ...d, kg_collected: Number(d.kg_collected), people_mobilised: Number(d.people_mobilised) }
}

export async function eventReport(eventId: string) {
  const { data } = await supabase.from('event_reports').select('*').eq('event_id', eventId).maybeSingle()
  return (data as EventReport | null) ?? null
}

export async function submitEventReport(r: Omit<EventReport, 'created_at'>) {
  const { error } = await supabase.from('event_reports').upsert(r, { onConflict: 'event_id' })
  if (error) throw error
}
