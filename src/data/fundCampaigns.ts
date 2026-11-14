import type { FundEntry } from '../types/database'
/**
 * Fund page building blocks — the team edits this file, not the page.
 *
 * CAMPAIGNS: each card on /:city/funds. Money for a campaign is counted from the public
 *   ledger (fund_entries): a donation counts toward a campaign when its note contains the
 *   campaign `tag` (e.g. "M-Pesa from Jane #S3"). The general fund is everything untagged.
 * SPEND_CATEGORIES: how expenses are grouped in "Where the money goes", by keywords in the note.
 */
export interface Campaign {
  id: string
  /** City slug, or 'all'. */
  city: string
  title: string
  kind: 'race' | 'cleanup' | 'general' | 'equipment'
  emoji: string
  blurb: string
  /** Ledger tag, e.g. '#S3'. Leave empty for the general fund (all donations). */
  tag?: string
  /** Target in the city's currency. */
  target: number
  /** Optional date shown on the card (ISO), or a label like 'Date TBA'. */
  when?: string
  status: 'live' | 'soon' | 'done'
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'race-s3',
    city: 'nairobi',
    title: 'Amazing Trash Race · Season 3',
    kind: 'race',
    emoji: '🏁',
    blurb: 'Squad kits, weigh stations, transport for collected waste, and prizes for the top crews.',
    tag: '#S3',
    target: 250_000,
    when: 'Date TBA',
    status: 'live',
  },
  {
    id: 'weekly-cleanups',
    city: 'nairobi',
    title: 'Weekly neighbourhood cleanups',
    kind: 'cleanup',
    emoji: '🧹',
    blurb: 'Gloves, bags and water for the Mwiki and Roysambu weekly crews.',
    tag: '#weekly',
    target: 60_000,
    status: 'live',
  },
  {
    id: 'bins',
    city: 'nairobi',
    title: 'Bins for the worst wards',
    kind: 'equipment',
    emoji: '🗑️',
    blurb: 'Durable public bins placed where the map shows repeat dumping.',
    tag: '#bins',
    target: 120_000,
    status: 'soon',
  },
  {
    id: 'race-kampala',
    city: 'kampala',
    title: 'Amazing Trash Race · Kampala',
    kind: 'race',
    emoji: '🏁',
    blurb: 'Back the first Kampala edition.',
    tag: '#KLA',
    target: 7_000_000,
    when: 'Date TBA',
    status: 'soon',
  },
]

export const SPEND_CATEGORIES: { id: string; label: string; color: string; keywords: string[] }[] = [
  { id: 'supplies', label: 'Gloves, bags & supplies', color: '#0b8c76', keywords: ['glove', 'bag', 'sack', 'rake', 'supplies', 'kit'] },
  { id: 'transport', label: 'Transport & waste haulage', color: '#fbbf24', keywords: ['transport', 'truck', 'lorry', 'fuel', 'fare', 'haul', 'pickup'] },
  { id: 'crew', label: 'Crew pay & bounties', color: '#ef8268', keywords: ['bounty', 'crew', 'pay', 'stipend', 'wage'] },
  { id: 'food', label: 'Water & food on the day', color: '#60a5fa', keywords: ['water', 'food', 'lunch', 'snack'] },
  { id: 'prizes', label: 'Prizes & race ops', color: '#a78bfa', keywords: ['prize', 'medal', 'race', 'scale', 'print', 'banner'] },
]

export function categoriseSpend(note: string | null): string {
  const n = (note ?? '').toLowerCase()
  return SPEND_CATEGORIES.find((c) => c.keywords.some((k) => n.includes(k)))?.id ?? 'other'
}

/** Money raised for a campaign = donations whose note carries its tag (general fund = untagged). */
export function campaignRaised(c: Campaign, entries: FundEntry[], allTags: string[]): number {
  return entries
    .filter((e) => e.kind === 'donation' && !e.voided)
    .filter((e) => {
      const note = (e.note ?? '').toLowerCase()
      if (c.tag) return note.includes(c.tag.toLowerCase())
      return !allTags.some((t) => note.includes(t.toLowerCase()))
    })
    .reduce((s, e) => s + Number(e.amount_kes), 0)
}

