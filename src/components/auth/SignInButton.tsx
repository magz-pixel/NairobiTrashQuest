import { useState } from 'react'
import { AuthModal } from './AuthModal'

interface SignInButtonProps {
  label?: string
  className?: string
  variant?: 'light' | 'dark'
  authTitle?: string
  authBlurb?: string
}

/** Compact CTA that opens AuthModal — for map panels/modals. */
export function SignInButton({
  label = 'Sign in / Join',
  className = '',
  variant = 'light',
  authTitle,
  authBlurb,
}: SignInButtonProps) {
  const [open, setOpen] = useState(false)
  const styles =
    variant === 'dark'
      ? 'inline-flex min-h-11 items-center justify-center rounded-full bg-gold-400 px-5 text-sm font-extrabold text-emerald-950 transition hover:bg-gold-300 active:scale-[.98]'
      : 'rounded-lg bg-[var(--brand-teal)] px-4 py-2 text-sm font-semibold text-white'

  return (
    <>
      <button type="button" className={`${styles} ${className}`} onClick={() => setOpen(true)}>
        {label}
      </button>
      <AuthModal
        open={open}
        onClose={() => setOpen(false)}
        title={authTitle}
        blurb={authBlurb}
      />
    </>
  )
}
