export type ReportStatus =
  | 'pending'
  | 'active'
  | 'verified_cleared'
  | 'flagged'
  | 'rejected'

export type BadgeLevel = 'scout' | 'ranger' | 'guardian'

export interface Profile {
  id: string
  username: string
  total_impact_points: number
  badge_level: BadgeLevel
  is_admin?: boolean
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  user_id: string | null
  latitude: number
  longitude: number
  severity_score: number
  status: ReportStatus
  image_url: string
  ai_tags: string[]
  cleared_image_url: string | null
  cleared_at: string | null
  cleared_by: string | null
  waste_type: string | null
  seen_count: number
  flag_count: number
  approved_at: string | null
  rejected_reason: string | null
  ward_id: string | null
  area_name: string | null
  is_anonymous: boolean
  created_at: string
  updated_at: string
  /** Demo / Ramani Taka only — crowd-funded cleanup goal (TZS). */
  funding_goal_tzs?: number
  funding_raised_tzs?: number
  funding_contributors?: number
}

export interface Ward {
  id: string
  name: string
  sub_county: string
  constituency: string | null
}

export interface Official {
  id: string
  name: string
  role: string
  contact_email: string | null
  contact_phone: string | null
  photo_url: string | null
}

export interface Mission {
  id: string
  title: string
  description: string
  reward_points: number
  target_count: number
  mission_type: 'report' | 'verify' | 'cleanup_log' | 'corroborate'
  active: boolean
}

export interface UserMission {
  id: string
  user_id: string
  mission_id: string
  progress: number
  completed_at: string | null
  created_at: string
}

export interface Event {
  id: string
  title: string
  description: string
  location: string
  latitude: number | null
  longitude: number | null
  event_date: string
  organizer_id: string
  created_at: string
}

export type EventRsvpStatus = 'going' | 'attended' | 'cancelled'

export interface EventRsvp {
  id: string
  event_id: string
  user_id: string
  status: EventRsvpStatus
  points_awarded: number
  created_at: string
}

export interface TrashAnalysis {
  is_trash: boolean
  severity: number
  tags: string[]
  is_safe?: boolean
  confidence?: number
  moderation_action?: 'approve' | 'review' | 'reject'
}

export interface ClearVerification {
  is_cleared: boolean
  matches_location: boolean
  confidence: number
}

export interface CleanupLog {
  id: string
  user_id: string
  hours: number
  kg: number
  eco_multiplier: number
  impact_points: number
  location_text: string | null
  latitude: number | null
  longitude: number | null
  before_image_url: string | null
  after_image_url: string | null
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  title: string
  body: string
  before_image_url: string | null
  after_image_url: string | null
  created_at: string
}

export interface ReportStats {
  total: number
  active: number
  resolved: number
  pending: number
  flagged: number
  resolutionRate: number
  worstAreas: { area: string; count: number }[]
}

export type SeverityFilter = 'all' | 'low' | 'moderate' | 'high' | 'critical'
export type StatusFilter = 'all' | 'active' | 'pending' | 'verified_cleared' | 'flagged'

export type FundEntryKind = 'donation' | 'expense'

export interface FundEntry {
  id: string
  kind: FundEntryKind
  amount_kes: number
  donor_or_payee: string
  note: string | null
  voided: boolean
  created_by: string | null
  created_at: string
}

export interface RaceRegistration {
  id: string
  event_slug: string
  full_name: string
  phone: string
  email: string
  team_name: string | null
  ticket_code: string
  user_id: string | null
  created_at: string
}

export type WasteCategory = 'plastic' | 'organic' | 'mixed' | 'other'

export interface RaceWeightLog {
  id: string
  event_slug: string
  team_name: string
  kg: number
  waste_category: WasteCategory
  logged_by: string | null
  created_at: string
}

export type RaceHotspotStatus = 'active' | 'cleared'

export interface RaceHotspot {
  id: string
  event_slug: string
  latitude: number
  longitude: number
  label: string
  point_value: number
  is_ghost_spot: boolean
  /** When true, map UI shows crowd-funded cleanup styling and demo funding panel. */
  is_funded: boolean
  reference_image_url: string | null
  /** Landmark first, extra angles after. Empty on older single-photo pins. */
  gallery_image_urls?: string[] | null
  status: RaceHotspotStatus
  cleared_by_team_name: string | null
  cleared_at: string | null
  created_at: string
}

export const AMAZING_TRASH_RACE_S2 = 'amazing-trash-race-s2'

/** Registration and map-visibility windows for a trash-race season (Nairobi local dates). */
export interface RaceSeasonWindow {
  slug: string
  label: string
  registrationOpens: Date
  registrationCloses: Date
  hotspotsVisibleFrom: Date
  hotspotsVisibleUntil: Date
}

export const RACE_SEASONS: Record<string, RaceSeasonWindow> = {
  [AMAZING_TRASH_RACE_S2]: {
    slug: AMAZING_TRASH_RACE_S2,
    label: 'Season 2',
    registrationOpens: new Date('2026-01-01T00:00:00+03:00'),
    registrationCloses: new Date('2026-08-15T23:59:59+03:00'),
    hotspotsVisibleFrom: new Date('2026-08-15T06:00:00+03:00'),
    hotspotsVisibleUntil: new Date('2026-08-15T20:00:00+03:00'),
  },
}

/**
 * Slug of the season currently open for registration, or null between seasons.
 * Set to the next season slug when registration opens — no landing-page edits needed.
 */
export const LIVE_RACE_REGISTRATION_SLUG: string | null = null

/**
 * Slug of the season whose hotspots may appear on the public map, or null off-season.
 * Set when the race map window opens — no hook edits needed.
 */
export const LIVE_RACE_MAP_SLUG: string | null = null

export function isRaceLive(now = new Date()): boolean {
  if (!LIVE_RACE_REGISTRATION_SLUG) return false
  const season = RACE_SEASONS[LIVE_RACE_REGISTRATION_SLUG]
  if (!season) return false
  return now >= season.registrationOpens && now <= season.registrationCloses
}

export function isRaceMapActive(now = new Date()): boolean {
  if (!LIVE_RACE_MAP_SLUG) return false
  const season = RACE_SEASONS[LIVE_RACE_MAP_SLUG]
  if (!season) return false
  return now >= season.hotspotsVisibleFrom && now <= season.hotspotsVisibleUntil
}
