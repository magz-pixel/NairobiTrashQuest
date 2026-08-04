import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { SiteFooter, SiteNav } from '../components/site/SiteNav'
import { missionScrapbook, type ScrapItem } from '../lib/missionScrapbook'

function Tape({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 rotate-[-4deg] bg-amber-200/70 shadow-sm ${className}`}
    />
  )
}

function ScrapCard({ item, index }: { item: ScrapItem; index: number }) {
  const inner = (
    <>
      <Tape />
      {item.imageSrc && (
        <div className="overflow-hidden border-[6px] border-[#f5f0e6] bg-[#0a1a17] shadow-md">
          <img
            src={item.imageSrc}
            alt=""
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className={`${item.imageSrc ? 'mt-3' : ''} px-1`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-700/80">
          {item.dateLabel}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-[#0c1f1c]">
          {item.title}
        </h2>
        <p className="mt-1 text-sm leading-snug text-[#1a1a1a]/75">{item.body}</p>
        {item.href && (
          <p className="mt-2 text-xs font-bold text-teal-800 underline-offset-2 group-hover:underline">
            Open →
          </p>
        )}
      </div>
    </>
  )

  const shellClass = `group relative block w-full max-w-sm bg-[#f5f0e6] p-3 shadow-[4px_6px_0_rgba(0,0,0,0.25)] transition hover:z-10 hover:shadow-[6px_8px_0_rgba(0,0,0,0.3)] ${item.tilt}`

  const motionProps = {
    initial: { opacity: 0, y: 24, rotate: 0 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-20px' },
    transition: { duration: 0.45, delay: index * 0.05 },
  }

  if (item.href) {
    if (item.external) {
      return (
        <motion.a
          {...motionProps}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className={shellClass}
        >
          {inner}
        </motion.a>
      )
    }
    return (
      <motion.div {...motionProps}>
        <Link to={item.href} className={shellClass}>
          {inner}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div {...motionProps} className={shellClass}>
      {inner}
    </motion.div>
  )
}

export function MissionPage() {
  return (
    <div className="fn-landing min-h-full bg-[#071613] text-[#e8f5f1]">
      <SiteNav />
      <main className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 10%, rgba(251,191,36,0.35), transparent 40%), radial-gradient(circle at 80% 60%, rgba(45,212,191,0.25), transparent 45%)',
          }}
        />
        {/* Cork / scrapbook board feel */}
        <div className="relative mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/90">
            Our journey
          </p>
          <h1 className="mt-2 max-w-2xl font-[family-name:var(--font-display)] text-4xl font-extrabold text-white md:text-6xl">
            Mission scrapbook
          </h1>
          <p className="mt-4 max-w-xl text-teal-100/75">
            Polaroids, stamps, and milestones from Fix Nairobi & XPNC — pin your own photos
            and links here as we grow.
          </p>

          <div className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3">
            {missionScrapbook.map((item, i) => (
              <div key={item.id} className="mb-6 break-inside-avoid">
                <ScrapCard item={item} index={i} />
              </div>
            ))}
          </div>

          <p className="mt-10 rounded-xl border border-dashed border-teal-400/30 bg-black/20 p-4 text-sm text-teal-100/70">
            Team tip: edit{' '}
            <code className="text-[#2dd4bf]">src/lib/missionScrapbook.ts</code> and drop
            images in <code className="text-[#2dd4bf]">public/mission/</code>.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/race"
              className="rounded-xl bg-[#2dd4bf] px-5 py-3 text-sm font-bold text-[#042f2e]"
            >
              Join Season 2
            </Link>
            <Link
              to="/funds"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-teal-50"
            >
              Donate / ledger
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
