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
    <div className="flex items-center gap-3 rounded-xl border border-[var(--neon-clean)]/25 bg-black/70 px-3 py-2 text-sm shadow-[0_0_20px_rgba(57,255,20,0.08)] backdrop-blur-md">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--neon-clean)]/15 font-[family-name:var(--font-display)] text-xs font-bold text-[var(--neon-clean)]">
        {(profile?.badge_level ?? 'S')[0].toUpperCase()}
      </div>
      <div>
        <p className="font-[family-name:var(--font-display)] text-sm font-bold text-white">
          {profile?.username ?? 'Player'}
        </p>
        <p className="text-xs text-[var(--neon-clean)]">
          {profile ? BADGE_LABELS[profile.badge_level] : 'Scout'} ·{' '}
          {profile?.total_impact_points ?? 0} XP
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
