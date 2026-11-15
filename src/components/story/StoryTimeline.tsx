import { Link } from 'react-router-dom'
import { PAGE, t, TIMELINE, type Lang, type Milestone } from '../../data/story'
import { LiteYouTube } from './LiteYouTube'
import { Polaroid } from './Polaroid'
import { Reveal } from './Reveal'

/**
 * Mobile: one column, 2 px teal rail on the left, a dot per milestone.
 * lg+: milestones alternate left/right of a centred rail.
 */
export function StoryTimeline({ lang }: { lang: Lang }) {
  const items: Milestone[] = TIMELINE.items
  return (
    <ol className="relative mt-10">
      <span className="absolute bottom-2 left-[9px] top-2 w-0.5 bg-[#0b8c76]/70 lg:left-1/2 lg:-translate-x-1/2" aria-hidden />
      {items.map((m, i) => {
        const right = i % 2 === 1
        return (
          <li key={i} className="relative pb-10 pl-10 last:pb-0 lg:grid lg:grid-cols-2 lg:gap-16 lg:pl-0">
            <span
              className={`absolute left-[3px] top-6 h-3.5 w-3.5 rounded-full border-[3px] border-[#f4f7f2] ${m.award ? 'bg-[#fbbf24]' : 'bg-[#0b8c76]'} lg:left-1/2 lg:-translate-x-1/2`}
              aria-hidden
            />
            <Reveal i={i} className={right ? 'lg:col-start-2' : 'lg:col-start-1'}>
              <article className="rounded-[2rem] bg-[#fffdf7] p-5 shadow-[var(--shadow-card)] sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#063b32] px-3 py-1 text-[11px] font-extrabold tracking-[.06em] text-white">{t(m.date, lang)}</span>
                  {m.award ? (
                    <span className="rounded-full bg-[#fff1b8] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.1em] text-[#8b6207]">
                      ★ {t(TIMELINE.awardChip, lang)}
                    </span>
                  ) : null}
                </div>
                <h3 className="fn-display mt-3 text-xl font-extrabold leading-snug tracking-[-.02em] text-[#063b32] sm:text-2xl">{t(m.title, lang)}</h3>
                <p className="mt-2 leading-7 text-[#617972]">{t(m.body, lang)}</p>

                {m.stats ? (
                  <dl className={`mt-4 grid gap-2 ${m.stats.length >= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
                    {m.stats.map((s) => (
                      <div key={s.value} className="min-w-0 rounded-2xl bg-[#e5f0eb] px-2.5 py-2.5 sm:px-3">
                        <dt className="sr-only">{t(s.label, lang)}</dt>
                        <dd className="text-lg font-extrabold tabular-nums leading-tight text-[#063b32] sm:text-xl">{s.value}</dd>
                        <dd className="text-[11px] leading-4 text-[#617972] [overflow-wrap:anywhere] hyphens-auto">{t(s.label, lang)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {m.photo ? (
                  <div className="mt-6">
                    <Polaroid photo={m.photo} caption={m.caption ? t(m.caption, lang) : undefined} tilt={right ? 1 : -1} />
                  </div>
                ) : null}

                {m.video ? (
                  <div className="mt-5">
                    <LiteYouTube id={m.video.id} label={t(m.video.label, lang)} playLabel={t(PAGE.playVideo, lang)} watchLabel={t(TIMELINE.watchOnYouTube, lang)} />
                  </div>
                ) : null}

                {m.link ? (
                  <Link to={m.link.to} className="mt-3 inline-flex min-h-11 items-center text-sm font-extrabold text-[#0b8c76]">
                    {t(m.link.label, lang)}
                  </Link>
                ) : null}
              </article>
            </Reveal>
          </li>
        )
      })}
    </ol>
  )
}
