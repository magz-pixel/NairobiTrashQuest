import type { BadgeLevel } from '../../types/database'

const THRESHOLDS: Record<BadgeLevel, { min: number; max: number; next: string }> = {
  scout: { min: 0, max: 99, next: 'Ranger' },
  ranger: { min: 100, max: 299, next: 'Guardian' },
  guardian: { min: 300, max: 9999, next: 'Max' },
}

interface XpProgressRingProps {
  xp: number
  badgeLevel: BadgeLevel
  username?: string
  size?: number
  compact?: boolean
}

export function XpProgressRing({
  xp,
  badgeLevel,
  username,
  size = 96,
  compact = false,
}: XpProgressRingProps) {
  const { min, max, next } = THRESHOLDS[badgeLevel]
  const progress = Math.min(1, Math.max(0, (xp - min) / (max - min + 1)))
  const stroke = compact ? 3 : 4
  const radius = (size - stroke * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)
  const initial = (username ?? 'U')[0].toUpperCase()

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--brand-teal)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ padding: stroke * 3 }}
        >
          <div
            className="flex h-full w-full items-center justify-center rounded-full bg-[var(--brand-teal)]/10 font-semibold text-[var(--brand-teal)]"
            style={{ fontSize: compact ? 12 : size * 0.28 }}
          >
            {initial}
          </div>
        </div>
      </div>
      {!compact && (
        <div className="text-center">
          <p className="text-xs text-[var(--text-muted)]">Progress to {next}</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {xp} / {max + 1} XP
          </p>
        </div>
      )}
    </div>
  )
}
