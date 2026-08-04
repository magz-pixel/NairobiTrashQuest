import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { usePointerParallax } from './usePointerParallax'

/** Lightweight particle grid that shifts with the pointer — night radar atmosphere. */
export function AmbientRadarGrid({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()
  const pointer = usePointerParallax(!reduce)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reduce) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0

    const resize = () => {
      const parent = canvas.parentElement
      w = parent?.clientWidth ?? window.innerWidth
      h = parent?.clientHeight ?? window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    const spacing = 28
    let t = 0

    const draw = () => {
      t += 0.008
      ctx.clearRect(0, 0, w, h)
      const ox = pointer.x * 18
      const oy = pointer.y * 12

      for (let x = 0; x < w + spacing; x += spacing) {
        for (let y = 0; y < h + spacing; y += spacing) {
          const px = x + ox
          const py = y + oy
          const dist = Math.hypot(px - w * 0.55, py - h * 0.42)
          const pulse = 0.15 + 0.25 * Math.sin(t + dist * 0.02)
          const isTeal = (x + y) % (spacing * 2) === 0
          ctx.fillStyle = isTeal
            ? `rgba(0, 242, 254, ${pulse * 0.45})`
            : `rgba(255, 107, 0, ${pulse * 0.25})`
          ctx.beginPath()
          ctx.arc(px, py, 1.1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [pointer.x, pointer.y, reduce])

  if (reduce) return null

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-[1] opacity-60 ${className}`}
      aria-hidden
    />
  )
}
