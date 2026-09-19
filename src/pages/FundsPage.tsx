import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DonateModal } from '../components/funds/DonateModal'
import { FundProgressBar } from '../components/funds/FundProgressBar'
import { SiteFooter } from '../components/site/SiteNav'
import { PageIntro, PublicShell, SectionLabel, StatTile, StatusChip } from '../components/site/PagePrimitives'
import { useFundLedger } from '../hooks/useFundLedger'
import { useCity, useCityPath } from '../lib/CityContext'
import { formatCityMoney } from '../lib/cities'
import { getDonateConfig } from '../lib/donateConfig'

export function FundsPage() {
  const city = useCity()
  const path = useCityPath()
  const money = (n: number) => formatCityMoney(n, city)
  const target = city.fundTarget
  const { feed, totals, loading, usingLocal } = useFundLedger(city.slug)
  const [donateOpen, setDonateOpen] = useState(false)
  const donateLabels = getDonateConfig(city)
    .money.map((m) => m.label)
    .concat('USDT')
    .join(', ')

  return (
    <PublicShell footer={false}>
      <main>
        <PageIntro
          eyebrow="Public money, public record"
          title="Follow every shilling."
          body={`The ${city.chapterName} fund supports cleanup kits, race operations, and the practical work behind each field action. This ledger stays open so support can be trusted.`}
          action={
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setDonateOpen(true)} className="fn-action fn-action-gold">
                Support the work <span>↗</span>
              </button>
              <Link to={path('/funds/manage')} className="fn-action fn-action-light">
                Team console
              </Link>
            </div>
          }
        />
        <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 lg:px-12">
          <div className="grid gap-5 md:grid-cols-3">
            <StatTile
              label="Raised to date"
              value={money(totals.raised)}
              detail={`of ${money(target)} target`}
              accent="gold"
            />
            <StatTile label="Spent in the field" value={money(totals.spent)} detail="logged expenses" accent="coral" />
            <StatTile
              label="Available balance"
              value={money(totals.remaining)}
              detail="ready for the next action"
              accent="teal"
            />
          </div>
        </section>
        <section className="fn-panel-dark bg-[#063b32] px-5 py-16 text-white sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-center">
            <div>
              <SectionLabel>Season 2 campaign</SectionLabel>
              <h2 className="fn-display mt-4 text-4xl font-extrabold tracking-[-.05em]">
                The ledger is part of the impact.
              </h2>
              <p className="mt-4 leading-7 text-teal-100/75">
                Donations become visible supplies, transport, gloves, bags, and field coordination. The record
                explains what moved and why.
              </p>
            </div>
            <div className="rounded-[2rem] bg-white/10 p-7 backdrop-blur-sm">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-teal-200">Campaign progress</p>
                  <p className="mt-3 text-3xl font-extrabold">{money(totals.raised)}</p>
                </div>
                <p className="text-4xl font-extrabold text-gold-300">
                  {Math.round((totals.raised / target) * 100)}%
                </p>
              </div>
              <div className="mt-6">
                <FundProgressBar raised={totals.raised} target={target} formatMoney={money} />
              </div>
              <button
                type="button"
                onClick={() => setDonateOpen(true)}
                className="mt-6 w-full rounded-xl bg-gold-400 py-4 font-extrabold text-[#063b32]"
              >
                Donate via {donateLabels}
              </button>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionLabel>Stamped public</SectionLabel>
              <h2 className="fn-display mt-3 text-3xl font-extrabold text-[#063b32]">Recent ledger activity</h2>
            </div>
            {usingLocal && <StatusChip tone="gold">Local seed data</StatusChip>}
          </div>
          <div className="mt-7 overflow-hidden rounded-[1.5rem] bg-white shadow-[var(--shadow-card)]">
            <ul className="divide-y divide-[#e5efeb]">
              {loading && <li className="p-6 text-sm text-[#617972]">Loading entries…</li>}
              {!loading && feed.length === 0 && <li className="p-6 text-sm text-[#617972]">No entries yet.</li>}
              {feed.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-bold text-[#063b32]">{e.donor_or_payee}</p>
                    <p className="mt-1 text-xs text-[#71867f]">
                      {e.kind === 'donation' ? 'Donation' : 'Expense'}
                      {e.note ? ` · ${e.note}` : ''} · {new Date(e.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p
                    className={`font-extrabold tabular-nums ${e.kind === 'donation' ? 'text-[#087766]' : 'text-[#b47708]'}`}
                  >
                    {e.kind === 'donation' ? '+' : '−'}
                    {money(Number(e.amount_kes))}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-5 text-sm text-[#617972]">
            Raised {money(totals.raised)} · Spent {money(totals.spent)} · Remaining {money(totals.remaining)}
          </p>
        </section>
      </main>
      <SiteFooter />
      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
    </PublicShell>
  )
}
