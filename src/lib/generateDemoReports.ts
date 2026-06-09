import type { Report } from '../types/database'
import { demoReportDefaults } from './reportDefaults'

const DEMO_USER = '00000000-0000-4000-8000-000000000001'

/** Curated Nairobi hotspots — one report each, named coords, matched photos. */
const CURATED_HOTSPOTS: {
  id: string
  area_name: string
  ward_id: string
  latitude: number
  longitude: number
  severity_score: number
  waste_type: string
  ai_tags: string[]
  image_url: string
  daysAgo: number
}[] = [
  {
    id: 'demo-001',
    area_name: 'Gikomba Market',
    ward_id: 'gikomba',
    latitude: -1.2835,
    longitude: 36.8445,
    severity_score: 8,
    waste_type: 'Market overflow',
    ai_tags: ['market', 'overflow', 'plastic-bags'],
    image_url:
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b150?w=800&h=600&fit=crop',
    daysAgo: 12,
  },
  {
    id: 'demo-002',
    area_name: 'Central Business District',
    ward_id: 'cbd',
    latitude: -1.2865,
    longitude: 36.8215,
    severity_score: 6,
    waste_type: 'Street litter',
    ai_tags: ['plastic', 'street', 'sidewalk'],
    image_url:
      'https://images.unsplash.com/photo-1618477388954-7857f2b4cf24?w=800&h=600&fit=crop',
    daysAgo: 5,
  },
  {
    id: 'demo-003',
    area_name: 'Industrial Area',
    ward_id: 'industrial-area',
    latitude: -1.3035,
    longitude: 36.851,
    severity_score: 9,
    waste_type: 'Industrial debris',
    ai_tags: ['construction', 'debris', 'scrap'],
    image_url:
      'https://images.unsplash.com/photo-1595278069441-2cf29f8005c4?w=800&h=600&fit=crop',
    daysAgo: 21,
  },
  {
    id: 'demo-004',
    area_name: 'Kibra',
    ward_id: 'kibra',
    latitude: -1.312,
    longitude: 36.785,
    severity_score: 7,
    waste_type: 'Mixed waste',
    ai_tags: ['bags', 'organic', 'alley'],
    image_url:
      'https://images.unsplash.com/photo-1528323273322-d81458248d40?w=800&h=600&fit=crop',
    daysAgo: 8,
  },
  {
    id: 'demo-005',
    area_name: 'Westlands',
    ward_id: 'westlands',
    latitude: -1.265,
    longitude: 36.802,
    severity_score: 5,
    waste_type: 'Plastic bottles',
    ai_tags: ['bottles', 'cans', 'drain'],
    image_url:
      'https://images.unsplash.com/photo-1621451537908-1ab09e4eee0c?w=800&h=600&fit=crop',
    daysAgo: 3,
  },
  {
    id: 'demo-006',
    area_name: 'Nairobi River — CBD stretch',
    ward_id: 'cbd',
    latitude: -1.284,
    longitude: 36.818,
    severity_score: 9,
    waste_type: 'River bank dump',
    ai_tags: ['river', 'bank', 'plastic'],
    image_url:
      'https://images.unsplash.com/photo-1530587194951-654ceb745ff9?w=800&h=600&fit=crop',
    daysAgo: 18,
  },
  {
    id: 'demo-007',
    area_name: 'Gikomba — 39 Bus Stop',
    ward_id: 'gikomba',
    latitude: -1.287,
    longitude: 36.841,
    severity_score: 7,
    waste_type: 'Food waste',
    ai_tags: ['food-waste', 'market', 'organic'],
    image_url:
      'https://images.unsplash.com/photo-1576092768241-dec99a45f253?w=800&h=600&fit=crop',
    daysAgo: 2,
  },
  {
    id: 'demo-008',
    area_name: 'Industrial Area — Enterprise Rd',
    ward_id: 'industrial-area',
    latitude: -1.308,
    longitude: 36.846,
    severity_score: 8,
    waste_type: 'Styrofoam packaging',
    ai_tags: ['styrofoam', 'packaging', 'commercial'],
    image_url:
      'https://images.unsplash.com/photo-1611288580596-7f839e6dcfcf?w=800&h=600&fit=crop',
    daysAgo: 14,
  },
  {
    id: 'demo-009',
    area_name: 'Kibra — Olympic Estate',
    ward_id: 'kibra',
    latitude: -1.315,
    longitude: 36.782,
    severity_score: 6,
    waste_type: 'Paper and cardboard',
    ai_tags: ['paper', 'cardboard', 'dump'],
    image_url:
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b150?w=800&h=600&fit=crop',
    daysAgo: 6,
  },
  {
    id: 'demo-010',
    area_name: 'Westlands — Waiyaki Way',
    ward_id: 'westlands',
    latitude: -1.262,
    longitude: 36.798,
    severity_score: 4,
    waste_type: 'Street litter',
    ai_tags: ['street', 'plastic', 'low'],
    image_url:
      'https://images.unsplash.com/photo-1618477388954-7857f2b4cf24?w=800&h=600&fit=crop',
    daysAgo: 1,
  },
  {
    id: 'demo-011',
    area_name: 'CBD — Moi Avenue',
    ward_id: 'cbd',
    latitude: -1.2855,
    longitude: 36.8245,
    severity_score: 5,
    waste_type: 'Mixed waste',
    ai_tags: ['bags', 'sidewalk', 'cbd'],
    image_url:
      'https://images.unsplash.com/photo-1528323273322-d81458248d40?w=800&h=600&fit=crop',
    daysAgo: 4,
  },
  {
    id: 'demo-012',
    area_name: 'Gikomba — Jogoo Rd junction',
    ward_id: 'gikomba',
    latitude: -1.281,
    longitude: 36.847,
    severity_score: 8,
    waste_type: 'E-waste scrap',
    ai_tags: ['e-waste', 'scrap', 'drain'],
    image_url:
      'https://images.unsplash.com/photo-1595278069441-2cf29f8005c4?w=800&h=600&fit=crop',
    daysAgo: 9,
  },
]

export function generateDemoReports(): Report[] {
  const now = Date.now()

  return CURATED_HOTSPOTS.map((spot) => {
    const created = new Date(now - spot.daysAgo * 86_400_000).toISOString()
    return demoReportDefaults({
      id: spot.id,
      user_id: DEMO_USER,
      latitude: spot.latitude,
      longitude: spot.longitude,
      severity_score: spot.severity_score,
      status: 'active',
      image_url: spot.image_url,
      ai_tags: spot.ai_tags,
      cleared_image_url: null,
      cleared_at: null,
      created_at: created,
      updated_at: created,
      area_name: spot.area_name,
      ward_id: spot.ward_id,
      waste_type: spot.waste_type,
    })
  })
}
