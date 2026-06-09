import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

const REWARDS = [
  { name: 'Heavy-duty gloves', tokens: 120 },
  { name: 'Trash bags pack', tokens: 80 },
  { name: 'Reflective vest', tokens: 200 },
  { name: 'Airtime top-up', tokens: 150 },
  { name: 'Cleanup squad banner', tokens: 400 },
]

interface RewardsPanelProps {
  open: boolean
  onClose: () => void
}

export function RewardsPanel({ open, onClose }: RewardsPanelProps) {
  const { user, profile, refreshProfile } = useAuth()
  const [status, setStatus] = useState<string | null>(null)

  const requestRedemption = async (name: string, cost: number) => {
    if (!user) {
      setStatus('Sign in to redeem.')
      return
    }
    if ((profile?.total_impact_points ?? 0) < cost) {
      setStatus(`Need ${cost} tokens (you have ${profile?.total_impact_points ?? 0}).`)
      return
    }
    const { error } = await supabase.from('reward_redemptions').insert({
      user_id: user.id,
      reward_name: name,
      token_cost: cost,
      status: 'pending',
    })
    if (error) {
      setStatus(error.message)
      return
    }
    setStatus(`Requested "${name}". Admin will fulfill manually.`)
    await refreshProfile()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close rewards"
            className="absolute inset-0 z-[1100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute z-[1200] flex w-full flex-col border-white/10 bg-[var(--bg-charcoal)]/98 shadow-[0_-20px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl max-md:inset-x-0 max-md:bottom-0 max-md:h-[92dvh] max-md:rounded-t-2xl max-md:border-t md:right-0 md:top-0 md:h-full md:max-w-md md:rounded-none md:border-l md:shadow-[-8px_0_40px_rgba(0,0,0,0.5)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="border-b border-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Token redemption
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                Rewards
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Balance: {profile?.total_impact_points ?? 0} tokens
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {REWARDS.map((reward) => (
                <Card key={reward.name} className="bg-black/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{reward.name}</p>
                      <p className="mt-1 text-xs text-white/45">{reward.tokens} tokens</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={!user}
                      onClick={() => requestRedemption(reward.name, reward.tokens)}
                    >
                      Request
                    </Button>
                  </div>
                </Card>
              ))}
              {status && <p className="text-xs text-[var(--neon-clean)]">{status}</p>}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
