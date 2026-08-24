import { useEffect, useSyncExternalStore } from 'react'
import type { FundingState } from '../../hooks/useDemoFunding'
import { marketConfig } from '../../lib/marketConfig'
import { t } from '../../lib/i18n'
import { Button } from '../ui/Button'

export type MockPaymentMethod = 'mpesa' | 'card' | 'crypto'

const PAYMENT_METHODS: { id: MockPaymentMethod; label: string; hint: string }[] = [
  { id: 'mpesa', label: 'M-Pesa', hint: 'Mobile money' },
  { id: 'card', label: 'Card', hint: 'Visa / Mastercard' },
  { id: 'crypto', label: 'Crypto', hint: 'USDC / BTC' },
]

/** Demo contribution applied after a mock payment method succeeds. */
export const DEMO_CONTRIBUTE_AMOUNT = 2_000

type Phase = 'idle' | 'methods' | 'processing' | 'success'

/** Survives Leaflet popup remounts when content height changes. */
type PanelUi = { phase: Phase; method: MockPaymentMethod | null }
const IDLE_UI: PanelUi = { phase: 'idle', method: null }
const panelUiByKey = new Map<string, PanelUi>()
const panelUiListeners = new Set<() => void>()

function emitPanelUi() {
  for (const listener of panelUiListeners) listener()
}

function subscribePanelUi(listener: () => void) {
  panelUiListeners.add(listener)
  return () => panelUiListeners.delete(listener)
}

function getPanelUi(key: string | undefined): PanelUi {
  if (!key) return IDLE_UI
  return panelUiByKey.get(key) ?? IDLE_UI
}

function setPanelUi(key: string | undefined, next: PanelUi) {
  if (!key) return
  panelUiByKey.set(key, next)
  emitPanelUi()
}

interface CrowdfundPanelProps {
  funding: FundingState
  /** Called when Contribute is tapped (report flow / external modal). */
  onContribute: () => void
  /**
   * When true, Contribute expands into M-Pesa / Card / Crypto mock buttons
   * instead of only invoking onContribute. Used by fundable hotspot popups.
   */
  enablePaymentMethods?: boolean
  /**
   * Stable id for payment UI state (e.g. hotspot id). Required when
   * enablePaymentMethods is set so phase survives Leaflet popup remounts.
   */
  paymentStateKey?: string
  /** Fired after a mock method simulates success (updates session funding). */
  onMockPaymentSuccess?: (amount: number, method: MockPaymentMethod) => void
}

function formatMoney(amount: number): string {
  return `${marketConfig.currency.symbol} ${amount.toLocaleString()}`
}

export function CrowdfundPanel({
  funding,
  onContribute,
  enablePaymentMethods = false,
  paymentStateKey,
  onMockPaymentSuccess,
}: CrowdfundPanelProps) {
  const pct = Math.min(100, Math.round((funding.raised / funding.goal) * 100))
  const fullyFunded = funding.raised >= funding.goal

  const ui = useSyncExternalStore(
    subscribePanelUi,
    () => getPanelUi(paymentStateKey),
    () => getPanelUi(paymentStateKey),
  )
  const phase = enablePaymentMethods ? ui.phase : 'idle'
  const selectedMethod = enablePaymentMethods ? ui.method : null

  useEffect(() => {
    if (!enablePaymentMethods || !paymentStateKey) return
    if (phase !== 'success') return
    const timer = window.setTimeout(() => {
      setPanelUi(paymentStateKey, { phase: 'idle', method: null })
    }, 2800)
    return () => window.clearTimeout(timer)
  }, [enablePaymentMethods, paymentStateKey, phase])

  const handleContributeClick = () => {
    if (enablePaymentMethods && paymentStateKey) {
      setPanelUi(paymentStateKey, { phase: 'methods', method: null })
      return
    }
    onContribute()
  }

  const handleMethodClick = (method: MockPaymentMethod) => {
    if (!paymentStateKey) return
    setPanelUi(paymentStateKey, { phase: 'processing', method })
    window.setTimeout(() => {
      onMockPaymentSuccess?.(DEMO_CONTRIBUTE_AMOUNT, method)
      setPanelUi(paymentStateKey, { phase: 'success', method })
    }, 900)
  }

  const methodLabel =
    PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.label ?? 'Payment'

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
            {formatMoney(funding.raised)}
          </span>
          <span className="text-[var(--text-muted)]">
            {t('raisedOf')} {formatMoney(funding.goal)}
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

      {!fullyFunded && phase === 'idle' && (
        <Button type="button" className="mt-3 min-h-[44px] w-full" onClick={handleContributeClick}>
          {t('contribute')}
        </Button>
      )}

      {!fullyFunded && phase === 'methods' && (
        <div className="mt-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Choose payment method
          </p>
          <div className="grid grid-cols-1 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => handleMethodClick(method.id)}
                className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2 text-left transition-colors hover:border-[var(--brand-teal)] hover:bg-teal-50/80"
              >
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {method.label}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">{method.hint}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="min-h-[44px] w-full text-xs font-semibold text-[var(--text-muted)] underline"
            onClick={() => setPanelUi(paymentStateKey, { phase: 'idle', method: null })}
          >
            Cancel
          </button>
        </div>
      )}

      {!fullyFunded && phase === 'processing' && (
        <p className="mt-3 rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-3 text-center text-xs font-medium text-[var(--text-muted)]">
          Simulating {methodLabel}…
        </p>
      )}

      {phase === 'success' && (
        <div className="mt-3 rounded-lg bg-teal-100 px-3 py-3 text-center">
          <p className="text-sm font-semibold text-[var(--brand-teal)]">{t('paymentSuccess')}</p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            {formatMoney(DEMO_CONTRIBUTE_AMOUNT)} via {methodLabel} · demo only
          </p>
        </div>
      )}
    </div>
  )
}
