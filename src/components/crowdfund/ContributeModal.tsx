import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { marketConfig } from '../../lib/marketConfig'
import { t } from '../../lib/i18n'
import { Button } from '../ui/Button'

type Provider = 'mpesa' | 'tigo'
type Step = 'form' | 'confirm' | 'success'

const PRESETS = [500, 2_000, 5_000, 10_000]

interface ContributeModalProps {
  open: boolean
  areaName: string
  onClose: () => void
  onSuccess: (amount: number) => void
}

function formatTzs(amount: number): string {
  return `${marketConfig.currency.symbol} ${amount.toLocaleString()}`
}

export function ContributeModal({
  open,
  areaName,
  onClose,
  onSuccess,
}: ContributeModalProps) {
  const [step, setStep] = useState<Step>('form')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState(2_000)
  const [provider, setProvider] = useState<Provider>('mpesa')
  const [processing, setProcessing] = useState(false)

  const reset = () => {
    setStep('form')
    setPhone('')
    setAmount(2_000)
    setProvider('mpesa')
    setProcessing(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleConfirm = () => {
    setProcessing(true)
    window.setTimeout(() => {
      setProcessing(false)
      setStep('success')
      onSuccess(amount)
    }, 1200)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close contribute"
            className="fixed inset-0 z-[1600] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed inset-x-4 top-1/2 z-[1700] mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-md)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {step === 'success' ? (
              <div className="py-4 text-center">
                <p className="text-3xl">✓</p>
                <p className="mt-2 text-sm font-semibold text-[var(--brand-teal)]">
                  {t('paymentSuccess')}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {formatTzs(amount)} · {areaName}
                </p>
                <Button type="button" className="mt-4 w-full" onClick={handleClose}>
                  Done
                </Button>
              </div>
            ) : step === 'confirm' ? (
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {t('mpesaConfirm')}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  {provider === 'mpesa' ? 'M-Pesa' : 'Tigo Pesa'} · {phone || '—'}
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                  {formatTzs(amount)}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{areaName}</p>
                <div className="mt-4 flex flex-col gap-2">
                  <Button type="button" disabled={processing} onClick={handleConfirm}>
                    {processing ? t('processing') : t('sendPayment')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={processing}
                    onClick={() => setStep('form')}
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {t('contributeTitle')}
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{areaName}</p>

                <label className="mt-3 block text-xs font-medium text-[var(--text-muted)]">
                  {t('providerLabel')}
                </label>
                <div className="mt-1 flex gap-2">
                  {(
                    [
                      { id: 'mpesa', label: 'M-Pesa' },
                      { id: 'tigo', label: 'Tigo Pesa' },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id)}
                      className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold ${
                        provider === p.id
                          ? 'border-[var(--brand-teal)] bg-teal-50 text-[var(--brand-teal)]'
                          : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <label className="mt-3 block text-xs font-medium text-[var(--text-muted)]">
                  {t('phoneLabel')}
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="07XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-teal)]"
                />

                <label className="mt-3 block text-xs font-medium text-[var(--text-muted)]">
                  {t('amountLabel')}
                </label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                        amount === preset
                          ? 'border-[var(--brand-teal)] bg-teal-50 text-[var(--brand-teal)]'
                          : 'border-[var(--border-subtle)] text-[var(--text-primary)]'
                      }`}
                    >
                      {formatTzs(preset)}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    type="button"
                    disabled={phone.trim().length < 9}
                    onClick={() => setStep('confirm')}
                  >
                    {t('mpesaConfirm')}
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleClose}>
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
