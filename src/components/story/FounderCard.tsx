import { t, type Lang, type L } from '../../data/story'

export interface Founder {
  name: string
  img: string
  imgW: number
  imgH: number
  alt: string
  role: L
  bio: L
  quote: L
  link?: { href: string; label: L }
}

/** Same photo frame for both founders (square, top-anchored) so the cards line up. */
export function FounderCard({ f, lang }: { f: Founder; lang: Lang }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[2rem] bg-[#fffdf7] shadow-[var(--shadow-card)]">
      <img src={f.img} alt={f.alt} width={f.imgW} height={f.imgH} loading="lazy" decoding="async" className="aspect-[4/3] w-full bg-[#e5efeb] object-cover object-top sm:aspect-square" />
      <div className="flex flex-1 flex-col p-6">
        <h3 className="fn-display text-2xl font-extrabold tracking-[-.02em] text-[#063b32]">{f.name}</h3>
        <p className="mt-1 text-xs font-extrabold uppercase tracking-[.14em] text-[#0b8c76]">{t(f.role, lang)}</p>
        <p className="mt-4 leading-7 text-[#617972]">{t(f.bio, lang)}</p>
        <blockquote className="mt-5 border-l-[3px] border-[#fbbf24] pl-4 italic leading-7 text-[#12332d]">{t(f.quote, lang)}</blockquote>
        {f.link ? (
          <a href={f.link.href} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex min-h-11 items-center pt-4 text-sm font-extrabold text-[#0b8c76]">
            {t(f.link.label, lang)}
          </a>
        ) : null}
      </div>
    </article>
  )
}
