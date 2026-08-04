import { marketConfig } from './marketConfig'

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
    contribute: 'Contribute now',
    goalReached: 'Goal reached — cleanup pending',
    raisedOf: 'raised of',
    contributors: 'contributors',
    mpesaConfirm: 'Confirm payment',
    contributeTitle: 'Fund this cleanup',
    phoneLabel: 'Phone number',
    amountLabel: 'Amount',
    providerLabel: 'Pay with',
    sendPayment: 'Send payment',
    paymentSuccess: 'Contribution received — thank you!',
    processing: 'Processing…',
    cancel: 'Cancel',
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
    contribute: 'Changia sasa',
    goalReached: 'Lengo limefikiwa — usafi unatarajiwa',
    raisedOf: 'imekusanywa kati ya',
    contributors: 'wachangiaji',
    mpesaConfirm: 'Thibitisha malipo',
    contributeTitle: 'Fadhili usafi huu',
    phoneLabel: 'Nambari ya simu',
    amountLabel: 'Kiasi',
    providerLabel: 'Lipa kwa',
    sendPayment: 'Tuma malipo',
    paymentSuccess: 'Mchango umepokelewa — asante!',
    processing: 'Inachakata…',
    cancel: 'Ghairi',
  },
}

const localeKey = `ntr_locale_${marketConfig.id}`

let currentLocale: Locale =
  (localStorage.getItem(localeKey) as Locale) ||
  (localStorage.getItem('ntr_locale') as Locale) ||
  marketConfig.defaultLocale

export function setLocale(locale: Locale) {
  currentLocale = locale
  localStorage.setItem(localeKey, locale)
}

export function getLocale(): Locale {
  return currentLocale
}

export function t(key: string): string {
  return STRINGS[currentLocale][key] ?? STRINGS.en[key] ?? key
}

export function whatsappReportUrl(): string {
  const text = encodeURIComponent(
    `I want to report trash in ${marketConfig.cityName} via ${marketConfig.appName}`,
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
  a.download = `${marketConfig.id}-trash-reports.geojson`
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
  a.download = `${marketConfig.id}-trash-reports.csv`
  a.click()
  URL.revokeObjectURL(url)
}
