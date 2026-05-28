import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/database'
import { Card } from '../ui/Card'

interface ProfilePanelProps {
  open: boolean
  onClose: () => void
}

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
            className="absolute inset-0 z-[1100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute right-0 top-0 z-[1200] flex h-full w-full max-w-md flex-col border-l border-[var(--neon-clean)]/20 bg-[var(--bg-charcoal)]/98 shadow-[-8px_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="border-b border-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neon-clean)]">
                Account
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                Profile
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Your progress and impact tokens.
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {!user ? (
                <Card className="bg-black/40">
                  <p className="text-sm text-white/70">
                    Sign in to view your profile.
                  </p>
                </Card>
              ) : (
                <>
                  <Card className="bg-black/40">
                    <p className="text-xs text-white/50">Username</p>
                    <p className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
                      {profile?.username ?? 'Player'}
                    </p>
                    <p className="mt-3 text-xs text-white/50">Tokens (Impact Points)</p>
                    <p className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--neon-clean)]">
                      {profile?.total_impact_points ?? 0}
                    </p>
                    <button
                      type="button"
                      className="mt-4 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/70 hover:border-[var(--neon-clean)]/40"
                      onClick={() => refreshProfile()}
                    >
                      Refresh
                    </button>
                  </Card>

                  <Card className="bg-black/40">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                      How tokens work (v1)
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      \(Tokens = Hours×10 + KG×5 + EcoMultiplier×20\)
                    </p>
                    <p className="mt-2 text-xs text-white/40">
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

