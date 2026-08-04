import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'sunset'

interface MagneticButtonProps {
  to: string
  children: ReactNode
  variant?: Variant
  className?: string
}

const styles: Record<Variant, string> = {
  primary:
    'bg-[var(--fn-clear)] text-[#021a1a] shadow-[0_0_24px_rgba(0,242,254,0.35)] border border-transparent',
  secondary:
    'border border-[var(--fn-pin)]/60 bg-[var(--fn-pin)]/15 text-orange-50 shadow-[0_0_20px_rgba(255,107,0,0.2)]',
  sunset:
    'bg-[var(--fn-pin)] text-white shadow-[0_0_24px_rgba(255,107,0,0.4)] border border-transparent',
}

/** High-impact CTA with magnetic pull on fine pointers. */
export function MagneticButton({
  to,
  children,
  variant = 'primary',
  className = '',
}: MagneticButtonProps) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 180, damping: 16 })
  const springY = useSpring(y, { stiffness: 180, damping: 16 })

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (reduce) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - (rect.left + rect.width / 2)
    const my = e.clientY - (rect.top + rect.height / 2)
    x.set(mx * 0.22)
    y.set(my * 0.22)
  }

  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div style={{ x: springX, y: springY }} className="inline-block">
      <Link
        to={to}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={`fn-magnetic relative inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition hover:brightness-110 ${styles[variant]} ${className}`}
      >
        <span className="relative z-10">{children}</span>
      </Link>
    </motion.div>
  )
}
