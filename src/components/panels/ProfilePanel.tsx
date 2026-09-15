import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/database'
import { SignInButton } from '../auth/SignInButton'
import { XpProgressRing } from '../profile/XpProgressRing'
import { Card } from '../ui/Card'

interface ProfilePanelProps {
  open: boolean
  onClose: () => void
}

const PANEL_CLASS =
  'absolute z-[1200] flex w-full flex-col border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)] max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[92dvh] max-md:rounded-t-2xl max-md:border-t md:right-0 md:top-0 md:h-full md:max-w-md md:border-l'

export function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  const { user, profile: cachedProfile, refreshProfile } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(cachedProfile)

  useEffect(() => {
    setProfile(cachedProfile)
  }, [cachedProfile])

  useEffect(() => {
    if (!open || !user) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile)
      })
  }, [open, user])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close profile"
            className="absolute inset-0 z-[1100] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={PANEL_CLASS}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="border-b border-[var(--border-subtle)] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-teal)]">
                Account
              </p>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Profile</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Your civic impact and hunter progress.
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {!user ? (
                <Card>
                  <p className="mb-3 text-sm text-[var(--text-muted)]">Sign in to view your profile.</p>
                  <SignInButton />
                </Card>
              ) : (
                <>
                  <Card className="flex flex-col items-center py-6">
                    <XpProgressRing
                      xp={profile?.total_impact_points ?? 0}
                      badgeLevel={profile?.badge_level ?? 'scout'}
                      username={profile?.username}
                      size={112}
                    />
                    <p className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
                      {profile?.username ?? 'User'}
                    </p>
                    <p className="text-sm capitalize text-[var(--text-muted)]">
                      {profile?.badge_level ?? 'scout'} badge
                    </p>
                  </Card>

                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">Impact points</p>
                    <p className="text-4xl font-bold text-[var(--brand-teal)]">
                      {profile?.total_impact_points ?? 0}
                    </p>
                    <button
                      type="button"
                      className="mt-4 rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-muted)] hover:border-[var(--brand-teal)]"
                      onClick={() => refreshProfile()}
                    >
                      Refresh
                    </button>
                  </Card>

                  <Card>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      How tokens work
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-primary)]">
                      Tokens = Hours×10 + KG×5 + EcoMultiplier×20
                    </p>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      EcoMultiplier is a 0–5 boost for high-impact cleanups.
                    </p>
                  </Card>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
