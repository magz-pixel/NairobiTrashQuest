import type { StoryPhoto } from '../../data/story'

/**
 * Scrapbook photo: white border, slight tilt, a strip of tape. The caption stays straight.
 * `tilt` alternates -1 / 1 down the page; text is never rotated.
 */
export function Polaroid({ photo, caption, tilt = 1, eager = false }: { photo: StoryPhoto; caption?: string; tilt?: -1 | 1; eager?: boolean }) {
  const base = `/story/${photo.name}`
  return (
    <figure className="mx-auto w-full max-w-[640px]">
      <div className={`story-polaroid relative bg-white p-2.5 pb-3 shadow-[0_14px_36px_rgba(6,59,50,.16)] sm:p-3 ${tilt < 0 ? 'story-tilt-l' : 'story-tilt-r'}`}>
        <span className="story-tape" aria-hidden />
        <img
          src={`${base}-sm.webp`}
          srcSet={`${base}-sm.webp 960w, ${base}-lg.webp ${photo.w}w`}
          sizes="(min-width: 1024px) 560px, calc(100vw - 4rem)"
          width={photo.w}
          height={photo.h}
          alt={photo.alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="block h-auto w-full bg-[#e5efeb]"
        />
      </div>
      {caption ? <figcaption className="mt-3 px-1 text-center text-sm italic leading-6 text-[#617972]">{caption}</figcaption> : null}
    </figure>
  )
}
