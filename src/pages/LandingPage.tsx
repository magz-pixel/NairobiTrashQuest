import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { FundsCounterStrip } from '../components/funds/FundsCounterStrip'
import { LandingLeaderboardStrip } from '../components/site/LandingLeaderboardStrip'
import {
  HeroArtScene,
  ZoneDashLine,
} from '../components/site/art/HeroArtScene'
import { RaceTicket3D } from '../components/site/art/RaceTicket3D'
import { ScoutModeCanvas } from '../components/site/art/ScoutModeCanvas'
import { MagneticButton } from '../components/site/fx/MagneticButton'
import { SmoothScroll } from '../components/site/fx/SmoothScroll'
import { SiteFooter, SiteNav } from '../components/site/SiteNav'

export function LandingPage() {
  const heroRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80])

  return (
    <SmoothScroll>
      <div className="fn-landing min-h-full bg-[var(--fn-night)] text-[#e8f5f1]">
        <SiteNav transparentOverHero />

        <section
          ref={heroRef}
          className="relative isolate min-h-[100svh] overflow-hidden"
        >
          <motion.div className="absolute inset-0" style={{ y: reduce ? 0 : parallaxY }}>
            <HeroArtScene />
          </motion.div>

          <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 md:justify-center md:px-6 md:pb-24 md:pt-24">
            <div className="max-w-xl md:max-w-2xl">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--fn-haze)]"
              >
                Together with XPNC
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.06 }}
                className="fn-title-glow mt-4 font-[family-name:var(--font-display)] text-[clamp(3.25rem,12vw,5.75rem)] font-extrabold leading-[0.9] tracking-tight"
              >
                Fix Nairobi
                <span className="mt-1 block text-[0.35em] font-semibold tracking-[0.12em] text-[var(--fn-clear)] md:text-[0.28em]">
                  & XPNC
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.16 }}
                className="mt-5 max-w-md text-base text-teal-50/85 md:text-lg"
              >
                We clean Nairobi together.
                <span className="mt-1 block text-teal-50/75">
                  Report trash. Help clean it. Show the change.
                </span>
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.28 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <MagneticButton to="/race" variant="primary">
                  Register — Trash Race S2
                </MagneticButton>
                <MagneticButton to="/map" variant="secondary">
                  Open Trash Map
                </MagneticButton>
              </motion.div>
              <motion.a
                href="#mission"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-10 inline-flex min-h-[44px] items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--fn-clear)]/70 hover:text-[var(--fn-clear)]"
              >
                Scroll the course
                <span aria-hidden className="inline-block animate-bounce">
                  ↓
                </span>
              </motion.a>
            </div>
          </div>
        </section>

        <section id="mission" className="border-t border-white/5 bg-[var(--fn-night)] px-4 py-14 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <ZoneDashLine className="mb-8 opacity-80" />
            <p className="fn-neon-text font-[family-name:var(--font-display)] text-xl font-semibold leading-snug md:text-2xl">
              Anyone can show a dirty spot. We clean it together. The city can see it.
            </p>
            <Link
              to="/mission"
              className="mt-6 inline-flex min-h-[44px] items-center text-sm font-bold text-[var(--fn-clear)] hover:text-white"
            >
              See our journey →
            </Link>
            <ZoneDashLine className="mt-8 rotate-180 opacity-50" />
          </div>
        </section>

        <section id="about" className="border-t border-white/5 bg-[#071a22] py-20 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-2 md:items-center md:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--fn-pin)]">
                The map
              </p>
              <h2 className="fn-title-glow mt-3 font-[family-name:var(--font-display)] text-3xl font-bold md:text-5xl">
                Trash Locator
              </h2>
              <p className="mt-4 max-w-md text-teal-100/75">
                Use the map to show dirty places near you. Take a photo when it’s cleaned.
              </p>
              <div className="mt-7">
                <MagneticButton to="/map" variant="sunset">
                  Launch map →
                </MagneticButton>
                <Link
                  to="/cleanups"
                  className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-200/90 hover:text-white"
                >
                  Weekly cleanups →
                </Link>
              </div>
            </div>
            <ScoutModeCanvas />
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-amber-500/10 py-20 md:py-24">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,107,0,0.2),transparent_50%),radial-gradient(ellipse_at_90%_80%,rgba(0,242,254,0.08),transparent_45%),linear-gradient(180deg,#1a1208_0%,#0a192f_100%)]"
          />
          <div className="fn-scanlines absolute inset-0 opacity-30" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-2 md:items-center md:px-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded border border-amber-400/30 bg-black/30 px-3 py-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--fn-pin)]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
                  Season 02 · arcade online
                </p>
              </div>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-white md:text-5xl">
                The Amazing
                <br />
                <span className="fn-title-glow">Trash Race</span>
              </h2>
              <p className="mt-4 max-w-md text-amber-50/75">
                Join a fun cleanup race. Register free, bring your squad, help clean the
                streets.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <MagneticButton to="/race" variant="primary">
                  Get your Season 2 ticket
                </MagneticButton>
                <Link
                  to="/race/leaderboard"
                  className="inline-flex min-h-[44px] items-center text-sm font-semibold text-amber-200/90 hover:text-white"
                >
                  Live leaderboard →
                </Link>
              </div>
              <LandingLeaderboardStrip />
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="w-full max-w-md">
                <RaceTicket3D />
              </div>
            </div>
          </div>
        </section>

        <section id="funds" className="border-t border-white/5 bg-[var(--fn-night)] py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--fn-clear)]/90">
              Public ledger
            </p>
            <h2 className="fn-title-glow mt-2 font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
              Follow the money
            </h2>
            <p className="mt-3 max-w-2xl text-teal-100/75">
              Totals come from our team ledger — donations and expenses logged by Fix Nairobi
              admins, not a marketing ticker.
            </p>
            <div className="mt-8 max-w-xl">
              <FundsCounterStrip />
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </SmoothScroll>
  )
}
