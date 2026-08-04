import type { FundingState } from '../../hooks/useDemoFunding'
import { marketConfig } from '../../lib/marketConfig'
import { t } from '../../lib/i18n'
import { Button } from '../ui/Button'

interface CrowdfundPanelProps {
  funding: FundingState
  onContribute: () => void
}

function formatTzs(amount: number): string {
  return `${marketConfig.currency.symbol} ${amount.toLocaleString()}`
}

export function CrowdfundPanel({ funding, onContribute }: CrowdfundPanelProps) {
  const pct = Math.min(100, Math.round((funding.raised / funding.goal) * 100))
  const fullyFunded = funding.raised >= funding.goal

  return (
    <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-gradient-to-br from-teal-50 to-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-teal)]">
        Crowd-funded cleanup
      </p>

      {fullyFunded ? (
        <p className="mt-2 rounded-lg bg-teal-100 px-2 py-1.5 text-xs font-semibold text-[var(--brand-teal)]">
          {t('goalReached')}
        </p>
      ) : null}

      <div className="mt-2">
        <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
          <span className="font-bold text-[var(--text-primary)]">
            {formatTzs(funding.raised)}
          </span>
          <span className="text-[var(--text-muted)]">
            {t('raisedOf')} {formatTzs(funding.goal)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-[var(--brand-teal)] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
          {funding.contributors} {t('contributors')} · {pct}%
        </p>
      </div>

      {!fullyFunded && (
        <Button type="button" className="mt-3 w-full" onClick={onContribute}>
          {t('contribute')}
        </Button>
      )}
    </div>
  )
}
