import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Buttery inertia scroll for marketing pages only.
 * Disabled when prefers-reduced-motion is set.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  const rafRef = useRef(0)

  useEffect(() => {
    if (reduce) return

    let cancelled = false
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null

    void import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return
      const instance = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      })
      lenis = instance
      document.documentElement.classList.add('lenis')

      const raf = (time: number) => {
        instance.raf(time)
        rafRef.current = requestAnimationFrame(raf)
      }
      rafRef.current = requestAnimationFrame(raf)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
      document.documentElement.classList.remove('lenis')
      lenis?.destroy()
    }
  }, [reduce])

  return children
}
