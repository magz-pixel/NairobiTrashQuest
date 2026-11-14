/**
 * Published figures on the scale of the waste problem per city, for the hub snapshot.
 * Keep every number sourced; use null when we don't have a reliable figure.
 */

export interface CityWasteFacts {
  /** Tonnes of solid waste generated per day. */
  tonnesPerDay: number | null
  /** Share of waste / households reached by collection (0–1). */
  collectedShare: number | null
  sources: { label: string; url?: string }[]
}

export const CITY_FACTS: Record<string, CityWasteFacts> = {
  nairobi: {
    tonnesPerDay: 2500,
    collectedShare: 0.5,
    sources: [
      { label: 'Nairobi City County via Fix Nairobi research (2,500 t/day)' },
      { label: 'World Bank, via Daily Nation (collection rates)', url: 'https://www.nation.co.ke/news/africa/heaps-of-garbage-in-africa/1066-4775644-15jk66f/index.html' },
    ],
  },
  kampala: {
    // 481,081 t/year in 2017 → ≈1,320 t/day
    tonnesPerDay: 1320,
    collectedShare: 0.64,
    sources: [
      { label: 'Kinobe et al., Sustainability 2019 (481,081 t/yr; 64% collected)', url: 'https://mdpi.com/2071-1050/11/19/5523' },
    ],
  },
  'dar-es-salaam': {
    tonnesPerDay: null,
    collectedShare: 0.49,
    sources: [
      { label: 'World Bank, via Daily Nation (collection rates)', url: 'https://www.nation.co.ke/news/africa/heaps-of-garbage-in-africa/1066-4775644-15jk66f/index.html' },
    ],
  },
}

/** Kilograms removed before the weigh-in log existed (Amazing Trash Race Season 1, Mwiki, 2025). */
export const HISTORIC_KG_REMOVED = 600
