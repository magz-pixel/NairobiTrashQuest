import type { Report, ReportStatus } from '../types/database'
import { isRamaniMarket } from './marketConfig'
import { generateDemoReportsDar } from './generateDemoReportsDar'
import { demoReportDefaults } from './reportDefaults'

const DEMO_USER = '00000000-0000-4000-8000-000000000001'

/**
 * Semantic demo photo library in public/demo/ (Wikimedia Commons, CC-licensed).
 * Visually verified: littered streets vs street-cleaning "after" shots.
 *   dirty-street-1  — NYC trash on sidewalk (Jess Hawsor, CC BY-SA 4.0)
 *   dirty-street-2  — Garbage.jpeg litter pile (Mtaware, CC BY-SA 4.0)
 *   dirty-street-3  — Roadside_Litter.jpg (Tequask, CC BY-SA 4.0)
 *   dirty-market    — same as dirty-street-2 (market overflow)
 *   dirty-riverbank — Water-borne litter, Salem India (CC BY 3.0)
 *   cleared-before  — user-provided dirty street (standard for all cleared pins)
 *   cleared-after   — user-provided clean street (standard for all cleared pins)
 */
const demoImg = (name: string) => `/demo/${name}`

const DIRTY = {
  street1: demoImg('dirty-street-1.jpg'),
  street2: demoImg('dirty-street-2.jpg'),
  street3: demoImg('dirty-street-3.jpg'),
  market: demoImg('dirty-market.jpg'),
  riverbank: demoImg('dirty-riverbank.jpg'),
} as const

/** Standard before/after pair for every verified_cleared (teal) demo pin. */
const CLEARED = {
  before: demoImg('cleared-before.png'),
  after: demoImg('cleared-after.png'),
} as const

/**
 * Curated Nairobi hotspots — 9 active + 3 verified_cleared.
 * Photos are reused across pins (mix-and-match asset library).
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
}[] = [
  // --- Active severe (9–10) ---
  {
    id: 'demo-001',
    area_name: 'Gikomba Market',
    ward_id: 'gikomba',
    latitude: -1.2835,
    longitude: 36.8445,
    severity_score: 10,
    status: 'active',
    waste_type: 'Market overflow',
    ai_tags: ['market', 'overflow', 'plastic-bags'],
    image_url: DIRTY.market,
    daysAgo: 12,
  },
  {
    id: 'demo-003',
    area_name: 'Industrial Area',
    ward_id: 'industrial-area',
    latitude: -1.3035,
    longitude: 36.851,
    severity_score: 9,
    status: 'active',
    waste_type: 'Industrial debris',
    ai_tags: ['construction', 'debris', 'scrap'],
    image_url: DIRTY.street2,
    daysAgo: 21,
  },
  {
    id: 'demo-006',
    area_name: 'Nairobi River — CBD stretch',
    ward_id: 'cbd',
    latitude: -1.284,
    longitude: 36.818,
    severity_score: 10,
    status: 'active',
    waste_type: 'River bank dump',
    ai_tags: ['river', 'bank', 'plastic'],
    image_url: DIRTY.riverbank,
    daysAgo: 18,
  },
  {
    id: 'demo-012',
    area_name: 'Gikomba — Jogoo Rd junction',
    ward_id: 'gikomba',
    latitude: -1.281,
    longitude: 36.847,
    severity_score: 9,
    status: 'active',
    waste_type: 'E-waste scrap',
    ai_tags: ['e-waste', 'scrap', 'drain'],
    image_url: DIRTY.street3,
    daysAgo: 9,
  },
  // --- Active moderate (5–8) ---
  {
    id: 'demo-002',
    area_name: 'Central Business District',
    ward_id: 'cbd',
    latitude: -1.2865,
    longitude: 36.8215,
    severity_score: 6,
    status: 'active',
    waste_type: 'Street litter',
    ai_tags: ['plastic', 'street', 'sidewalk'],
    image_url: DIRTY.street1,
    daysAgo: 5,
  },
  {
    id: 'demo-004',
    area_name: 'Kibra',
    ward_id: 'kibra',
    latitude: -1.312,
    longitude: 36.785,
    severity_score: 7,
    status: 'active',
    waste_type: 'Mixed waste',
    ai_tags: ['bags', 'organic', 'alley'],
    image_url: DIRTY.street2,
    daysAgo: 8,
  },
  {
    id: 'demo-005',
    area_name: 'Westlands',
    ward_id: 'westlands',
    latitude: -1.265,
    longitude: 36.802,
    severity_score: 5,
    status: 'active',
    waste_type: 'Plastic bottles',
    ai_tags: ['bottles', 'cans', 'drain'],
    image_url: DIRTY.street3,
    daysAgo: 3,
  },
  {
    id: 'demo-008',
    area_name: 'Industrial Area — Enterprise Rd',
    ward_id: 'industrial-area',
    latitude: -1.308,
    longitude: 36.846,
    severity_score: 8,
    status: 'active',
    waste_type: 'Styrofoam packaging',
    ai_tags: ['styrofoam', 'packaging', 'commercial'],
    image_url: DIRTY.street1,
    daysAgo: 14,
  },
  {
    id: 'demo-009',
    area_name: 'Kibra — Olympic Estate',
    ward_id: 'kibra',
    latitude: -1.315,
    longitude: 36.782,
    severity_score: 7,
    status: 'active',
    waste_type: 'Paper and cardboard',
    ai_tags: ['paper', 'cardboard', 'dump'],
    image_url: DIRTY.street1,
    daysAgo: 22,
  },
  // --- Verified cleared: shared before/after street pair (teal pins) ---
  {
    id: 'demo-007',
    area_name: 'Gikomba — 39 Bus Stop',
    ward_id: 'gikomba',
    latitude: -1.287,
    longitude: 36.841,
    severity_score: 8,
    status: 'verified_cleared',
    waste_type: 'Food waste',
    ai_tags: ['food-waste', 'market', 'organic'],
    image_url: CLEARED.before,
    cleared_image_url: CLEARED.after,
    daysAgo: 16,
    clearedDaysAgo: 3,
  },
  {
    id: 'demo-010',
    area_name: 'Westlands — Waiyaki Way',
    ward_id: 'westlands',
    latitude: -1.262,
    longitude: 36.798,
    severity_score: 6,
    status: 'verified_cleared',
    waste_type: 'Street litter',
    ai_tags: ['street', 'plastic', 'drain'],
    image_url: CLEARED.before,
    cleared_image_url: CLEARED.after,
    daysAgo: 11,
    clearedDaysAgo: 2,
  },
  {
    id: 'demo-011',
    area_name: 'CBD — Moi Avenue',
    ward_id: 'cbd',
    latitude: -1.2855,
    longitude: 36.8245,
    severity_score: 7,
    status: 'verified_cleared',
    waste_type: 'Mixed waste',
    ai_tags: ['bags', 'sidewalk', 'cbd'],
    image_url: CLEARED.before,
    cleared_image_url: CLEARED.after,
    daysAgo: 19,
    clearedDaysAgo: 4,
  },
]

function generateNairobiDemoReports(): Report[] {
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
    })
  })
}

export function generateDemoReports(): Report[] {
  return isRamaniMarket ? generateDemoReportsDar() : generateNairobiDemoReports()
}
