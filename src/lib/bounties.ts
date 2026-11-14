/**
 * Micro-bounties (migration 025). Neighbours pledge → target reached → bounty opens →
 * a member in good standing claims it → cleans → uploads proof → admin approves → payout.
 */
import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'

export type BountyStatus = 'funding' | 'open' | 'claimed' | 'in_review' | 'paid' | 'cancelled'
export type PayMethod = 'mpesa' | 'usdt' | 'usdc'

export interface BountyProgress {
  id: string
  report_id: string
  city: string
  currency: string
  target_amount: number
  status: BountyStatus
  raised: number
  pending: number
  backers: number
  claimed_by: string | null
  claimed_at: string | null
  claim_expires_at: string | null
  opened_at: string | null
  paid_at: string | null
  created_at: string
}
export interface Backer {
  name: string
  amount: number
  currency: string
  method: string
  confirmed_at: string
}

/* ---------------------------------------------------------------- config */

/** Payment rails. Fill these in when the accounts exist; empty values show "coming soon". */
export const PAYMENT_CONFIG = {
  mpesa: {
    /** Paybill used for the manual fallback (when STK push isn't configured yet). */
    paybill: '',
    accountPrefix: 'RT',
  },
  /** DEMO ONLY: not a real wallet. Replace with the organisation's custody address. */
  crypto: {
    network: 'Tron (TRC-20) · test mode',
    usdtAddress: 'TDEMO0000RamaniTakaNotARealWallet000',
    usdcAddress: 'TDEMO0000RamaniTakaNotARealWallet000',
    live: false,
  },
}

/** Mirrors public.bounty_standing() in SQL. Keep the two in sync. */
export const STANDING_RULES = {
  minAccountDays: 14,
  minPoints: 100,
  minReports: 3,
}
export interface Standing {
  account_days: number
  points: number
  reports: number
  clears: number
  open_claims: number
  eligible: boolean
}

export const QUICK_AMOUNTS: Record<string, number[]> = {
  KES: [100, 250, 500, 1000],
  UGX: [5000, 10000, 20000, 50000],
  TZS: [2000, 5000, 10000, 20000],
}

export const STATUS_COPY: Record<BountyStatus, { label: string; tone: string }> = {
  funding: { label: 'Raising the bounty', tone: 'bg-[#fbbf24] text-[#063b32]' },
  open: { label: 'Bounty open: claim it', tone: 'bg-[#0b8c76] text-white' },
  claimed: { label: 'Claimed: crew on it', tone: 'bg-[#2563eb] text-white' },
  in_review: { label: 'Proof in review', tone: 'bg-[#7c3aed] text-white' },
  paid: { label: 'Paid out · cleaned', tone: 'bg-[#063b32] text-white' },
  cancelled: { label: 'Cancelled', tone: 'bg-white/20 text-white' },
}

export const money = (currency: string, n: number) => `${currency} ${Math.round(n).toLocaleString()}`

/* ----------------------------------------------------------------- reads */

/** Progress for many reports at once (map badges, feed). Empty map if migration 025 isn't run. */
export async function fetchBountiesFor(city: string): Promise<Map<string, BountyProgress>> {
  if (!isSupabaseConfigured) return new Map()
  const { data, error } = await supabase.from('bounty_progress').select('*').eq('city', city).neq('status', 'cancelled')
  if (error || !data) return new Map()
  return new Map((data as BountyProgress[]).map((b) => [b.report_id, normalise(b)]))
}

function normalise(b: BountyProgress): BountyProgress {
  return { ...b, target_amount: Number(b.target_amount), raised: Number(b.raised), pending: Number(b.pending), backers: Number(b.backers) }
}

