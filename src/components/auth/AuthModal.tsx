import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  title?: string
  blurb?: string
  onAuthenticated?: () => void
}

/** Shared magic-link + Google sign-in modal (landing, map, race). */
export function AuthModal({
  open,
  onClose,
  title = 'Join Fix Nairobi',
  blurb = 'Make an account to report trash, join cleanups, and save your impact points. Free — use Google or email.',
  onAuthenticated,
}: AuthModalProps) {
  const { user, signInWithEmail, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    onClose()
    onAuthenticated?.()
  }, [open, user, onClose, onAuthenticated])

  const handleSignIn = async () => {
    setSubmitting(true)
    setMessage(null)
    try {
      await signInWithEmail(email)
      setMessage('Check your email for the magic link.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setSubmitting(true)
    setMessage(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Google sign-in failed')
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-4 text-sm text-[var(--text-primary)]">{blurb}</p>
      <Button type="button" className="w-full" disabled={submitting} onClick={handleGoogle}>
        Continue with Google
      </Button>
      <div className="my-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          or email
        </span>
        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
      </div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="mb-3 w-full rounded-lg border border-[var(--border-subtle)] bg-gray-50 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-teal)]"
      />
      {message && <p className="mb-2 text-xs text-[var(--brand-teal)]">{message}</p>}
      <Button
        type="button"
        className="w-full"
        disabled={!email || submitting}
        onClick={() => void handleSignIn()}
      >
        {submitting ? 'Sending…' : 'Send magic link'}
      </Button>
    </Modal>
  )
}
