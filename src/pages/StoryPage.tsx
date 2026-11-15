import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FixNairobiMark } from '../components/site/BrandMark'
import { CitySky } from '../components/site/CitySky'
import { SiteFooter } from '../components/site/SiteNav'
import { FounderCard } from '../components/story/FounderCard'
import { Polaroid } from '../components/story/Polaroid'
import { Reveal } from '../components/story/Reveal'
import { StoryTimeline } from '../components/story/StoryTimeline'
import { VisionStack } from '../components/story/VisionStack'
import { FOUNDERS, HERO, HONEST, LINKS, ORIGIN, PARTNER, ROADMAP, t, THANKS, TIMELINE, VISION, type Lang } from '../data/story'
import { getLocale, setLocale } from '../lib/i18n'

const wrap = 'mx-auto max-w-6xl px-5 sm:px-8 lg:px-12'

/** /story: origin, founders, scrapbook timeline, honest lessons, vision, roadmap, partner CTA. Global (no city). */
export function StoryPage() {
  const [params, setParams] = useSearchParams()
  const fromUrl = params.get('lang')
  const [lang, setLang] = useState<Lang>(fromUrl === 'sw' || fromUrl === 'en' ? fromUrl : getLocale())

  const choose = (l: Lang) => {
    setLang(l)
    setLocale(l)
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        next.set('lang', l)
        return next
      },
      { replace: true },
    )
  }

  return (
    <div className="fn-rebuild min-h-[100dvh] bg-[#f4f7f2] text-[#12332d]">
      {/* Fixed bar: home + language toggle, visible without scrolling. */}
      <div className="fixed inset-x-0 top-0 z-50 border-b border-[#063b32]/10 bg-[#f4f7f2]/90 backdrop-blur">
        <div className={`${wrap} flex h-14 items-center justify-between`}>
          <Link to="/" className="flex min-h-11 items-center gap-2">
            <FixNairobiMark className="shrink-0" />
            <span className="fn-display text-base font-extrabold tracking-tight text-[#063b32]">Ramani-Taka</span>
          </Link>
          <div role="group" aria-label="Language" className="flex rounded-full bg-[#063b32]/10 p-1">
            {(['en', 'sw'] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                onClick={() => choose(l)}
                className={`min-h-9 min-w-11 rounded-full px-3 text-xs font-extrabold ${lang === l ? 'bg-[#063b32] text-white' : 'text-[#063b32]'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main lang={lang} className="pt-14">
        {/* 1. Hero */}
        <CitySky cities={['nairobi', 'kampala', 'dar-es-salaam']} variant="band">
          <div className={`${wrap} pb-14 pt-12 sm:pt-16 lg:pb-20 lg:pt-20`}>
            <p className="sky-glass sky-ink inline-flex rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.14em]">{t(HERO.eyebrow, lang)}</p>
            <h1 className="sky-ink fn-display mt-4 max-w-3xl text-[clamp(2.1rem,8vw,4.25rem)] font-extrabold leading-[1.04] tracking-[-.035em]">{t(HERO.title, lang)}</h1>
            <p className="sky-ink-soft mt-4 max-w-xl text-[17px] leading-7">{t(HERO.body, lang)}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {HERO.badges.map((b) => (
                <li key={b.en} className="sky-glass sky-ink rounded-full px-3 py-1.5 text-xs font-bold">
                  {t(b, lang)}
                </li>
              ))}
            </ul>
          </div>
        </CitySky>
        <nav aria-label="Sections" className="relative z-10 overflow-x-auto pt-4 [scrollbar-width:none]">
          <ul className={`${wrap} flex w-max gap-2 pb-2`}>
            {HERO.jumps.map((j) => (
              <li key={j.id} className="shrink-0">
                <a href={`#${j.id}`} className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-white px-4 text-sm font-bold text-[#063b32] shadow-[0_6px_18px_rgba(6,59,50,.1)]">
                  {t(j.label, lang)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 2. How it started */}
        <section id="origin" className={`${wrap} scroll-mt-20 py-14`}>
          <p className="fn-eyebrow">{t(ORIGIN.label, lang)}</p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {ORIGIN.chapters.map((c, i) => (
              <Reveal key={c.n} i={i}>
                <article className="h-full rounded-[2rem] bg-[#fffdf7] p-6 shadow-[var(--shadow-card)]">
                  <p className="fn-display text-3xl font-extrabold text-[#fbbf24]">{c.n}</p>
                  <h2 className="fn-display mt-2 text-xl font-extrabold text-[#063b32]">{t(c.title, lang)}</h2>
                  <p className="mt-3 leading-7 text-[#617972]">{t(c.body, lang)}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="mt-12">
            <Polaroid photo={ORIGIN.photo} caption={t(ORIGIN.caption, lang)} tilt={-1} />
          </div>
        </section>

        {/* 3. Founders */}
        <section className="bg-[#e5f0eb] py-14">
          <div className={wrap}>
            <p className="fn-eyebrow">{t(FOUNDERS.label, lang)}</p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {FOUNDERS.people.map((f, i) => (
                <Reveal key={f.name} i={i} className="h-full">
                  <FounderCard f={f} lang={lang} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Timeline */}
        <section id="timeline" className={`${wrap} scroll-mt-20 py-14`}>
          <p className="fn-eyebrow">{t(TIMELINE.label, lang)}</p>
          <h2 className="fn-display mt-3 text-[clamp(1.8rem,5vw,2.6rem)] font-extrabold leading-tight tracking-[-.03em] text-[#063b32]">{t(TIMELINE.intro, lang)}</h2>
          <StoryTimeline lang={lang} />
        </section>

        {/* 5. The honest part */}
        <section id="honest" className="scroll-mt-20 bg-[#063b32] py-16 text-white">
          <div className={wrap}>
            <p className="fn-eyebrow !text-[#fbbf24]">{t(HONEST.label, lang)}</p>
            <h2 className="fn-display mt-3 text-[clamp(1.8rem,5vw,2.6rem)] font-extrabold leading-tight tracking-[-.03em]">{t(HONEST.title, lang)}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {HONEST.items.map((h, i) => (
                <Reveal key={i} i={i} className="h-full">
                  <article className="h-full rounded-[1.5rem] border border-white/10 bg-white/[.06] p-5">
                    <h3 className="font-extrabold leading-snug">{t(h.title, lang)}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/75">{t(h.body, lang)}</p>
                    {'link' in h && h.link ? (
                      <Link to={h.link.to} className="mt-2 inline-flex min-h-11 items-center text-sm font-extrabold text-[#fbbf24]">
                        {t(h.link.label, lang)}
                      </Link>
                    ) : null}
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Vision */}
        <section id="vision" className={`${wrap} scroll-mt-20 py-14`}>
          <p className="fn-eyebrow">{t(VISION.label, lang)}</p>
          <h2 className="fn-display mt-3 max-w-3xl text-[clamp(1.8rem,5vw,2.6rem)] font-extrabold leading-tight tracking-[-.03em] text-[#063b32]">{t(VISION.title, lang)}</h2>
          <p className="mt-4 max-w-2xl leading-7 text-[#617972]">{t(VISION.body, lang)}</p>
          <div className="mt-8">
            <VisionStack lang={lang} />
          </div>
        </section>

        {/* 7. Roadmap */}
        <section id="roadmap" className="scroll-mt-20 bg-[#e5f0eb] py-14">
          <div className={wrap}>
            <p className="fn-eyebrow">{t(ROADMAP.label, lang)}</p>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {ROADMAP.columns.map((c, i) => (
                <Reveal key={i} i={i} className="h-full">
                  <div className="h-full rounded-[2rem] bg-[#fffdf7] p-6 shadow-[var(--shadow-card)]">
                    <h2 className="fn-display text-2xl font-extrabold text-[#063b32]">{t(c.title, lang)}</h2>
                    <ul className="mt-4 space-y-3">
                      {c.items.map((it) => (
                        <li key={it.en} className="flex gap-3 text-sm leading-6 text-[#12332d]">
                          <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${i === 0 ? 'bg-[#0b8c76]' : i === 1 ? 'bg-[#fbbf24]' : 'bg-[#ef8268]'}`} aria-hidden />
                          {t(it, lang)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Thanks */}
        <section className={`${wrap} py-12`}>
          <p className="fn-eyebrow">{t(THANKS.label, lang)}</p>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-[#12332d]">{t(THANKS.body, lang)}</p>
        </section>

        {/* 9. Partner */}
        <section id="partner" className={`${wrap} scroll-mt-20 pb-16`}>
          <div className="rounded-[2rem] bg-[#fbbf24] p-7 text-[#063b32] sm:p-10">
            <p className="fn-eyebrow !text-[#063b32]">{t(PARTNER.label, lang)}</p>
            <h2 className="fn-display mt-3 text-[clamp(2rem,6vw,3.2rem)] font-extrabold leading-tight tracking-[-.03em]">{t(PARTNER.title, lang)}</h2>
            <p className="mt-3 max-w-2xl leading-7">{t(PARTNER.body, lang)}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={LINKS.whatsapp(lang)} target="_blank" rel="noopener" className="inline-flex min-h-12 items-center rounded-full bg-[#063b32] px-6 font-extrabold text-white">
                {t(PARTNER.whatsapp, lang)}
              </a>
              <a href={LINKS.tiktok} target="_blank" rel="noopener" className="inline-flex min-h-12 items-center rounded-full bg-white/70 px-6 font-extrabold text-[#063b32]">
                {t(PARTNER.tiktok, lang)}
              </a>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6">
              <Link to={PARTNER.cleanup.to} className="inline-flex min-h-11 items-center text-sm font-extrabold underline">
                {t(PARTNER.cleanup.label, lang)}
              </Link>
              <Link to={PARTNER.report.to} className="inline-flex min-h-11 items-center text-sm font-extrabold underline">
                {t(PARTNER.report.label, lang)}
              </Link>
            </div>
          </div>
          <p className="mt-5 text-center text-sm italic text-[#617972]">{t(PARTNER.signature, lang)}</p>
        </section>
      </main>
      <SiteFooter hub />
    </div>
  )
}
