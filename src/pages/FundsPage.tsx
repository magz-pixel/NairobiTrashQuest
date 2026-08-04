import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DonateModal } from '../components/funds/DonateModal'
import { FundProgressBar } from '../components/funds/FundProgressBar'
import { FundsCounterStrip } from '../components/funds/FundsCounterStrip'
import { SiteFooter, SiteNav } from '../components/site/SiteNav'
import { useFundLedger } from '../hooks/useFundLedger'
import { FUND_TARGET_KES, formatKes } from '../lib/fundLedger'

export function FundsPage() {
  const { feed, totals, loading, usingLocal } = useFundLedger()
  const [donateOpen, setDonateOpen] = useState(false)

  return (
    <div className="fn-landing min-h-full bg-[#071613] text-[#e8f5f1]">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-300/90">
          Accountability
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold text-white md:text-5xl">
          Community fund ledger
        </h1>
        <p className="mt-3 max-w-2xl text-teal-100/75">
          Public view of money raised and major spends for Fix Nairobi & XPNC. Team members
          with admin access update the ledger after gifts land.
        </p>

        <div className="mt-8 max-w-xl space-y-6">
          <div className="rounded-2xl border border-dashed border-teal-400/35 bg-[#0c1f1c] p-5 md:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-300/90">
              Campaign target · Season 2
            </p>
            <div className="mt-4">
              <FundProgressBar raised={totals.raised} target={FUND_TARGET_KES} />
            </div>
            <button
              type="button"
              onClick={() => setDonateOpen(true)}
              className="mt-6 w-full rounded-xl bg-[#2dd4bf] py-4 text-center text-base font-extrabold uppercase tracking-wide text-[#042f2e] shadow-lg transition hover:brightness-110"
            >
              Donate Now
            </button>
            <p className="mt-2 text-center text-[11px] text-teal-100/55">
              M-Pesa · USDT — details on the next screen
            </p>
          </div>

          <FundsCounterStrip compact />
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            to="/funds/manage"
            className="rounded-lg border border-white/15 px-4 py-2 font-semibold text-teal-100 hover:bg-white/5"
          >
            Team: update ledger
          </Link>
          {usingLocal && (
            <span className="rounded-lg border border-amber-400/40 px-3 py-2 text-amber-200">
              Showing local seed ledger — run migration 006 in Supabase for shared live data.
            </span>
          )}
        </div>

        <h2 className="mt-12 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
          Recent activity
        </h2>
        <ul className="mt-4 divide-y divide-white/10 border-t border-white/10">
          {loading && <li className="py-4 text-teal-100/60">Loading…</li>}
          {!loading && feed.length === 0 && (
            <li className="py-4 text-teal-100/60">No entries yet.</li>
          )}
          {feed.map((e) => (
            <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
              <div>
                <p className="font-semibold text-white">{e.donor_or_payee}</p>
                <p className="text-xs text-teal-100/60">
                  {e.kind === 'donation' ? 'Donation' : 'Expense'}
                  {e.note ? ` · ${e.note}` : ''}
                  {' · '}
                  {new Date(e.created_at).toLocaleString()}
                </p>
              </div>
              <p
                className={`font-bold tabular-nums ${
                  e.kind === 'donation' ? 'text-[#5eead4]' : 'text-orange-300'
                }`}
              >
                {e.kind === 'donation' ? '+' : '−'}
                {formatKes(Number(e.amount_kes))}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-teal-100/60">
          Raised {formatKes(totals.raised)} · Spent {formatKes(totals.spent)} · Remaining{' '}
          {formatKes(totals.remaining)} · Target {formatKes(FUND_TARGET_KES)}
        </p>
      </main>
      <SiteFooter />
      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
    </div>
  )
}
