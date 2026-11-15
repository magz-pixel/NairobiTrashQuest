import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/** Fade-up on scroll, once. Off when the user prefers reduced motion. */
export function Reveal({ children, i = 0, className = '' }: { children: ReactNode; i?: number; className?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.04 }}
    >
      {children}
    </motion.div>
  )
}
