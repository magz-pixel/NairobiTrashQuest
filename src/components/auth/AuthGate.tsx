import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { AuthModal } from './AuthModal'

interface AuthGateProps {
  children: ReactNode
  onAuthenticated?: () => void
  /** When true, always wrap click to open sign-in even if styling differs */
  forcePrompt?: boolean
}

/** Renders children if signed in; otherwise click opens AuthModal. */
export function AuthGate({ children, onAuthenticated, forcePrompt = false }: AuthGateProps) {
  const { user, loading } = useAuth()
  const [showSignIn, setShowSignIn] = useState(false)

  useEffect(() => {
    if (!showSignIn || !user) return
    setShowSignIn(false)
    onAuthenticated?.()
  }, [onAuthenticated, showSignIn, user])

  if (loading) return null

  if (user && !forcePrompt) {
    return <>{children}</>
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
      <AuthModal
        open={showSignIn}
        onClose={() => setShowSignIn(false)}
        title="Sign in to continue"
        blurb="Join with Google or a magic link email to save points, clear pins, and join cleanups."
        onAuthenticated={onAuthenticated}
      />
    </>
  )
}
