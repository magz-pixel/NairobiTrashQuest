/**
 * Illustrative ("demo") data for the hub's East Africa heat map: what the network looks like at
 * scale. Always shown with a DEMO label and a toggle to live data. Deterministic (seeded), so the
 * picture is the same for everyone and between visits.
 */

export interface RegionPoint {
  lng: number
  lat: number
  /** 1–10 */
  severity: number
  cleared: boolean
  city: string
}

export interface FeedItem {
  id: string
  kind: 'cleanup' | 'report' | 'cleared'
  place: string
  text: string
  when: string
  href?: string
}

/** Known trouble spots per city: [lng, lat, weight]. */
const HOTSPOTS: Record<string, [number, number, number][]> = {
  nairobi: [
    [36.932, -1.236, 9], // Mwiki
    [36.843, -1.284, 8], // Gikomba
    [36.784, -1.313, 9], // Kibera
    [36.858, -1.262, 7], // Mathare
    [36.902, -1.25, 8], // Dandora
    [36.745, -1.285, 5], // Kawangware
    [36.9, -1.32, 5], // Embakasi
    [36.915, -1.275, 6], // Kayole
    [36.855, -1.308, 6], // Industrial Area
    [36.81, -1.265, 3], // Westlands
    [36.83, -1.286, 4], // CBD
    [36.95, -1.21, 3], // Ruai / Njiru
  ],
  kampala: [
    [32.567, 0.311, 8], // Kisenyi
    [32.571, 0.351, 7], // Kalerwe
    [32.612, 0.33, 4], // Nakawa
    [32.576, 0.313, 7], // Owino market
    [32.557, 0.352, 6], // Bwaise
    [32.578, 0.331, 5], // Katanga
    [32.56, 0.372, 4], // Kawempe
    [32.6, 0.296, 3], // Kabalagala
  ],
  'dar-es-salaam': [
    [39.277, -6.818, 8], // Kariakoo
    [39.232, -6.8, 7], // Manzese
    [39.247, -6.79, 7], // Tandale
    [39.251, -6.832, 5], // Buguruni
    [39.262, -6.862, 6], // Temeke
    [39.272, -6.91, 5], // Mbagala
    [39.212, -6.79, 4], // Ubungo
    [39.254, -6.772, 4], // Kinondoni
  ],
}

const CITY_SHARE: Record<string, number> = { nairobi: 1700, kampala: 1150, 'dar-es-salaam': 1350 }

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let cached: RegionPoint[] | null = null

export function demoRegionPoints(): RegionPoint[] {
  if (cached) return cached
  const rand = mulberry32(20261114)
  const gauss = () => {
    const u = 1 - rand()
    const v = rand()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  const out: RegionPoint[] = []
  for (const [city, spots] of Object.entries(HOTSPOTS)) {
    const total = spots.reduce((sum, s) => sum + s[2], 0)
    for (const [lng, lat, w] of spots) {
      const n = Math.round((CITY_SHARE[city] * w) / total)
      for (let i = 0; i < n; i++) {
        // Most spots hug the hotspot; every 4th is sprinkled across the wider metro area.
        const spread = i % 4 === 0 ? 0.06 : 0.012
        out.push({
          lng: lng + gauss() * spread,
          lat: lat + gauss() * spread,
          severity: Math.max(1, Math.min(10, Math.round(5 + gauss() * 2.2 + w / 4))),
          cleared: rand() < 0.28,
          city,
        })
      }
    }
  }
  cached = out
  return out
}

export const DEMO_FEED: FeedItem[] = [
  { id: 'd1', kind: 'cleanup', place: 'Riverside Drive', text: 'Cleanup rallying: 6 of 10 volunteers in. Join now.', when: 'Sat 9:00' },
  { id: 'd2', kind: 'report', place: 'Kibera', text: 'Hazardous waste reported near the railway line.', when: '12 min ago' },
  { id: 'd3', kind: 'cleared', place: 'Kariakoo, Dar', text: '18 bags cleared. Before and after verified.', when: '2 h ago' },
  { id: 'd4', kind: 'report', place: 'Kalerwe market, Kampala', text: 'New hotspot pinned. 4 neighbours confirmed.', when: '35 min ago' },
]
