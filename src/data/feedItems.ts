/**
 * "Action & Proof" feed — the single place the team edits feed content.
 *
 * Two sources end up in the carousel:
 *   1. LIVE items, built from Supabase data by `buildLiveFeed()` (cleared reports with before/after
 *      photos, reports with funding momentum, upcoming cleanups).
 *   2. CURATED items in `CURATED_FEED` below: milestones, leaderboard snapshots, race teasers, and
 *      demo cards. Edit this array to post a team update — no UI code changes needed.
 *
 * Anything with `demo: true` shows a small "Example" badge so nobody mistakes it for real data.
 * Delete demo items city by city as real content arrives.
 */
import type { Event, Report } from '../types/database'

/* ------------------------------------------------------------------ types */

export type FeedCategory = 'proof' | 'bounty' | 'event' | 'wins'

interface FeedBase {
  id: string
  /** City slug ('nairobi', 'kampala', 'dar-es-salaam'), or 'all' to show everywhere. */
  city: string
  /** ISO date used for ordering (newest / soonest first within a category). */
  at: string
  /** Pin to the front of the carousel. */
  featured?: boolean
  /** Placeholder content: shows an "Example" badge. */
  demo?: boolean
}

/** A. Before & After glow-up. */
export interface ProofItem extends FeedBase {
  type: 'proof'
  place: string
  /** Leave empty to use the built-in illustrated placeholder. */
  beforeImage?: string
  afterImage?: string
  /** e.g. "120 kg cleared · 14 bags". */
  impact: string
  /** Report id, for the "See the proof" link. */
  reportId?: string
}

/** B. Hotspot gaining funding traction. */
export interface BountyItem extends FeedBase {
  type: 'bounty'
  place: string
  lat: number
  lng: number
  raised: number
  target: number
  backers: number
  /** ISO currency code; the card formats it. */
  currency: string
  reportId?: string
  image?: string
}

/** C. Cleanups, slum drops, race editions. */
export interface EventItem extends FeedBase {
  type: 'event'
  title: string
  when: string
  place: string
  blurb?: string
  kicker: string
  /** Primary button. `href` may be an in-app path (starting with '/') or a full URL. */
  cta: { label: string; href?: string; action?: 'rsvp' }
  eventId?: string
  going?: number
}

/** D. Milestones and leaderboard snapshots. */
export interface WinsItem extends FeedBase {
  type: 'wins'
  title: string
  body?: string
  emoji?: string
  /** Optional leaderboard snapshot. */
  board?: { metric: string; rows: { name: string; score: string }[] }
}

export type FeedItem = ProofItem | BountyItem | EventItem | WinsItem

/* ------------------------------------------------------------- the rule */

/**
 * Hotspots only reach the feed once they have funding momentum. Tune here.
 * A report qualifies if ANY condition holds.
 */
export const BOUNTY_RULE = {
  /** Minimum raised (in the city's currency). */
  minRaised: 1,
  /** …or at least this many backers. */
  minBackers: 3,
  /** Default target when a report has none set (per currency). */
  defaultTarget: { KES: 15000, UGX: 400000, TZS: 250000 } as Record<string, number>,
  /** Max bounty cards from live data, so the feed stays curated. */
  maxCards: 6,
}

export function hasFundingMomentum(r: Pick<Report, 'funding_raised_tzs' | 'funding_contributors'>): boolean {
  return (r.funding_raised_tzs ?? 0) >= BOUNTY_RULE.minRaised || (r.funding_contributors ?? 0) >= BOUNTY_RULE.minBackers
}

/* ------------------------------------------------------- live data → items */

/**
 * Turns Supabase rows into feed items. This is the plug-in point for real data:
 * add new sources here (e.g. fund_entries, race_weight_logs) and the UI picks them up.
 */
export function buildLiveFeed(reports: Report[], events: Event[], going: Map<string, number>, currency: string): FeedItem[] {
  const out: FeedItem[] = []

  // A. Cleared spots that have both photos.
  for (const r of reports) {
    if (r.status !== 'verified_cleared' || !r.image_url || !r.cleared_image_url) continue
    out.push({
      type: 'proof',
      id: `proof-${r.id}`,
      city: r.city,
      at: r.cleared_at ?? r.updated_at,
      place: r.area_name ?? 'A cleared spot',
      beforeImage: r.image_url,
      afterImage: r.cleared_image_url,
      impact: 'Cleared and verified by neighbours',
      reportId: r.id,
    })
  }

  // B. Open hotspots with funding momentum (TODO: switch to a per-report pledges table when it exists).
  const funded = reports
    .filter((r) => (r.status === 'active' || r.status === 'flagged') && hasFundingMomentum(r))
    .sort((a, b) => (b.funding_raised_tzs ?? 0) - (a.funding_raised_tzs ?? 0))
    .slice(0, BOUNTY_RULE.maxCards)
  for (const r of funded) {
    out.push({
      type: 'bounty',
      id: `bounty-${r.id}`,
      city: r.city,
      at: r.created_at,
      place: r.area_name ?? 'Open hotspot',
      lat: r.latitude,
      lng: r.longitude,
      raised: r.funding_raised_tzs ?? 0,
      target: r.funding_goal_tzs || BOUNTY_RULE.defaultTarget[currency] || 15000,
      backers: r.funding_contributors ?? 0,
      currency,
      reportId: r.id,
      image: r.image_url,
    })
  }

  // C. Upcoming cleanups.
  for (const e of events) {
    out.push({
      type: 'event',
      id: `event-${e.id}`,
      city: e.city ?? 'nairobi',
      at: e.event_date,
      title: e.title,
      when: e.event_date,
      place: e.location,
      blurb: e.description ?? undefined,
      kicker: 'Cleanup',
      cta: { label: 'I’ll be there', action: 'rsvp' },
      eventId: e.id,
      going: going.get(e.id),
    })
  }
  return out
}

