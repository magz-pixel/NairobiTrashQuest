export type Locale = 'en' | 'sw'

const STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    reportTrash: 'Report trash',
    verifyClear: 'Verify clear',
    active: 'Active',
    reports: 'Reports',
    map: 'Map',
    list: 'List',
    analytics: 'Analytics',
    dataExport: 'Export data (CC-BY)',
    geoExport: 'Export GeoJSON',
    publicApi: 'Public stats API',
    whatsappReport: 'Report via WhatsApp',
  },
  sw: {
    reportTrash: 'Ripoti taka',
    verifyClear: 'Thibitisha usafi',
    active: 'Hai',
    reports: 'Ripoti',
    map: 'Ramani',
    list: 'Orodha',
    analytics: 'Takwimu',
    dataExport: 'Pakua data (CC-BY)',
    geoExport: 'Pakua GeoJSON',
    publicApi: 'API ya takwimu',
    whatsappReport: 'Ripoti kupitia WhatsApp',
  },
}

let currentLocale: Locale =
  (localStorage.getItem('ntr_locale') as Locale) || 'en'

export function setLocale(locale: Locale) {
  currentLocale = locale
  localStorage.setItem('ntr_locale', locale)
}

export function getLocale(): Locale {
  return currentLocale
}

export function t(key: string): string {
  return STRINGS[currentLocale][key] ?? STRINGS.en[key] ?? key
}

export function whatsappReportUrl(): string {
  const text = encodeURIComponent(
    'I want to report trash in Nairobi via Nairobi Trash Locator: https://nairobi-trash-quest.vercel.app',
  )
  return `https://wa.me/?text=${text}`
}

export function exportReportsGeoJson(
  reports: {
    id: string
    latitude: number
    longitude: number
    severity_score: number
    status: string
    area_name: string | null
    created_at: string
    waste_type?: string | null
  }[],
) {
  const geojson = {
    type: 'FeatureCollection',
    license: 'CC-BY-4.0',
    features: reports.map((r) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
      properties: {
        id: r.id,
        severity: r.severity_score,
        status: r.status,
        area: r.area_name,
        waste_type: r.waste_type,
        created_at: r.created_at,
      },
    })),
  }
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nairobi-trash-reports.geojson'
  a.click()
  URL.revokeObjectURL(url)
}

export function publicStatsUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL
  return base ? `${base}/functions/v1/public-stats` : ''
}

export function exportReportsCsv(
  reports: {
    id: string
    latitude: number
    longitude: number
    severity_score: number
    status: string
    area_name: string | null
    created_at: string
  }[],
) {
  const header = 'id,latitude,longitude,severity,status,area,created_at\n'
  const rows = reports
    .map(
      (r) =>
        `${r.id},${r.latitude},${r.longitude},${r.severity_score},${r.status},${(r.area_name ?? '').replace(/,/g, ' ')},${r.created_at}`,
    )
    .join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nairobi-trash-reports.csv'
  a.click()
  URL.revokeObjectURL(url)
}
