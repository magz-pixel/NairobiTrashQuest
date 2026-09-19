/** City catalog — Fix Nairobi / Fix Kampala / Fix Dar es Salaam chapters of Ramani-Taka. */

/** Same shape as marketConfig's WardBox — owned here for the cities catalog. */
export interface WardBox {
  id: string
  name: string
  subCounty: string
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export interface CityConfig {
  slug: string
  label: string
  chapterName: string
  country: string
  center: { lat: number; lng: number }
  mapZoom: number
  active: boolean
  currency: { code: string; symbol: string }
  defaultLocale: 'en' | 'sw'
  wardBoxes: WardBox[]
  complaintEmail: string
  accountabilityFallback: { role: string; contactEmail: string | null }[]
  features: { crowdfunding: boolean }
  fundTarget: number
}

export const NAIROBI = 'nairobi'
export const KAMPALA = 'kampala'
export const DAR_ES_SALAAM = 'dar-es-salaam'

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

const KAMPALA_WARDS: WardBox[] = [
  {
    id: 'central',
    name: 'Central Division',
    subCounty: 'Kampala Central',
    minLat: 0.305,
    maxLat: 0.335,
    minLng: 32.56,
    maxLng: 32.6,
  },
  {
    id: 'kawempe',
    name: 'Kawempe',
    subCounty: 'Kawempe',
    minLat: 0.345,
    maxLat: 0.385,
    minLng: 32.54,
    maxLng: 32.59,
  },
  {
    id: 'makindye',
    name: 'Makindye',
    subCounty: 'Makindye',
    minLat: 0.265,
    maxLat: 0.305,
    minLng: 32.57,
    maxLng: 32.63,
  },
  {
    id: 'nakawa',
    name: 'Nakawa',
    subCounty: 'Nakawa',
    minLat: 0.32,
    maxLat: 0.36,
    minLng: 32.6,
    maxLng: 32.66,
  },
  {
    id: 'rubaga',
    name: 'Rubaga',
    subCounty: 'Rubaga',
    minLat: 0.295,
    maxLat: 0.335,
    minLng: 32.52,
    maxLng: 32.57,
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

export const CITIES: Record<string, CityConfig> = {
  [NAIROBI]: {
    slug: NAIROBI,
    label: 'Nairobi',
    chapterName: 'Fix Nairobi',
    country: 'Kenya',
    center: { lat: -1.286389, lng: 36.817223 },
    mapZoom: 13,
    active: true,
    currency: { code: 'KES', symbol: 'KSh' },
    defaultLocale: 'en',
    wardBoxes: NAIROBI_WARDS,
    complaintEmail: 'environment@nairobi.go.ke',
    accountabilityFallback: [
      { role: 'NCC Environment Desk', contactEmail: 'environment@nairobi.go.ke' },
      { role: 'Sub-County Administrator', contactEmail: null },
      { role: 'Ward MCA', contactEmail: null },
      { role: 'Constituency MP', contactEmail: null },
    ],
    features: { crowdfunding: false },
    fundTarget: 500_000,
  },
  [KAMPALA]: {
    slug: KAMPALA,
    label: 'Kampala',
    chapterName: 'Fix Kampala',
    country: 'Uganda',
    center: { lat: 0.3476, lng: 32.5825 },
    mapZoom: 13,
    active: true,
    currency: { code: 'UGX', symbol: 'USh' },
    defaultLocale: 'en',
    wardBoxes: KAMPALA_WARDS,
    complaintEmail: 'info@kcca.go.ug',
    accountabilityFallback: [
      { role: 'KCCA Environment Desk', contactEmail: 'info@kcca.go.ug' },
      { role: 'Division Town Clerk', contactEmail: null },
      { role: 'Ward Councillor', contactEmail: null },
      { role: 'Constituency MP', contactEmail: null },
    ],
    features: { crowdfunding: false },
    fundTarget: 20_000_000,
  },
  [DAR_ES_SALAAM]: {
    slug: DAR_ES_SALAAM,
    label: 'Dar es Salaam',
    chapterName: 'Fix Dar es Salaam',
    country: 'Tanzania',
    center: { lat: -6.7924, lng: 39.2083 },
    mapZoom: 12,
    active: true,
    currency: { code: 'TZS', symbol: 'TSh' },
    defaultLocale: 'en',
    wardBoxes: DAR_WARDS,
    complaintEmail: 'waste@dsm.go.tz',
    accountabilityFallback: [
      { role: 'DSM City Council Waste Desk', contactEmail: 'waste@dsm.go.tz' },
      { role: 'Municipal Director', contactEmail: null },
      { role: 'Ward Executive Officer', contactEmail: null },
      { role: 'Constituency MP', contactEmail: null },
    ],
    features: { crowdfunding: true },
    fundTarget: 10_000_000,
  },
}

export function getActiveCities(): CityConfig[] {
  return Object.values(CITIES).filter((c) => c.active)
}

export function isCitySlug(value: string | undefined): value is string {
  return Boolean(value && CITIES[value]?.active)
}

export function getCity(slug: string | undefined): CityConfig {
  if (slug && CITIES[slug]) return CITIES[slug]
  return CITIES[NAIROBI]
}

/** Path inside a city chapter, e.g. cityPath('kampala', '/map') → '/kampala/map'. */
export function cityPath(slug: string, path = ''): string {
  if (!path || path === '/') return `/${slug}`
  if (path === `/${slug}` || path.startsWith(`/${slug}/`)) return path
  const rest = path.startsWith('/') ? path : `/${path}`
  return `/${slug}${rest}`
}

export function formatCityMoney(amount: number, city: CityConfig): string {
  const locale =
    city.currency.code === 'UGX' ? 'en-UG' : city.currency.code === 'TZS' ? 'en-TZ' : 'en-KE'
  return `${city.currency.symbol} ${Math.round(amount).toLocaleString(locale)}`
}

/** Campaign target in the city's display units (column stays amount_kes). */
export const FUND_TARGET = 500_000
