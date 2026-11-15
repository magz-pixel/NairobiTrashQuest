import { useState } from 'react'

/** YouTube facade: a thumbnail until tapped, so the ~1 MB player only loads on demand. */
export function LiteYouTube({ id, label, playLabel, watchLabel }: { id: string; label: string; playLabel: string; watchLabel: string }) {
  const [on, setOn] = useState(false)
  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#063b32] shadow-[var(--shadow-card)]">
        {on ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            title={label}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setOn(true)} className="group absolute inset-0 h-full w-full" aria-label={`${playLabel}: ${label}`}>
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" width={480} height={360} className="h-full w-full object-cover opacity-90" />
            <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(4,30,26,.75))]" />
            <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#fbbf24] text-2xl text-[#063b32] shadow-xl transition group-hover:scale-105">
              ▶
            </span>
            <span className="absolute bottom-3 left-4 right-4 text-left text-sm font-extrabold text-white">{label}</span>
          </button>
        )}
      </div>
      <a href={`https://youtu.be/${id}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-xs font-bold text-[#0b8c76] underline">
        {watchLabel}
      </a>
    </div>
  )
}
