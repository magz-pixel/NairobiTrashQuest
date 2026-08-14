import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthGate } from '../components/auth/AuthGate'
import { SiteFooter, SiteNav } from '../components/site/SiteNav'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useFundLedger } from '../hooks/useFundLedger'
import { formatKes } from '../lib/fundLedger'
import { isSupabaseConfigured } from '../lib/supabase'

function LedgerManageInner() {
  const { profile, signOut, loading } = useAuth()
  const { entries, addEntry, voidEntry, usingLocal, refetch } = useFundLedger()
  const [kind, setKind] = useState<'donation' | 'expense'>('donation')
  const [amount, setAmount] = useState('')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isAdmin = Boolean(profile?.is_admin) || usingLocal

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount_kes = Number(amount)
    if (!name.trim() || !amount_kes || amount_kes <= 0) {
      setStatus('Enter a valid name and amount.')
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      await addEntry({
        kind,
        amount_kes,
        donor_or_payee: name.trim(),
        note: note.trim() || undefined,
      })
      setAmount('')
      setName('')
      setNote('')
      setStatus('Saved to ledger.')
      await refetch()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-teal-100/60">Checking admin access…</p>
  }

  if (!isAdmin && !usingLocal) {
    return (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-950/40 p-6 text-amber-100">
        <p className="font-semibold">Admin access required</p>
        <p className="mt-2 text-sm text-amber-100/80">
          Your profile needs <code className="text-amber-200">is_admin = true</code> in
          Supabase to edit the shared ledger. Ask Arnold to flag your account, or use local
          seed mode until migration 006 is applied.
        </p>
        <button
          type="button"
          className="mt-4 text-sm underline"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {usingLocal && (
        <p className="rounded-lg border border-amber-400/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          Local ledger mode (browser only). Run{' '}
          <code>supabase/migrations/006_fund_ledger.sql</code> for the shared live ledger.
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
          Log entry
        </h2>
        <div className="flex gap-2">
          {(['donation', 'expense'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize ${
                kind === k
                  ? 'bg-[#2dd4bf] text-[#042f2e]'
                  : 'border border-white/15 text-teal-100'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <label className="block text-xs text-teal-200/80">
          Amount (KES)
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-[#071613] px-3 py-2 text-white"
            required
          />
        </label>
        <label className="block text-xs text-teal-200/80">
          Donor / payee
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-[#071613] px-3 py-2 text-white"
            required
          />
        </label>
        <label className="block text-xs text-teal-200/80">
          Note
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-[#071613] px-3 py-2 text-white"
            placeholder="Optional"
          />
        </label>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Saving…' : 'Add to ledger'}
        </Button>
        {status && <p className="text-sm text-[#5eead4]">{status}</p>}
      </form>

      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
          All entries
        </h2>
        <ul className="mt-3 divide-y divide-white/10 border-t border-white/10">
          {entries.map((e) => (
            <li
              key={e.id}
              className={`flex flex-wrap items-center justify-between gap-2 py-3 ${
                e.voided ? 'opacity-40' : ''
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-white">
                  {e.kind} · {e.donor_or_payee} · {formatKes(Number(e.amount_kes))}
                </p>
                <p className="text-xs text-teal-100/60">{e.note}</p>
              </div>
              {!e.voided && (
                <button
                  type="button"
                  className="text-xs text-orange-300 hover:underline"
                  onClick={() => void voidEntry(e.id)}
                >
                  Void
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <button type="button" className="text-sm text-teal-200 underline" onClick={() => void signOut()}>
        Sign out
      </button>
    </div>
  )
}

export function FundsManagePage() {
  return (
    <div className="min-h-full bg-[#071613] text-[#e8f5f1]">
      <SiteNav />
      <main className="mx-auto max-w-lg px-4 py-12 md:px-6">
        <Link to="/funds" className="text-sm text-teal-300 hover:text-white">
          ← Public ledger
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-white">
          Team ledger console
        </h1>
        <p className="mt-2 text-sm text-teal-100/70">
          Sign in to log donations and expenses. Admins only on the shared Supabase ledger.
        </p>
        <div className="mt-8">
          {!isSupabaseConfigured ? (
            <LedgerManageInner />
          ) : (
            <AuthGate>
              <LedgerManageInner />
            </AuthGate>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
