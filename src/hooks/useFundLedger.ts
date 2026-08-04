import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { FundEntry } from '../types/database'
import {
  addLocalFundEntry,
  loadLocalFundEntries,
  summarizeFunds,
  voidLocalFundEntry,
} from '../lib/fundLedger'

export function useFundLedger() {
  const [entries, setEntries] = useState<FundEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [usingLocal, setUsingLocal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyLocal = useCallback(() => {
    setUsingLocal(true)
    setEntries(loadLocalFundEntries())
  }, [])

  const refetch = useCallback(async () => {
    setError(null)
    if (!isSupabaseConfigured) {
      applyLocal()
      setLoading(false)
      return
    }
    const { data, error: qErr } = await supabase
      .from('fund_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (qErr) {
      // Table missing or RLS — fall back so landing still works tonight
      applyLocal()
      setError(qErr.message)
      setLoading(false)
      return
    }
    setUsingLocal(false)
    setEntries((data ?? []) as FundEntry[])
    setLoading(false)
  }, [applyLocal])

  useEffect(() => {
    void refetch()
  }, [refetch])

  useEffect(() => {
    if (!isSupabaseConfigured || usingLocal) return
    // Unique name: FundsPage + FundsCounterStrip both mount this hook
    const channel = supabase
      .channel(`fund_entries_live_${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fund_entries' },
        () => {
          void refetch()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refetch, usingLocal])

  const addEntry = async (input: {
    kind: 'donation' | 'expense'
    amount_kes: number
    donor_or_payee: string
    note?: string
  }) => {
    if (usingLocal || !isSupabaseConfigured) {
      addLocalFundEntry({
        kind: input.kind,
        amount_kes: input.amount_kes,
        donor_or_payee: input.donor_or_payee,
        note: input.note ?? null,
      })
      setEntries(loadLocalFundEntries())
      return
    }
    const { error: insErr } = await supabase.from('fund_entries').insert({
      kind: input.kind,
      amount_kes: input.amount_kes,
      donor_or_payee: input.donor_or_payee,
      note: input.note ?? null,
    })
    if (insErr) throw new Error(insErr.message)
    await refetch()
  }

  const voidEntry = async (id: string) => {
    if (usingLocal || !isSupabaseConfigured) {
      voidLocalFundEntry(id)
      setEntries(loadLocalFundEntries())
      return
    }
    const { error: updErr } = await supabase
      .from('fund_entries')
      .update({ voided: true })
      .eq('id', id)
    if (updErr) throw new Error(updErr.message)
    await refetch()
  }

  const totals = summarizeFunds(entries)
  const feed = entries.filter((e) => !e.voided).slice(0, 12)

  return {
    entries,
    feed,
    totals,
    loading,
    usingLocal,
    error,
    refetch,
    addEntry,
    voidEntry,
  }
}
