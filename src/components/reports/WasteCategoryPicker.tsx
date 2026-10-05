import { REPORT_WASTE_CATEGORIES, type ReportWasteCategory } from '../../types/database'

interface WasteCategoryPickerProps {
  value: ReportWasteCategory[]
  onChange: (next: ReportWasteCategory[]) => void
}

export function WasteCategoryPicker({ value, onChange }: WasteCategoryPickerProps) {
  const toggle = (label: ReportWasteCategory) => {
    onChange(value.includes(label) ? value.filter((item) => item !== label) : [...value, label])
  }

  return (
    <fieldset>
      <legend className="text-xs font-semibold text-[var(--text-primary)]">Waste type</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {REPORT_WASTE_CATEGORIES.map((label) => {
          const selected = value.includes(label)
          return (
            <button
              key={label}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(label)}
              className={`inline-flex min-h-11 items-center rounded-full px-3 text-xs font-bold ${
                selected
                  ? 'bg-[#063b32] text-white'
                  : 'border border-[var(--border-subtle)] bg-white text-[var(--text-primary)]'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
