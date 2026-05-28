export type ReportStatus = 'active' | 'verified_cleared'
export type BadgeLevel = 'scout' | 'ranger' | 'guardian'

export interface Profile {
  id: string
  username: string
  total_impact_points: number
  badge_level: BadgeLevel
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  user_id: string
  latitude: number
  longitude: number
  severity_score: number
  status: ReportStatus
  image_url: string
  ai_tags: string[]
  cleared_image_url: string | null
  cleared_at: string | null
  created_at: string
  updated_at: string
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
