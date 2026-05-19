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
    'bg-[var(--neon-clean)] text-black hover:shadow-[0_0_20px_var(--neon-clean)]',
  danger:
    'bg-[var(--lava-hot)] text-white hover:shadow-[0_0_20px_var(--lava-hot)]',
  ghost:
    'bg-transparent border border-white/20 text-[var(--text-sharp)] hover:border-[var(--neon-clean)]',
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
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-shadow disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </motion.button>
  )
}