/* ------------------------------------------------------ curated (team-edited) */

export const CURATED_FEED: FeedItem[] = [
  {
    type: 'wins',
    id: 'win-s2-results',
    city: 'nairobi',
    at: '2026-08-16',
    emoji: '🏆',
    title: 'Amazing Trash Race S2: the board',
    body: '20 warriors, 11 squads, Mwiki. Top squads by weight collected.',
    // Placeholder standings — replace with the real S2 results.
    demo: true,
    board: {
      metric: 'kg',
      rows: [
        { name: 'Squad Taka Taka', score: '86 kg' },
        { name: 'Mwiki Warriors', score: '71 kg' },
        { name: 'Green Hustlers', score: '64 kg' },
      ],
    },
  },
  {
    type: 'wins',
    id: 'win-app-launch',
    city: 'all',
    at: '2026-11-14',
    emoji: '🚀',
    title: 'Bins, trees and comments are live',
    body: 'Pin a dustbin or a tree from the map, and add photos and comments on any hotspot.',
  },
  {
    type: 'event',
    id: 'race-kampala-teaser',
    city: 'kampala',
    at: '2027-03-01',
    featured: true,
    kicker: 'Race drop · coming soon',
    title: 'Amazing Trash Race comes to Kampala',
    when: '2027-03-01',
    place: 'Kampala · venue TBA',
    blurb: 'Squads, hotspots and a public scoreboard. Back the first Kampala edition.',
    cta: { label: 'Support the race', href: '/funds' },
  },
  {
    type: 'event',
    id: 'race-dar-teaser',
    city: 'dar-es-salaam',
    at: '2027-05-01',
    kicker: 'Race drop · coming soon',
    title: 'Amazing Trash Race: Dar es Salaam',
    when: '2027-05-01',
    place: 'Dar es Salaam · venue TBA',
    cta: { label: 'Support the race', href: '/funds' },
  },
  // ---- Demo cards: show how the feed looks before real funding / photos exist. ----
  {
    type: 'proof',
    id: 'demo-proof-mwiki',
    city: 'all',
    at: '2025-09-01',
    demo: true,
    place: 'Mwiki stage drain',
    impact: '600 kg+ cleared · Trash Race S1',
  },
  {
    type: 'bounty',
    id: 'demo-bounty',
    city: 'all',
    at: '2026-11-10',
    demo: true,
    place: 'Market lane dump',
    lat: -1.2833,
    lng: 36.8167,
    raised: 9600,
    target: 15000,
    backers: 23,
    currency: 'KES',
  },
]

/* --------------------------------------------------------------- helpers */

export const CATEGORY_LABELS: Record<FeedCategory | 'all', { en: string; sw: string }> = {
  all: { en: 'All', sw: 'Zote' },
  proof: { en: 'Before & After', sw: 'Kabla na Baada' },
  bounty: { en: 'Active Bounties', sw: 'Zawadi Hai' },
  event: { en: 'Events & Races', sw: 'Matukio na Mbio' },
  wins: { en: 'Wins & Board', sw: 'Ushindi na Ubao' },
}

const ORDER: FeedCategory[] = ['bounty', 'proof', 'event', 'wins']

/** Merge live + curated for one city: featured first, then real before demo, then by category mix. */
export function assembleFeed(live: FeedItem[], city: string): FeedItem[] {
  const all = [...live, ...CURATED_FEED.filter((i) => i.city === city || i.city === 'all')]
  // Hide a demo card once real items of the same type exist.
  const realTypes = new Set(all.filter((i) => !i.demo).map((i) => i.type))
  const items = all.filter((i) => !i.demo || !realTypes.has(i.type) || i.type === 'wins')
  return items.sort((a, b) => {
    if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1
    if (!!a.demo !== !!b.demo) return a.demo ? 1 : -1
    if (a.type !== b.type) return ORDER.indexOf(a.type) - ORDER.indexOf(b.type)
    return a.type === 'event' ? a.at.localeCompare(b.at) : b.at.localeCompare(a.at)
  })
}
