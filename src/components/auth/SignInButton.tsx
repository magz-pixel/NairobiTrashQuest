import { useState } from 'react'
import { AuthModal } from './AuthModal'

interface SignInButtonProps {
  label?: string
  className?: string
  variant?: 'light' | 'dark'
}

/** Compact CTA that opens AuthModal — for map panels/modals. */
export function SignInButton({
  label = 'Sign in / Join',
  className = '',
  variant = 'light',
}: SignInButtonProps) {
  const [open, setOpen] = useState(false)
  const styles =
    variant === 'dark'
      ? 'rounded-lg bg-[var(--fn-clear,#00f2fe)] px-4 py-2 text-sm font-bold text-[#021a1a]'
      : 'rounded-lg bg-[var(--brand-teal)] px-4 py-2 text-sm font-semibold text-white'

  return (
    <>
      <button type="button" className={`${styles} ${className}`} onClick={() => setOpen(true)}>
        {label}
      </button>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