export function useCityBounties(city: string) {
  const [bounties, setBounties] = useState<Map<string, BountyProgress>>(new Map())
  useEffect(() => {
    let cancelled = false
    const load = () => void fetchBountiesFor(city).then((m) => !cancelled && setBounties(m))
    load()
    const id = window.setInterval(load, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [city])
  return bounties
}

/**
 * One report's bounty, kept live (realtime + 30 s poll as a fallback).
 * `ready === false` means the tables don't exist yet → the UI shows a preview.
 */
export function useBounty(reportId: string) {
  const [bounty, setBounty] = useState<BountyProgress | null>(null)
  const [backers, setBackers] = useState<Backer[]>([])
  const [ready, setReady] = useState<boolean | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return setReady(false)
    const { data, error } = await supabase.from('bounty_progress').select('*').eq('report_id', reportId).maybeSingle()
    if (error) return setReady(false)
    setReady(true)
    const b = data ? normalise(data as BountyProgress) : null
    setBounty(b)
    if (b) {
      const { data: list } = await supabase
        .from('bounty_backers')
        .select('name,amount,currency,method,confirmed_at')
        .eq('bounty_id', b.id)
        .order('confirmed_at', { ascending: false })
        .limit(8)
      setBackers((list ?? []) as Backer[])
    }
  }, [reportId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!cancelled) await load()
    })()
    const poll = window.setInterval(() => void load(), 30_000)
    const channel = isSupabaseConfigured
      ? supabase
          .channel(`bounty-${reportId}-${Math.random().toString(36).slice(2)}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'hotspot_bounties', filter: `report_id=eq.${reportId}` }, () => void load())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'bounty_pledges' }, () => void load())
          .subscribe()
      : null
    return () => {
      cancelled = true
      window.clearInterval(poll)
      if (channel) void supabase.removeChannel(channel)
    }
  }, [load, reportId])

  return { bounty, backers, ready, reload: load }
}

export async function fetchStanding(userId: string): Promise<Standing | null> {
  const { data, error } = await supabase.rpc('bounty_standing', { uid: userId })
  return error ? null : (data as Standing)
}

/* ---------------------------------------------------------------- writes */

export async function createPledge(input: {
  bountyId: string
  userId: string
  displayName: string | null
  amount: number
  currency: string
  method: PayMethod
  phone?: string
  txHash?: string
}) {
  const { data, error } = await supabase
    .from('bounty_pledges')
    .insert({
      bounty_id: input.bountyId,
      user_id: input.userId,
      display_name: input.displayName,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      payer_phone: input.phone ?? null,
      provider_ref: input.txHash ?? null,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

/** Fires the STK push. Returns false if M-Pesa isn't configured yet (show Paybill fallback). */
export async function startMpesaPush(pledgeId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('mpesa-stk-push', { body: { pledgeId } })
  if (error) return false
  if (data?.error) throw new Error(data.error)
  return Boolean(data?.configured)
}

export async function claimBounty(bountyId: string) {
  const { data, error } = await supabase.rpc('claim_bounty', { p_bounty: bountyId })
  if (error) throw error
  return data as string
}

export async function myOpenClaim(bountyId: string, userId: string) {
  const { data } = await supabase
    .from('bounty_claims')
    .select('id,status')
    .eq('bounty_id', bountyId)
    .eq('user_id', userId)
    .in('status', ['claimed', 'submitted'])
    .maybeSingle()
  return data as { id: string; status: string } | null
}

export async function submitProof(claimId: string, imageUrl: string, note: string, payout: PayMethod) {
  const { error } = await supabase.rpc('submit_bounty_proof', { p_claim: claimId, p_image: imageUrl, p_note: note, p_payout: payout })
  if (error) throw error
}

/* ------------------------------------------------------------ admin only */

export async function createBounty(reportId: string, city: string, currency: string, target: number, userId: string) {
  const { error } = await supabase
    .from('hotspot_bounties')
    .insert({ report_id: reportId, city, currency, target_amount: target, created_by: userId })
  if (error) throw error
}

/* ------------------------------------------------------- suggested target */

/**
 * A per-spot starting estimate (admins can change it), instead of one generic number.
 * cost ≈ crew day + bags/transport, scaled by severity (0–10) and how many neighbours confirmed it.
 * Amounts are in KES; other currencies are converted with rough fixed rates.
 */
const PER_KES: Record<string, number> = { KES: 1, UGX: 28.5, TZS: 20 }
export function suggestTarget(r: { severity_score: number; seen_count?: number | null }, currency: string): number {
  const sev = Math.max(1, Math.min(10, r.severity_score || 5))
  const base = 3000 // gloves, bags, water for a small crew
  const perSeverity = 1200 // labour + transport grows with the size of the pile
  const crowd = Math.min(5, r.seen_count ?? 0) * 300 // spots many people see are usually bigger
  const kes = base + sev * perSeverity + crowd
  const rate = PER_KES[currency] ?? 1
  const step = currency === 'KES' ? 500 : 10000
  return Math.round((kes * rate) / step) * step
}
