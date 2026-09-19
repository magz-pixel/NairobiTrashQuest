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
  {
    id: 'demo-kla-001',
    area_name: 'Nakasero Market',
    ward_id: 'central',
    latitude: 0.3185,
    longitude: 32.5818,
    severity_score: 10,
    status: 'active',
    waste_type: 'Market overflow',
    ai_tags: ['market', 'overflow', 'organic'],
    image_url: DIRTY.market,
    daysAgo: 8,
  },
  {
    id: 'demo-kla-002',
    area_name: 'Nakivubo Channel',
    ward_id: 'central',
    latitude: 0.3118,
    longitude: 32.5794,
    severity_score: 9,
    status: 'active',
    waste_type: 'Plastic',
    ai_tags: ['channel', 'plastic', 'drainage'],
    image_url: DIRTY.riverbank,
    daysAgo: 14,
  },
  {
    id: 'demo-kla-003',
    area_name: 'Owino Market',
    ward_id: 'central',
    latitude: 0.3132,
    longitude: 32.5756,
    severity_score: 8,
    status: 'active',
    waste_type: 'Mixed waste',
    ai_tags: ['market', 'bags', 'sidewalk'],
    image_url: DIRTY.street2,
    daysAgo: 5,
  },
  {
    id: 'demo-kla-004',
    area_name: 'Kawempe Road',
    ward_id: 'kawempe',
    latitude: 0.362,
    longitude: 32.563,
    severity_score: 7,
    status: 'active',
    waste_type: 'Mixed waste',
    ai_tags: ['roadside', 'bags'],
    image_url: DIRTY.street1,
    daysAgo: 11,
  },
  {
    id: 'demo-kla-005',
    area_name: 'Namuwongo',
    ward_id: 'makindye',
    latitude: 0.298,
    longitude: 32.612,
    severity_score: 8,
    status: 'active',
    waste_type: 'Plastic',
    ai_tags: ['settlement', 'plastic'],
    image_url: DIRTY.street3,
    daysAgo: 19,
  },
  {
    id: 'demo-kla-006',
    area_name: 'Nakawa Industrial Area',
    ward_id: 'nakawa',
    latitude: 0.332,
    longitude: 32.628,
    severity_score: 9,
    status: 'active',
    waste_type: 'Industrial debris',
    ai_tags: ['industrial', 'debris'],
    image_url: DIRTY.street2,
    daysAgo: 22,
  },
  {
    id: 'demo-kla-007',
    area_name: 'Rubaga Cathedral road',
    ward_id: 'rubaga',
    latitude: 0.302,
    longitude: 32.552,
    severity_score: 6,
    status: 'verified_cleared',
    waste_type: 'Mixed waste',
    ai_tags: ['cleared', 'roadside'],
    image_url: CLEARED.before,
    cleared_image_url: CLEARED.after,
    daysAgo: 16,
    clearedDaysAgo: 3,
  },
  {
    id: 'demo-kla-008',
    area_name: 'Makerere Hill',
    ward_id: 'kawempe',
    latitude: 0.3338,
    longitude: 32.5675,
    severity_score: 5,
    status: 'verified_cleared',
    waste_type: 'Plastic',
    ai_tags: ['campus', 'cleared'],
    image_url: CLEARED.before,
    cleared_image_url: CLEARED.after,
    daysAgo: 20,
    clearedDaysAgo: 6,
  },
]

export function generateDemoReportsKampala(): Report[] {
  const now = Date.now()
  return CURATED_HOTSPOTS.map((spot) => {
    const created = new Date(now - spot.daysAgo * 86_400_000).toISOString()
    const clearedAt =
      spot.status === 'verified_cleared' && spot.clearedDaysAgo != null
        ? new Date(now - spot.clearedDaysAgo * 86_400_000).toISOString()
        : null
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
      cleared_by: null,
      created_at: created,
      updated_at: clearedAt ?? created,
      area_name: spot.area_name,
      ward_id: spot.ward_id,
      waste_type: spot.waste_type,
      city: 'kampala',
    })
  })
}
