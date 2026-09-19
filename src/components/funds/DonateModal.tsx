import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { getDonateConfig } from '../../lib/donateConfig'
import { useCity } from '../../lib/CityContext'

interface DonateModalProps {
  open: boolean
  onClose: () => void
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

export function DonateModal({ open, onClose }: DonateModalProps) {
  const city = useCity()
  const config = useMemo(() => getDonateConfig(city), [city])
  const [method, setMethod] = useState<string>(config.money[0]?.id ?? 'usdt')
  const [copied, setCopied] = useState<string | null>(null)
  const activeMoney = config.money.find((m) => m.id === method)

  const handleCopy = async (label: string, value: string) => {
    const ok = await copyText(value)
    setCopied(ok ? label : 'failed')
    window.setTimeout(() => setCopied(null), 2000)
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="donate-overlay"
          className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            key="donate-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="donate-title"
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-teal-400/25 bg-emerald-950 p-5 text-white shadow-xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-300/90">
                  Support the pool
                </p>
                <h2
                  id="donate-title"
                  className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-white"
                >
                  Donate Now
                </h2>
                <p className="mt-1 text-xs text-teal-100/70">{config.orgName}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-teal-200/70 hover:text-white"
                aria-label="Close"
              >
                X
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {config.money.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold ${
                    method === m.id
                      ? 'bg-[#2dd4bf] text-emerald-950'
                      : 'border border-white/15 text-teal-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMethod('usdt')}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold ${
                  method === 'usdt'
                    ? 'bg-[#2dd4bf] text-emerald-950'
                    : 'border border-white/15 text-teal-100'
                }`}
              >
                {config.usdt.label}
              </button>
            </div>

            {activeMoney ? (
              <div className="mt-5 space-y-3 text-sm">
                <p className="text-teal-100/75">{activeMoney.intro}</p>
                <div className="rounded-[var(--radius-card)] border border-dashed border-teal-400/30 bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-teal-300/80">
                    {activeMoney.paybillOrTill}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-wide text-white">
                    {activeMoney.number}
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-teal-200 hover:underline"
                    onClick={() => void handleCopy('till', activeMoney.number)}
                  >
                    Copy number
                  </button>
                </div>
                <p>
                  <span className="text-teal-100/60">Account name · </span>
                  <strong>{activeMoney.accountName}</strong>
                </p>
                <p>
                  <span className="text-teal-100/60">Reference · </span>
                  <strong>{activeMoney.accountReference}</strong>
                </p>
                <ol className="list-decimal space-y-1 pl-4 text-xs text-teal-100/70">
                  {activeMoney.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="mt-5 space-y-3 text-sm">
                <p className="text-teal-100/75">Crypto on-ramp — USDT only on the network below:</p>
                <div className="rounded-[var(--radius-card)] border border-dashed border-orange-400/30 bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gold-300/80">
                    Network · {config.usdt.network}
                  </p>
                  <p className="mt-2 break-all font-mono text-xs leading-relaxed text-white">
                    {config.usdt.address}
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-teal-200 hover:underline"
                    onClick={() => void handleCopy('usdt', config.usdt.address)}
                  >
                    Copy address
                  </button>
                </div>
                <p className="text-xs text-gold-200/90">{config.usdt.note}</p>
              </div>
            )}

            {copied === 'failed' && (
              <p className="mt-3 text-xs text-gold-300">Could not copy — select and copy manually.</p>
            )}
            {copied && copied !== 'failed' && (
              <p className="mt-3 text-xs text-teal-200">Copied.</p>
            )}

            <p className="mt-4 text-[11px] text-teal-100/50">
              After you send, our team logs the donation on the public ledger so the progress
              bar stays honest.
            </p>

            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-[#2dd4bf] py-3 text-sm font-bold text-emerald-950 hover:brightness-110"
              onClick={onClose}
            >
              I have sent — thank you
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
