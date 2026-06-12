interface ReportActionBarProps {
  onReport: () => void
  label?: string
}

export function ReportActionBar({ onReport, label = 'Report Trash' }: ReportActionBarProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[1250] md:left-[var(--nav-rail-width,56px)] max-md:bottom-[var(--mobile-nav-height,64px)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="pointer-events-auto border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 shadow-[var(--shadow-md)]">
        <button
          type="button"
          onClick={onReport}
          className="w-full rounded-xl bg-[var(--brand-teal)] py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-teal-hover)]"
        >
          + {label}
        </button>
      </div>
    </div>
  )
}
