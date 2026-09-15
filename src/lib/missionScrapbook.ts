export type ScrapKind = 'photo' | 'link' | 'milestone'

export interface ScrapItem {
  id: string
  kind: ScrapKind
  title: string
  dateLabel: string
  body: string
  href?: string
  external?: boolean
  imageSrc?: string
  /** Tailwind rotate class, e.g. rotate-2 -rotate-3 */
  tilt: string
}

/**
 * Edit this array to grow the scrapbook.
 * Drop real photos into public/mission/ and point imageSrc at them.
 */
export const missionScrapbook: ScrapItem[] = [
  {
    id: 's1',
    kind: 'milestone',
    title: 'Season 1 happened',
    dateLabel: '2025',
    body: 'First Amazing Trash Race — warriors on the ground, lessons logged for Season 2.',
    tilt: '-rotate-2',
  },
  {
    id: 'map-live',
    kind: 'link',
    title: 'Trash map went live',
    dateLabel: 'Map · live',
    body: 'Citizens pin hotspots, corroborate piles, and verify clears across Nairobi.',
    href: '/map',
    imageSrc: '/mission/placeholder-map.svg',
    tilt: 'rotate-1',
  },
  {
    id: 'xpnc',
    kind: 'milestone',
    title: 'Fix Nairobi & XPNC',
    dateLabel: 'Partnership',
    body: 'Joined forces to fund cleanups, race logistics, and public accountability.',
    imageSrc: '/mission/placeholder-partnership.svg',
    tilt: 'rotate-3',
  },
  {
    id: 'tiktok',
    kind: 'link',
    title: 'On TikTok',
    dateLabel: 'Social',
    body: 'Field clips, race energy, and before/after stories — replace with your real @handle.',
    href: 'https://www.tiktok.com/@fixnairobi',
    external: true,
    imageSrc: '/mission/placeholder-tiktok.svg',
    tilt: '-rotate-3',
  },
  {
    id: 's2-reg',
    kind: 'link',
    title: 'Season 2 registration open',
    dateLabel: 'ATR S2',
    body: 'Digital tickets for eco-warriors — claim yours and bring the code to check-in.',
    href: '/race',
    imageSrc: '/mission/placeholder-race.svg',
    tilt: 'rotate-2',
  },
  {
    id: 'funds',
    kind: 'link',
    title: 'Public fund ledger',
    dateLabel: 'Accountability',
    body: 'Follow raised vs target, donate via M-Pesa or USDT, watch expenses get stamped.',
    href: '/funds',
    imageSrc: '/mission/placeholder-funds.svg',
    tilt: '-rotate-1',
  },
  {
    id: 'photo-field',
    kind: 'photo',
    title: 'Field day (placeholder)',
    dateLabel: 'Swap me',
    body: 'Drop your real cleanup photo in public/mission/ and update imageSrc.',
    imageSrc: '/mission/placeholder-field.svg',
    tilt: 'rotate-2',
  },
]
