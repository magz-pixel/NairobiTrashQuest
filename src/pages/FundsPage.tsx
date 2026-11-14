import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DonateModal } from '../components/funds/DonateModal'
import { BountyGallery } from '../components/funds/BountyGallery'
import { CampaignGrid, SpendBreakdown } from '../components/funds/FundModules'
import { CAMPAIGNS } from '../data/fundCampaigns'
import { useReports } from '../hooks/useReports'
import { useCityBounties } from '../lib/bounties'
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
  const { feed, totals, loading, usingLocal, entries } = useFundLedger(city.slug)
  const [donateOpen, setDonateOpen] = useState(false)
  const bounties = useCityBounties(city.slug)
  const { allReports } = useReports('all', 'all', city.slug)
  const campaigns = useMemo(() => CAMPAIGNS.filter((c) => c.city === city.slug || c.city === 'all'), [city.slug])
  const b = useMemo(() => {
    const all = [...bounties.values()]
    return {
      raised: all.reduce((x, y) => x + y.raised, 0),
      live: all.filter((y) => y.status === 'funding' || y.status === 'open').length,
      paid: all.filter((y) => y.status === 'paid').reduce((x, y) => x + y.target_amount, 0),
    }
  }, [bounties])
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
                Support the work <span>→</span>
              </button>
              <a href="#bounty-drops" className="fn-action fn-action-light">
                Fund a hotspot
              </a>
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
        {/* Modular sections: reorder or remove entries in FUND_SECTIONS below. */}
        {FUND_SECTIONS.map((id) => {
          const section: Record<FundSection, ReactNode> = {
            bounties: (
              <Block key={id} id="bounty-drops" label="Bounty drops" title="Hotspots you can fund right now" tint>
                <p className="-mt-3 mb-6 max-w-2xl text-sm leading-6 text-[#5d746e]">
                  Every spot here is a real place on the map. Pledge until it hits its target, then a verified local crew claims it,
                  cleans it, and gets paid. {b.live} live · {money(b.raised)} pledged so far.
                </p>
                <BountyGallery bounties={bounties} reports={allReports} reportPath={(rid) => path(`/report/${rid}`)} mapPath={path('/map')} />
              </Block>
            ),
            campaigns: campaigns.length ? (
              <Block key={id} label="What we're raising for" title="Campaigns">
                <CampaignGrid campaigns={campaigns} entries={entries} currency={city.currency.code} onDonate={() => setDonateOpen(true)} />
              </Block>
            ) : null,
            spending: (
              <Block key={id} label="Where the money goes" title="Spending, by what it paid for" tint>
                <SpendBreakdown entries={entries} bountiesPaid={b.paid} format={money} />
              </Block>
            ),
          }
          return section[id]
        })}
        <section className="fn-panel-dark bg-[#063b32] px-5 py-16 text-white sm:px-8 lg:px-12">
          {city.fundCampaignLive ? (
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-center">
            <div>
              <SectionLabel>{city.chapterName} general fund</SectionLabel>
              <h2 className="fn-display mt-4 text-4xl font-extrabold tracking-[-.03em]">
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
          ) : (
            <div className="mx-auto max-w-7xl">
              <SectionLabel>Campaign</SectionLabel>
              <h2 className="fn-display mt-4 text-4xl font-extrabold">Launching soon</h2>
              <p className="mt-4 max-w-xl leading-7 text-teal-100/75">
                {city.chapterName} does not have a live fundraising target yet. Money that has already been logged still shows in the ledger below.
              </p>
            </div>
          )}
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
                      {e.created_by ? ' · logged by a signed-in team member' : ''}
                      {e.kind === 'expense' ? ' · receipt photo not attached' : ''}
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

type FundSection = 'bounties' | 'campaigns' | 'spending'
/** Page order. The org-wide totals, chapter campaign and ledger always show around these. */
const FUND_SECTIONS: FundSection[] = ['bounties', 'campaigns', 'spending']

function Block({ id, label, title, tint, children }: { id?: string; label: string; title: string; tint?: boolean; children: ReactNode }) {
  return (
    <section id={id} className={`px-5 py-12 sm:px-8 lg:px-12 ${tint ? 'bg-[#e5f0eb]' : ''}`}>
      <div className="mx-auto max-w-7xl">
        <SectionLabel>{label}</SectionLabel>
        <h2 className="fn-display mb-6 mt-3 text-3xl font-extrabold tracking-[-.03em] text-[#063b32]">{title}</h2>
        {children}
      </div>
    </section>
  )
}
