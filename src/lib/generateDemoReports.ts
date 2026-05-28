import type { Report } from '../types/database'

const DEMO_USER = '00000000-0000-4000-8000-000000000001'

const METRO = { latMin: -1.34, latMax: -1.22, lngMin: 36.74, lngMax: 36.92 }
const CORE = { latMin: -1.31, latMax: -1.265, lngMin: 36.78, lngMax: 36.88 }

const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b150?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1621451537908-1ab09e4eee0c?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1611288580596-7f839e6dcfcf?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1528323273322-d81458248d40?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1530587194951-654ceb745ff9?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1595278069441-2cf29f8005c4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1618477388954-7857f2b4cf24?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1576092768241-dec99a45f253?w=400&h=300&fit=crop',
]

const TAG_POOL = [
  ['plastic', 'street'],
  ['bags', 'sidewalk'],
  ['market', 'overflow'],
  ['drain', 'blocked'],
  ['bottles', 'cans'],
  ['food-waste', 'organic'],
  ['construction', 'debris'],
  ['styrofoam', 'packaging'],
  ['paper', 'cardboard'],
  ['e-waste', 'scrap'],
  ['river', 'bank'],
  ['alley', 'dump'],
]

/** Hotspot clusters: center lat/lng, spread (~km), severity bias */
const CLUSTERS = [
  { name: 'cbd', lat: -1.286, lng: 36.823, spread: 0.008, bias: 3 },
  { name: 'gikomba', lat: -1.288, lng: 36.842, spread: 0.007, bias: 3 },
  { name: 'industrial', lat: -1.305, lng: 36.84, spread: 0.009, bias: 4 },
  { name: 'river', lat: -1.282, lng: 36.818, spread: 0.008, bias: 2 },
  { name: 'kibera', lat: -1.313, lng: 36.788, spread: 0.009, bias: 3 },
  { name: 'westlands', lat: -1.268, lng: 36.805, spread: 0.008, bias: 2 },
] as const

/** Mulberry32 seeded PRNG */
function createRng(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickSeverity(rng: () => number, bias = 0): number {
  const roll = rng()
  let base: number
  if (roll < 0.45) base = 2 + Math.floor(rng() * 2)
  else if (roll < 0.73) base = 4 + Math.floor(rng() * 2)
  else if (roll < 0.9) base = 6 + Math.floor(rng() * 2)
  else base = 8 + Math.floor(rng() * 3)
  return Math.min(10, Math.max(2, base + bias))
}

function randomInBox(
  rng: () => number,
  box: typeof METRO,
): { lat: number; lng: number } {
  return {
    lat: box.latMin + rng() * (box.latMax - box.latMin),
    lng: box.lngMin + rng() * (box.lngMax - box.lngMin),
  }
}

function jitterCoord(lat: number, lng: number, rng: () => number): { lat: number; lng: number } {
  const m = 0.0004
  return {
    lat: lat + (rng() - 0.5) * m,
    lng: lng + (rng() - 0.5) * m,
  }
}

function clusterPoint(
  rng: () => number,
  cluster: (typeof CLUSTERS)[number],
): { lat: number; lng: number } {
  const lat = cluster.lat + (rng() - 0.5) * cluster.spread * 2
  const lng = cluster.lng + (rng() - 0.5) * cluster.spread * 2
  return jitterCoord(lat, lng, rng)
}

export function generateDemoReports(count = 200, seed = 42): Report[] {
  const rng = createRng(seed)
  const clusterCount = Math.floor(count * 0.38)
  const scatterCount = count - clusterCount
  const now = Date.now()
  const reports: Report[] = []

  let idx = 0

  for (let i = 0; i < clusterCount; i++) {
    const cluster = CLUSTERS[i % CLUSTERS.length]
    const { lat, lng } = clusterPoint(rng, cluster)
    const hoursAgo = rng() * 48
    const created = new Date(now - hoursAgo * 3_600_000).toISOString()
    idx += 1
    reports.push({
      id: `demo-${String(idx).padStart(3, '0')}`,
      user_id: DEMO_USER,
      latitude: lat,
      longitude: lng,
      severity_score: pickSeverity(rng, cluster.bias),
      status: 'active',
      image_url: IMAGE_POOL[idx % IMAGE_POOL.length],
      ai_tags: [...TAG_POOL[idx % TAG_POOL.length]],
      cleared_image_url: null,
      cleared_at: null,
      created_at: created,
      updated_at: created,
    })
  }

  for (let i = 0; i < scatterCount; i++) {
    const box = rng() < 0.7 ? CORE : METRO
    let { lat, lng } = randomInBox(rng, box)
    ;({ lat, lng } = jitterCoord(lat, lng, rng))
    const hoursAgo = rng() * 48
    const created = new Date(now - hoursAgo * 3_600_000).toISOString()
    idx += 1
    reports.push({
      id: `demo-${String(idx).padStart(3, '0')}`,
      user_id: DEMO_USER,
      latitude: lat,
      longitude: lng,
      severity_score: pickSeverity(rng, 0),
      status: 'active',
      image_url: IMAGE_POOL[idx % IMAGE_POOL.length],
      ai_tags: [...TAG_POOL[idx % TAG_POOL.length]],
      cleared_image_url: null,
      cleared_at: null,
      created_at: created,
      updated_at: created,
    })
  }

  return reports
}
