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
      className={`flex w-full min-w-0 max-w-full items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-2 text-sm shadow-[var(--shadow-sm)] sm:max-w-[13.5rem] sm:gap-3 sm:px-3 ${className}`}
    >
      <div className="shrink-0">
        <XpProgressRing
          xp={profile?.total_impact_points ?? 0}
          badgeLevel={profile?.badge_level ?? 'scout'}
          username={profile?.username}
          size={40}
          compact
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="truncate text-sm font-semibold leading-tight text-[var(--text-primary)]">
          {profile?.username ?? 'User'}
        </p>
        <p className="truncate text-xs leading-tight text-[var(--text-muted)]">
          {profile ? BADGE_LABELS[profile.badge_level] : 'Scout'} ·{' '}
          {profile?.total_impact_points ?? 0} XP
        </p>
      </div>
      <button
        type="button"
        onClick={() => signOut()}
        className="ml-0.5 shrink-0 whitespace-nowrap text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        Sign out
      </button>
    </div>
  )
}
