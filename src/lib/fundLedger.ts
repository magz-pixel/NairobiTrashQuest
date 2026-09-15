import type { FundEntry } from '../types/database'

const LOCAL_KEY = 'fix_nairobi_fund_entries_v1'

const SEED: Omit<FundEntry, 'id' | 'created_at' | 'created_by' | 'voided'>[] = [
  {
    kind: 'donation',
    amount_kes: 50_000,
    donor_or_payee: 'XPNC Partnership seed',
    note: 'Season 2 operating float',
  },
  {
    kind: 'donation',
    amount_kes: 25_000,
    donor_or_payee: 'Community donor circle',
    note: 'Amazing Trash Race prep',
  },
  {
    kind: 'donation',
    amount_kes: 10_000,
    donor_or_payee: 'Anonymous supporter',
    note: 'General Fix Nairobi fund',
  },
  {
    kind: 'expense',
    amount_kes: 12_000,
    donor_or_payee: 'Cleanup kit procurement',
    note: 'Gloves, bags, vests — Race S2',
  },
  {
    kind: 'expense',
    amount_kes: 8_000,
    donor_or_payee: 'Print & zone materials',
    note: 'Maps and marshal sheets',
  },
]

function nowIso() {
  return new Date().toISOString()
}

function uid() {
  return crypto.randomUUID()
}

export function loadLocalFundEntries(): FundEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw) as FundEntry[]
  } catch {
    /* ignore */
  }
  const seeded: FundEntry[] = SEED.map((row, i) => ({
    ...row,
    id: `local-fund-${i + 1}`,
    voided: false,
    created_by: null,
    created_at: new Date(Date.now() - (SEED.length - i) * 86_400_000).toISOString(),
  }))
  localStorage.setItem(LOCAL_KEY, JSON.stringify(seeded))
  return seeded
}

export function saveLocalFundEntries(entries: FundEntry[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entries))
}

export function addLocalFundEntry(
  partial: Pick<FundEntry, 'kind' | 'amount_kes' | 'donor_or_payee' | 'note'>,
): FundEntry {
  const entries = loadLocalFundEntries()
  const next: FundEntry = {
    id: uid(),
    kind: partial.kind,
    amount_kes: partial.amount_kes,
    donor_or_payee: partial.donor_or_payee,
    note: partial.note,
    voided: false,
    created_by: null,
    created_at: nowIso(),
  }
  const updated = [next, ...entries]
  saveLocalFundEntries(updated)
  return next
}

export function voidLocalFundEntry(id: string) {
  const entries = loadLocalFundEntries().map((e) =>
    e.id === id ? { ...e, voided: true } : e,
  )
  saveLocalFundEntries(entries)
}

export function summarizeFunds(entries: FundEntry[]) {
  const active = entries.filter((e) => !e.voided)
  const raised = active
    .filter((e) => e.kind === 'donation')
    .reduce((s, e) => s + Number(e.amount_kes), 0)
  const spent = active
    .filter((e) => e.kind === 'expense')
    .reduce((s, e) => s + Number(e.amount_kes), 0)
  return { raised, spent, remaining: raised - spent }
}

export function formatKes(amount: number) {
  return `KSh ${Math.round(amount).toLocaleString('en-KE')}`
}

/** Season 2 community fund campaign target (KES). Edit here until admin settings exist. */
export const FUND_TARGET_KES = 500_000

