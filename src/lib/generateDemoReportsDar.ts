import type { Report, ReportStatus } from '../types/database'
import { demoReportDefaults } from './reportDefaults'

const DEMO_USER = '00000000-0000-4000-8000-000000000001'

const demoImg = (name: string) => `/demo/${name}`

const DIRTY = {
  street1: demoImg('dirty-street-1.jpg'),
  street2: demoImg('dirty-street-2.jpg'),
  street3: demoImg('dirty-street-3.jpg'),
  market: demoImg('dirty-market.jpg'),
  riverbank: demoImg('dirty-riverbank.jpg'),
} as const

const CLEARED = {
  before: demoImg('cleared-before.png'),
  after: demoImg('cleared-after.png'),
} as const

/**
 * Curated Dar es Salaam hotspots for Ramani Taka demo.
 * Mix: fully funded, partial funding, active, and verified_cleared.
 */
const CURATED_HOTSPOTS: {
  id: string
  area_name: string
  ward_id: string
  latitude: number
  longitude: number
  severity_score: number
  status: ReportStatus
  waste_type: string
  ai_tags: string[]
  image_url: string
  cleared_image_url?: string
  daysAgo: number
  clearedDaysAgo?: number
  funding_goal_tzs?: number
  funding_raised_tzs?: number
  funding_contributors?: number
}[] = [
  // Fully funded (awaiting cleanup)
  {
    id: 'demo-dar-001',
    area_name: 'Kariakoo Market',
    ward_id: 'kariakoo',
    latitude: -6.822,
    longitude: 39.275,
    severity_score: 10,
    status: 'active',
    waste_type: 'Market overflow',
    ai_tags: ['market', 'overflow', 'plastic-bags'],
    image_url: DIRTY.market,
    daysAgo: 14,
    funding_goal_tzs: 50_000,
    funding_raised_tzs: 50_000,
    funding_contributors: 28,
  },
  {
    id: 'demo-dar-002',
    area_name: 'Ubungo Roundabout',
    ward_id: 'ubungo',
    latitude: -6.788,
    longitude: 39.218,
    severity_score: 9,
    status: 'active',
    waste_type: 'Roadside dump',
    ai_tags: ['roadside', 'bags', 'traffic'],
    image_url: DIRTY.street2,
    daysAgo: 11,
    funding_goal_tzs: 40_000,
    funding_raised_tzs: 40_000,
    funding_contributors: 19,
  },
  // Partially funded
  {
    id: 'demo-dar-003',
    area_name: 'Mwenge Bus Stand',
    ward_id: 'kinondoni',
    latitude: -6.772,
    longitude: 39.262,
    severity_score: 8,
    status: 'active',
    waste_type: 'Street litter',
    ai_tags: ['bus-stand', 'plastic', 'street'],
    image_url: DIRTY.street1,
    daysAgo: 8,
    funding_goal_tzs: 35_000,
    funding_raised_tzs: 12_000,
    funding_contributors: 9,
  },
  {
    id: 'demo-dar-004',
    area_name: 'Tabata Roadside',
    ward_id: 'ilala',
    latitude: -6.835,
    longitude: 39.248,
    severity_score: 7,
    status: 'active',
    waste_type: 'Mixed waste',
    ai_tags: ['roadside', 'organic', 'bags'],
    image_url: DIRTY.street3,
    daysAgo: 6,
    funding_goal_tzs: 30_000,
    funding_raised_tzs: 18_000,
    funding_contributors: 14,
  },
  {
    id: 'demo-dar-005',
    area_name: 'Posta CBD',
    ward_id: 'ilala',
    latitude: -6.816,
    longitude: 39.288,
    severity_score: 6,
    status: 'active',
    waste_type: 'Plastic bottles',
    ai_tags: ['cbd', 'bottles', 'sidewalk'],
    image_url: DIRTY.street1,
    daysAgo: 4,
    funding_goal_tzs: 25_000,
    funding_raised_tzs: 8_500,
    funding_contributors: 6,
  },
  {
    id: 'demo-dar-006',
    area_name: 'Oyster Bay Drain',
    ward_id: 'oyster-bay',
    latitude: -6.755,
    longitude: 39.282,
    severity_score: 9,
    status: 'active',
    waste_type: 'Drain blockage',
    ai_tags: ['drain', 'plastic', 'flood'],
    image_url: DIRTY.riverbank,
    daysAgo: 16,
    funding_goal_tzs: 60_000,
    funding_raised_tzs: 22_000,
    funding_contributors: 11,
  },
  // Active without funding goal (optional small goals)
  {
    id: 'demo-dar-007',
    area_name: 'Kigamboni Ferry Approach',
    ward_id: 'kigamboni',
    latitude: -6.822,
    longitude: 39.318,
    severity_score: 8,
    status: 'active',
    waste_type: 'River bank dump',
    ai_tags: ['ferry', 'plastic', 'bank'],
    image_url: DIRTY.riverbank,
    daysAgo: 10,
    funding_goal_tzs: 45_000,
    funding_raised_tzs: 0,
    funding_contributors: 0,
  },
  {
    id: 'demo-dar-008',
    area_name: 'Temeke Market Lane',
    ward_id: 'temeke',
    latitude: -6.855,
    longitude: 39.268,
    severity_score: 7,
    status: 'active',
    waste_type: 'Food waste',
    ai_tags: ['market', 'organic', 'food'],
    image_url: DIRTY.market,
    daysAgo: 5,
    funding_goal_tzs: 28_000,
    funding_raised_tzs: 0,
    funding_contributors: 0,
  },
  {
    id: 'demo-dar-009',
    area_name: 'Kinondoni — Morocco Rd',
    ward_id: 'kinondoni',
    latitude: -6.778,
    longitude: 39.255,
    severity_score: 5,
    status: 'active',
    waste_type: 'Street litter',
    ai_tags: ['street', 'plastic', 'cans'],
    image_url: DIRTY.street2,
    daysAgo: 3,
    funding_goal_tzs: 20_000,
    funding_raised_tzs: 0,
    funding_contributors: 0,
  },
  // Verified cleared
  {
    id: 'demo-dar-010',
    area_name: 'Ilala — Bibi Titi Rd',
    ward_id: 'ilala',
    latitude: -6.812,
    longitude: 39.278,
    severity_score: 8,
    status: 'verified_cleared',
    waste_type: 'Street litter',
    ai_tags: ['street', 'plastic', 'drain'],
    image_url: CLEARED.before,
    cleared_image_url: CLEARED.after,
    daysAgo: 18,
    clearedDaysAgo: 3,
  },
  {
    id: 'demo-dar-011',
    area_name: 'Kariakoo — Msimbazi St',
    ward_id: 'kariakoo',
    latitude: -6.825,
    longitude: 39.272,
    severity_score: 7,
    status: 'verified_cleared',
    waste_type: 'Market overflow',
    ai_tags: ['market', 'bags', 'organic'],
    image_url: CLEARED.before,
    cleared_image_url: CLEARED.after,
    daysAgo: 12,
    clearedDaysAgo: 2,
  },
  {
    id: 'demo-dar-012',
    area_name: 'Ubungo — Morogoro Rd',
    ward_id: 'ubungo',
    latitude: -6.792,
    longitude: 39.225,
    severity_score: 6,
    status: 'verified_cleared',
    waste_type: 'Mixed waste',
    ai_tags: ['roadside', 'bags', 'sidewalk'],
    image_url: CLEARED.before,
    cleared_image_url: CLEARED.after,
    daysAgo: 20,
    clearedDaysAgo: 4,
  },
]

export function generateDemoReportsDar(): Report[] {
  const now = Date.now()

  return CURATED_HOTSPOTS.map((spot) => {
    const created = new Date(now - spot.daysAgo * 86_400_000).toISOString()
    const clearedAt =
      spot.status === 'verified_cleared' && spot.clearedDaysAgo != null
        ? new Date(now - spot.clearedDaysAgo * 86_400_000).toISOString()
        : null
    const updatedAt = clearedAt ?? created

    return demoReportDefaults({
      id: spot.id,
      user_id: DEMO_USER,
      latitude: spot.latitude,
      longitude: spot.longitude,
      severity_score: spot.severity_score,
      status: spot.status,
      image_url: spot.image_url,
      ai_tags: spot.ai_tags,
      cleared_image_url: spot.cleared_image_url ?? null,
      cleared_at: clearedAt,
      created_at: created,
      updated_at: updatedAt,
      area_name: spot.area_name,
      ward_id: spot.ward_id,
      waste_type: spot.waste_type,
      funding_goal_tzs: spot.funding_goal_tzs,
      funding_raised_tzs: spot.funding_raised_tzs,
      funding_contributors: spot.funding_contributors,
    })
  })
}
