export type MarketId = 'nairobi' | 'ramani-tz'

export interface WardBox {
  id: string
  name: string
  subCounty: string
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export interface MarketConfig {
  id: MarketId
  appName: string
  appShortName: string
  tagline: string
  cityName: string
  mapCenter: [number, number]
  mapZoom: number
  defaultLocale: 'en' | 'sw'
  currency: { code: string; symbol: string }
  features: { crowdfunding: boolean }
  complaintEmail: string
  accountabilityFallback: { role: string; contactEmail: string | null }[]
  wardBoxes: WardBox[]
}

const NAIROBI_WARDS: WardBox[] = [
  {
    id: 'cbd',
    name: 'Central Business District',
    subCounty: 'Starehe',
    minLat: -1.29,
    maxLat: -1.28,
    minLng: 36.81,
    maxLng: 36.83,
  },
  {
    id: 'westlands',
    name: 'Westlands',
    subCounty: 'Westlands',
    minLat: -1.27,
    maxLat: -1.25,
    minLng: 36.78,
    maxLng: 36.82,
  },
  {
    id: 'kibra',
    name: 'Kibra',
    subCounty: 'Kibra',
    minLat: -1.32,
    maxLat: -1.3,
    minLng: 36.76,
    maxLng: 36.79,
  },
  {
    id: 'gikomba',
    name: 'Gikomba',
    subCounty: 'Kamukunji',
    minLat: -1.29,
    maxLat: -1.27,
    minLng: 36.83,
    maxLng: 36.86,
  },
  {
    id: 'industrial-area',
    name: 'Industrial Area',
    subCounty: 'Makadara',
    minLat: -1.31,
    maxLat: -1.29,
    minLng: 36.84,
    maxLng: 36.87,
  },
]

const DAR_WARDS: WardBox[] = [
  {
    id: 'kariakoo',
    name: 'Kariakoo',
    subCounty: 'Ilala',
    minLat: -6.83,
    maxLat: -6.81,
    minLng: 39.26,
    maxLng: 39.29,
  },
  {
    id: 'ilala',
    name: 'Ilala CBD',
    subCounty: 'Ilala',
    minLat: -6.82,
    maxLat: -6.8,
    minLng: 39.27,
    maxLng: 39.3,
  },
  {
    id: 'kinondoni',
    name: 'Kinondoni',
    subCounty: 'Kinondoni',
    minLat: -6.79,
    maxLat: -6.76,
    minLng: 39.25,
    maxLng: 39.28,
  },
  {
    id: 'temeke',
    name: 'Temeke',
    subCounty: 'Temeke',
    minLat: -6.87,
    maxLat: -6.84,
    minLng: 39.25,
    maxLng: 39.29,
  },
  {
    id: 'ubungo',
    name: 'Ubungo',
    subCounty: 'Ubungo',
    minLat: -6.8,
    maxLat: -6.77,
    minLng: 39.2,
    maxLng: 39.24,
  },
  {
    id: 'oyster-bay',
    name: 'Oyster Bay',
    subCounty: 'Kinondoni',
    minLat: -6.77,
    maxLat: -6.74,
    minLng: 39.27,
    maxLng: 39.3,
  },
  {
    id: 'kigamboni',
    name: 'Kigamboni',
    subCounty: 'Kigamboni',
    minLat: -6.84,
    maxLat: -6.8,
    minLng: 39.3,
    maxLng: 39.35,
  },
]

const NAIROBI: MarketConfig = {
  id: 'nairobi',
  appName: 'Nairobi Trash Locator',
  appShortName: 'N',
  tagline: 'Report, corroborate, clean',
  cityName: 'Nairobi',
  mapCenter: [-1.286389, 36.817223],
  mapZoom: 13,
  defaultLocale: 'en',
  currency: { code: 'KES', symbol: 'KSh' },
  features: { crowdfunding: false },
  complaintEmail: 'environment@nairobi.go.ke',
  accountabilityFallback: [
    { role: 'NCC Environment Desk', contactEmail: 'environment@nairobi.go.ke' },
    { role: 'Sub-County Administrator', contactEmail: null },
    { role: 'Ward MCA', contactEmail: null },
    { role: 'Constituency MP', contactEmail: null },
  ],
  wardBoxes: NAIROBI_WARDS,
}

const RAMANI: MarketConfig = {
  id: 'ramani-tz',
  appName: 'Ramani Taka',
  appShortName: 'R',
  tagline: 'Fund, clean, change your city',
  cityName: 'Dar es Salaam',
  mapCenter: [-6.7924, 39.2083],
  mapZoom: 12,
  defaultLocale: 'en',
  currency: { code: 'TZS', symbol: 'TSh' },
  features: { crowdfunding: true },
  complaintEmail: 'waste@dsm.go.tz',
  accountabilityFallback: [
    { role: 'DSM City Council Waste Desk', contactEmail: 'waste@dsm.go.tz' },
    { role: 'Municipal Director', contactEmail: null },
    { role: 'Ward Executive Officer', contactEmail: null },
    { role: 'Constituency MP', contactEmail: null },
  ],
  wardBoxes: DAR_WARDS,
}

const marketId = (import.meta.env.VITE_MARKET as MarketId | undefined) ?? 'nairobi'

export const marketConfig: MarketConfig =
  marketId === 'ramani-tz' ? RAMANI : NAIROBI

export const isRamaniMarket = marketConfig.id === 'ramani-tz'
