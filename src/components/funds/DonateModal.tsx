import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { donateConfig } from '../../lib/donateConfig'

type Method = 'mpesa' | 'usdt'

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
  const [method, setMethod] = useState<Method>('mpesa')
  const [copied, setCopied] = useState<string | null>(null)

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
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-teal-400/25 bg-[#0c1f1c] p-5 text-[#e8f5f1] shadow-xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300/90">
                  Support the pool
                </p>
                <h2
                  id="donate-title"
                  className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-white"
                >
                  Donate Now
                </h2>
                <p className="mt-1 text-xs text-teal-100/70">{donateConfig.orgName}</p>
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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMethod('mpesa')}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold ${
                  method === 'mpesa'
                    ? 'bg-[#2dd4bf] text-[#042f2e]'
                    : 'border border-white/15 text-teal-100'
                }`}
              >
                {donateConfig.mpesa.label}
              </button>
              <button
                type="button"
                onClick={() => setMethod('usdt')}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold ${
                  method === 'usdt'
                    ? 'bg-[#2dd4bf] text-[#042f2e]'
                    : 'border border-white/15 text-teal-100'
                }`}
              >
                {donateConfig.usdt.label}
              </button>
            </div>

            {method === 'mpesa' ? (
              <div className="mt-5 space-y-3 text-sm">
                <p className="text-teal-100/75">Send via M-Pesa using these details:</p>
                <div className="rounded-xl border border-dashed border-teal-400/30 bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-teal-300/80">
                    {donateConfig.mpesa.paybillOrTill}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-wide text-white">
                    {donateConfig.mpesa.number}
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-[#2dd4bf] hover:underline"
                    onClick={() => void handleCopy('till', donateConfig.mpesa.number)}
                  >
                    Copy number
                  </button>
                </div>
                <p>
                  <span className="text-teal-100/60">Account name · </span>
                  <strong>{donateConfig.mpesa.accountName}</strong>
                </p>
                <p>
                  <span className="text-teal-100/60">Reference · </span>
                  <strong>{donateConfig.mpesa.accountReference}</strong>
                </p>
                <ol className="list-decimal space-y-1 pl-4 text-xs text-teal-100/70">
                  {donateConfig.mpesa.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="mt-5 space-y-3 text-sm">
                <p className="text-teal-100/75">Crypto on-ramp — USDT only on the network below:</p>
                <div className="rounded-xl border border-dashed border-orange-400/30 bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-orange-300/80">
                    Network · {donateConfig.usdt.network}
                  </p>
                  <p className="mt-2 break-all font-mono text-xs leading-relaxed text-white">
                    {donateConfig.usdt.address}
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-[#2dd4bf] hover:underline"
                    onClick={() => void handleCopy('usdt', donateConfig.usdt.address)}
                  >
                    Copy address
                  </button>
                </div>
                <p className="text-xs text-amber-200/90">{donateConfig.usdt.note}</p>
              </div>
            )}

            {copied === 'failed' && (
              <p className="mt-3 text-xs text-orange-300">Could not copy — select and copy manually.</p>
            )}
            {copied && copied !== 'failed' && (
              <p className="mt-3 text-xs text-[#2dd4bf]">Copied.</p>
            )}

            <p className="mt-4 text-[11px] text-teal-100/50">
              After you send, our team logs the donation on the public ledger so the progress
              bar stays honest.
            </p>

            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-[#2dd4bf] py-3 text-sm font-bold text-[#042f2e] hover:brightness-110"
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
