const CHOICES = [
  { score: 2, label: 'Minimal', hint: 'Fits in one bag' },
  { score: 4, label: 'Low', hint: 'A few bags' },
  { score: 6, label: 'Moderate', hint: 'A pile you can walk around' },
  { score: 8, label: 'Severe', hint: 'Fills the verge' },
  { score: 10, label: 'Critical', hint: 'Blocks the road' },
] as const

export function SeverityPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (score: number) => void
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-[var(--text-primary)]">How bad is it?</legend>
      <div className="grid gap-2">
        {CHOICES.map((choice) => {
          const selected = value === choice.score
          return (
            <button
              key={choice.score}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(choice.score)}
              className={`flex min-h-11 items-center justify-between rounded-lg border px-3 text-left text-xs ${
                selected
                  ? 'border-[var(--brand-teal)] bg-[var(--brand-teal)]/10 font-bold text-[var(--text-primary)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}
            >
              <span>{choice.label}</span>
              <span>{choice.hint}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
