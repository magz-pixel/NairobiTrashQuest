import { useState, type ImgHTMLAttributes } from 'react'
import { thumbUrl } from '../../lib/uploads'

/**
 * List-sized photo: loads the small "-thumb.jpg" copy (~30 KB) and falls back to the full photo
 * for older uploads that don't have one. Always lazy, so off-screen cards cost nothing.
 */
export function Thumb({ src, alt = '', ...rest }: { src: string | null | undefined } & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>) {
  const [useFull, setUseFull] = useState(false)
  if (!src) return null
  return (
    <img
      {...rest}
      alt={alt}
      loading="lazy"
      decoding="async"
      src={useFull ? src : (thumbUrl(src) ?? src)}
      onError={() => setUseFull(true)}
    />
  )
}
