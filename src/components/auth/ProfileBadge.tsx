import { useAuth } from '../../hooks/useAuth'

const BADGE_LABELS = {
  scout: 'Scout',
  ranger: 'Ranger',
  guardian: 'Guardian',
} as const

export function ProfileBadge() {
  const { user, profile, signOut, loading } = useAuth()

  if (loading || !user) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm backdrop-blur-md">
      <div>
        <p className="font-semibold text-[var(--text-sharp)]">
          {profile?.username ?? 'Player'}
        </p>
        <p className="text-xs text-[var(--neon-clean)]">
          {profile ? BADGE_LABELS[profile.badge_level] : 'Scout'} ·{' '}
          {profile?.total_impact_points ?? 0} pts
        </p>
      </div>
      <button
        type="button"
        onClick={() => signOut()}
        className="text-xs text-white/50 hover:text-white"
      >
        Sign out
      </button>
    </div>
  )
}
