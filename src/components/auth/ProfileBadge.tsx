import { useAuth } from '../../hooks/useAuth'
import { XpProgressRing } from '../profile/XpProgressRing'

const BADGE_LABELS = {
  scout: 'Scout',
  ranger: 'Ranger',
  guardian: 'Guardian',
} as const

export function ProfileBadge({ className = '' }: { className?: string }) {
  const { user, profile, signOut, loading } = useAuth()

  if (loading || !user) return null

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm shadow-[var(--shadow-sm)] ${className}`}
    >
      <XpProgressRing
        xp={profile?.total_impact_points ?? 0}
        badgeLevel={profile?.badge_level ?? 'scout'}
        username={profile?.username}
        size={40}
        compact
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {profile?.username ?? 'User'}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {profile ? BADGE_LABELS[profile.badge_level] : 'Scout'} ·{' '}
          {profile?.total_impact_points ?? 0} XP
        </p>
      </div>
      <button
        type="button"
        onClick={() => signOut()}
        className="shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        Sign out
      </button>
    </div>
  )
}
