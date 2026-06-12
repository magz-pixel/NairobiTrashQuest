import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'danger' | 'ghost'

interface ButtonProps {
  children: ReactNode
  variant?: Variant
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--brand-teal)] text-white hover:bg-[var(--brand-teal-hover)] shadow-sm',
  danger: 'bg-[var(--urgent-orange-deep)] text-white hover:opacity-90 shadow-sm',
  ghost:
    'bg-transparent border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--brand-teal)] hover:text-[var(--brand-teal)]',
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  disabled,
  type = 'button',
  onClick,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </motion.button>
  )
}
