import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-white/10 bg-[var(--bg-charcoal)] p-4 shadow-lg backdrop-blur-md ${className}`}
    >
      {children}
    </motion.div>
  )
}
