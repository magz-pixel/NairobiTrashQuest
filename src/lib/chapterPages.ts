/** Public pages every city chapter ships. Same desk, local streets. */

export interface ChapterPage {
  href: string
  label: string
  short: string
  blurb: string
  inNav: boolean
}

export const CHAPTER_PAGES: ChapterPage[] = [
  {
    href: '/map',
    label: 'Trash Map',
    short: 'Map',
    blurb: 'See dirty spots, drop a pin, and verify a clear.',
    inNav: true,
  },
  {
    href: '/cleanups',
    label: 'Cleanups',
    short: 'Cleanups',
    blurb: 'Join the next field day in this city.',
    inNav: true,
  },
  {
    href: '/race',
    label: 'Trash Race',
    short: 'Race',
    blurb: 'Register a squad and clear hotspots for points.',
    inNav: true,
  },
  {
    href: '/race/leaderboard',
    label: 'Leaderboard',
    short: 'Board',
    blurb: 'Public scoreboard for this chapter’s race.',
    inNav: true,
  },
  {
    href: '/funds',
    label: 'Funds',
    short: 'Funds',
    blurb: 'Follow the money in this city’s public ledger.',
    inNav: true,
  },
  {
    href: '/mission',
    label: 'Mission',
    short: 'Mission',
    blurb: 'Why this chapter exists and how the work runs.',
    inNav: true,
  },
  {
    href: '/me',
    label: 'My impact',
    short: 'Me',
    blurb: 'Your reports, XP, and proof of work.',
    inNav: false,
  },
]

export const CHAPTER_NAV = CHAPTER_PAGES.filter((page) => page.inNav)
