interface BottomReportDockProps {
  onReport: () => void
  label?: string
}

export function BottomReportDock({ onReport, label = 'Report trash' }: BottomReportDockProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[1250] md:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + var(--mobile-nav-height, 64px))' }}
    >
      <div className="pointer-events-auto border-t border-white/10 bg-[#0d1117]/95 px-3 py-2 backdrop-blur-xl">
        <button
          type="button"
          onClick={onReport}
          className="w-full rounded-xl bg-[var(--neon-clean)] py-3.5 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-black shadow-[0_0_24px_rgba(57,255,20,0.25)]"
        >
          ⊕ {label}
        </button>
      </div>
    </div>
  )
}
