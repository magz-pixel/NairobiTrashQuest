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
