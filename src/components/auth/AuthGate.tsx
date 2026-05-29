import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'

interface AuthGateProps {
  children: ReactNode
  onAuthenticated?: () => void
}

export function AuthGate({ children, onAuthenticated }: AuthGateProps) {
  const { user, loading, signInWithEmail, signInWithGoogle } = useAuth()
  const [showSignIn, setShowSignIn] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!showSignIn) return
    if (!user) return
    setShowSignIn(false)
    onAuthenticated?.()
  }, [onAuthenticated, showSignIn, user])

  if (loading) return null

  if (user) {
    return <>{children}</>
  }

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
      setShowSignIn(false)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Google sign-in failed')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div
        onClick={() => setShowSignIn(true)}
        onKeyDown={(e) => e.key === 'Enter' && setShowSignIn(true)}
        role="button"
        tabIndex={0}
      >
        {children}
      </div>
      <Modal open={showSignIn} onClose={() => setShowSignIn(false)} title="Sign in to play">
        <Card className="border-0 bg-transparent p-0 shadow-none">
          <p className="mb-3 text-sm text-white/70">
            Join the cleanup game. Earn impact points by verifying cleared hotspots.
          </p>

          <Button
            type="button"
            className="w-full"
            disabled={submitting}
            onClick={handleGoogle}
          >
            Continue with Google
          </Button>

          <div className="my-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              or
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="mb-3 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--neon-clean)]"
          />
          {message && (
            <p className="mb-2 text-xs text-[var(--neon-clean)]">{message}</p>
          )}
          <Button
            type="button"
            className="w-full"
            disabled={!email || submitting}
            onClick={handleSignIn}
          >
            {submitting ? 'Sending…' : 'Send magic link (email)'}
          </Button>
        </Card>
      </Modal>
    </>
  )
}
