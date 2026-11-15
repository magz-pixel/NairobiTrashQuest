import { StatusChip } from '../site/PagePrimitives'
import { t, VISION, type Lang } from '../../data/story'
import { Reveal } from './Reveal'

/** Four layers, foundation first. Phones read 1 → 4 top-down; desktop stacks 1 at the bottom. */
export function VisionStack({ lang }: { lang: Lang }) {
  return (
    <div>
      <ol className="relative flex flex-col gap-3 lg:flex-col-reverse">
        <span className="absolute bottom-6 left-[27px] top-6 w-px bg-[#0b8c76]/40" aria-hidden />
        {VISION.layers.map((l, i) => (
          <li key={i} className="relative">
            <Reveal i={i}>
              <div className="flex gap-4 rounded-[1.5rem] bg-[#fffdf7] p-4 shadow-[var(--shadow-card)] sm:p-5">
                <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#063b32] font-extrabold text-white">{i + 1}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="fn-display text-lg font-extrabold text-[#063b32]">{t(l.title, lang)}</h3>
                    <StatusChip tone={l.tone}>{t(l.status, lang)}</StatusChip>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-[#617972]">{t(l.body, lang)}</p>
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>

      <p className="fn-eyebrow mt-10">{t(VISION.labLabel, lang)}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {VISION.lab.map((x, i) => (
          <Reveal key={i} i={i}>
            <div className="h-full rounded-[1.5rem] border-2 border-dashed border-[#cfe1da] p-5">
              <h3 className="font-extrabold text-[#063b32]">{t(x.title, lang)}</h3>
              <p className="mt-1.5 text-sm leading-6 text-[#617972]">{t(x.body, lang)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
