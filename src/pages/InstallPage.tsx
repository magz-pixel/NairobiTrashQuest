import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FixNairobiMark } from '../components/site/BrandMark'
import { isInAppBrowser, lastCity, useInstallPrompt } from '../lib/pwa'

const SHARE_URL = 'https://ramani-taka.co.ke/install'

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#063b32] text-sm font-extrabold text-gold-300">
        {n}
      </span>
      <span className="pt-1 leading-6 text-[#36564e]">{children}</span>
    </li>
  )
}

/** Share icon as iOS draws it (square with an up arrow). */
function IosShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className="inline -translate-y-0.5" aria-label="Share">
      <path d="M12 3v12M8 7l4-4 4 4" fill="none" stroke="#0b8c76" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 11H5v10h14V11h-1" fill="none" stroke="#0b8c76" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function InstallPage() {
  const { state, install } = useInstallPrompt()
  const [result, setResult] = useState<'accepted' | 'dismissed' | null>(null)
  const [copied, setCopied] = useState(false)
  const inApp = isInAppBrowser()
  const mapPath = `/${lastCity()}/map`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="fn-rebuild min-h-[100dvh] bg-[#f4f7f2] text-[#12332d]">
      <header className="border-b border-white/10 bg-emerald-950 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <FixNairobiMark className="shrink-0" />
            <span className="font-[family-name:var(--font-display)] text-lg font-bold">Ramani-Taka</span>
          </Link>
          <Link to={mapPath} className="text-sm font-bold text-teal-100/80 hover:text-white">
            Open map →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:pt-16">
        <div className="flex items-center gap-5">
          <img src="/icons/icon-192.png" alt="" width={88} height={88} className="rounded-[22px] shadow-[0_14px_40px_rgba(6,59,50,.25)]" />
          <div>
            <p className="fn-eyebrow">Free · no Play Store needed</p>
            <h1 className="fn-display mt-2 text-4xl font-extrabold leading-[1.02] tracking-[-.03em] text-[#063b32] sm:text-5xl">
              Put the trash map on your phone.
            </h1>
          </div>
        </div>
        <p className="mt-6 max-w-xl text-lg leading-8 text-[#5d746e]">
          Report a dirty spot in 30 seconds, see cleanups near you, and watch your street change. Installs in one tap, uses
          almost no storage, and updates itself.
        </p>

        <section className="mt-8 rounded-[1.75rem] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
          {inApp ? (
            <>
              <h2 className="fn-display text-2xl font-extrabold text-[#063b32]">Open this page in your browser first</h2>
              <p className="mt-2 leading-7 text-[#5d746e]">
                TikTok and Instagram can't install apps from their built-in browser.
              </p>
              <ol className="mt-5 space-y-4">
                <Step n={1}>
                  Tap the <strong>⋯</strong> or <strong>↗</strong> button at the top or bottom corner.
                </Step>
                <Step n={2}>
                  Choose <strong>Open in browser</strong> (or <strong>Open in Chrome / Safari</strong>).
                </Step>
                <Step n={3}>Then tap Install on this page.</Step>
              </ol>
              <button type="button" onClick={() => void copyLink()} className="fn-action fn-action-light mt-6">
                {copied ? 'Link copied — paste it in Chrome or Safari' : 'Copy link'} <span>⧉</span>
              </button>
            </>
          ) : state === 'installed' ? (
            <>
              <h2 className="fn-display text-2xl font-extrabold text-[#063b32]">You're all set 🎉</h2>
              <p className="mt-2 leading-7 text-[#5d746e]">Ramani-Taka is installed. Open it from your home screen any time.</p>
              <Link to={mapPath} className="fn-action fn-action-dark mt-6">
                Open the map <span>→</span>
              </Link>
            </>
          ) : state === 'ready' ? (
            <>
              <h2 className="fn-display text-2xl font-extrabold text-[#063b32]">One tap to install</h2>
              <button
                type="button"
                onClick={async () => setResult((await install()) ? 'accepted' : 'dismissed')}
                className="fn-action fn-action-gold mt-5 text-base"
              >
                Install Ramani-Taka <span>↓</span>
              </button>
              {result === 'accepted' && (
                <p className="mt-4 font-bold text-[#087766]">Installed! Look for the yellow pin on your home screen.</p>
              )}
              {result === 'dismissed' && (
                <p className="mt-4 text-sm text-[#5d746e]">No problem — you can install later from your browser menu.</p>
              )}
            </>
          ) : state === 'ios' ? (
            <>
              <h2 className="fn-display text-2xl font-extrabold text-[#063b32]">Install on iPhone</h2>
              <p className="mt-2 text-sm text-[#5d746e]">Use Safari for this — other iPhone browsers may hide the option.</p>
              <ol className="mt-5 space-y-4">
                <Step n={1}>
                  Tap the Share button <IosShareIcon /> at the bottom of Safari.
                </Step>
                <Step n={2}>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </Step>
                <Step n={3}>
                  Tap <strong>Add</strong>. The yellow pin appears on your home screen.
                </Step>
              </ol>
            </>
          ) : (
            <>
              <h2 className="fn-display text-2xl font-extrabold text-[#063b32]">Install from your browser menu</h2>
              <ol className="mt-5 space-y-4">
                <Step n={1}>
                  Open the browser menu (<strong>⋮</strong> in Chrome, top right).
                </Step>
                <Step n={2}>
                  Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                </Step>
                <Step n={3}>Confirm. Ramani-Taka opens like any other app.</Step>
              </ol>
            </>
          )}
        </section>

        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ['📍', 'Report in 30 s', 'Photo + location. No account needed.'],
            ['🧹', 'Join cleanups', 'See field days near you and show up.'],
            ['✅', 'Prove the change', 'Before/after photos keep the record honest.'],
          ].map(([icon, title, copy]) => (
            <li key={title} className="rounded-[1.25rem] bg-white/70 p-5 shadow-[var(--shadow-card)]">
              <span className="text-2xl" aria-hidden>
                {icon}
              </span>
              <p className="mt-2 font-extrabold text-[#063b32]">{title}</p>
              <p className="mt-1 text-sm leading-6 text-[#5d746e]">{copy}</p>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-sm text-[#5d746e]">
          Rather not install?{' '}
          <Link to={mapPath} className="font-bold text-[#0b8c76]">
            Use it in the browser →
          </Link>
        </p>
      </main>
    </div>
  )
}
