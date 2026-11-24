import { Thumb } from '../ui/Thumb'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import type { CityConfig } from '../../lib/cities'
import { wardDbId, type WardSummary } from '../../hooks/useCityWards'
import type { Report } from '../../types/database'
import { daysSince, severityLabel } from '../../lib/wards'

interface WardCardProps {
  ward: WardSummary | null
  city: CityConfig
  /** Public link to this ward on the map, for email and sharing. */
  shareUrl: string
  onClose: () => void
  onZoom: (ward: WardSummary) => void
  onSelectReport: (report: Report) => void
}

interface Official {
  name: string
  role: string
  contact_email: string | null
  contact_phone: string | null
}

function useWardOfficials(citySlug: string, wardName: string | null) {
  const [found, setFound] = useState<{ key: string; officials: Official[] } | null>(null)
  const key = wardName ? wardDbId(citySlug, wardName) : null
  useEffect(() => {
    if (!key || !isSupabaseConfigured) return
    let cancelled = false
    void supabase
      .from('ward_officials')
      .select('officials(name, role, contact_email, contact_phone)')
      .eq('ward_id', key)
      .then(({ data }) => {
        if (cancelled) return
        const officials = ((data ?? []) as unknown as { officials: Official | null }[])
          .map((r) => r.officials)
          .filter((o): o is Official => !!o)
        setFound({ key, officials })
      })
    return () => {
      cancelled = true
    }
  }, [key])
  return found?.key === key ? found.officials : []
}

function wardEmail(ward: WardSummary, city: CityConfig, url: string) {
  const subject = `${ward.open} open trash spot${ward.open === 1 ? '' : 's'} in ${ward.name} ward`
  const oldestDays = ward.oldestOpenAt ? daysSince(ward.oldestOpenAt) : 0
  const oldest = oldestDays ? ` The oldest has been open for ${oldestDays} days.` : ''
  const body = [
    'Hello,',
    '',
    `Residents have reported ${ward.open} open trash spot${ward.open === 1 ? '' : 's'} in ${ward.name} ward on Ramani-Taka, the public community trash map.${oldest}`,
    '',
    `Every spot has a photo and location here: ${url}`,
    '',
    'Please arrange for these to be cleared. We will mark them as cleared on the map once they are.',
    '',
    `— A ${city.label} resident`,
  ].join('\n')
  return `mailto:${city.complaintEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function WardCard({ ward, city, shareUrl, onClose, onZoom, onSelectReport }: WardCardProps) {
  const officials = useWardOfficials(city.slug, ward?.name ?? null)
  const mca = officials.find((o) => /mca|councillor|ward/i.test(o.role))
  const open = ward ? ward.reports.filter((r) => r.status === 'active' || r.status === 'flagged') : []
  const worst = [...open].sort((a, b) => b.severity_score - a.severity_score || a.created_at.localeCompare(b.created_at)).slice(0, 3)
  const shareText = ward
    ? `🗺️ ${ward.name} ward has ${ward.open} open trash spot${ward.open === 1 ? '' : 's'} on Ramani-Taka. See them and help clear them: ${shareUrl}`
    : ''

  return (
    <AnimatePresence>
      {ward && (
        <>
          <motion.button
            type="button"
            aria-label="Close ward details"
            className="fixed inset-0 z-[1400] bg-black/25 backdrop-blur-[2px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-label={`${ward.name} ward`}
            className="fixed inset-x-0 bottom-0 z-[1500] max-h-[82dvh] overflow-y-auto rounded-t-[1.75rem] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(6,59,50,.2)] md:inset-x-auto md:bottom-auto md:right-4 md:top-20 md:max-h-[calc(100dvh-6rem)] md:w-[24rem] md:rounded-[1.5rem]"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#d9e9e4] md:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#0b8c76]">
                  Ward · {city.label}
                </p>
                <h2 className="fn-display mt-1 text-2xl font-extrabold leading-tight tracking-[-.02em] text-[#063b32]">
                  {ward.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#5d746e] hover:bg-[#f3f7f4]"
              >
                ✕
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-[#fff1ec] px-2 py-3">
                <dt className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#a44738]">Open</dt>
                <dd className="text-2xl font-extrabold tabular-nums text-[#d9483b]">{ward.open}</dd>
              </div>
              <div className="rounded-2xl bg-[#e9f7f1] px-2 py-3">
                <dt className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#087766]">Cleared</dt>
                <dd className="text-2xl font-extrabold tabular-nums text-[#0b8c76]">{ward.cleared}</dd>
              </div>
              <div className="rounded-2xl bg-[#f3f1ea] px-2 py-3">
                <dt className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6b5d45]">Oldest</dt>
                <dd className="text-2xl font-extrabold tabular-nums text-[#063b32]">
                  {ward.oldestOpenAt === null ? '—' : `${daysSince(ward.oldestOpenAt)}d`}
                </dd>
              </div>
            </dl>

            {worst.length > 0 ? (
              <section className="mt-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#6a827b]">Worst spots</p>
                <ul className="mt-2 space-y-1.5">
                  {worst.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => onSelectReport(r)}
                        className="flex w-full items-center gap-3 rounded-xl border border-[#eee8dc] p-2 text-left hover:border-[#0b8c76]"
                      >
                        {r.image_url ? (
                          <Thumb src={r.image_url} className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#fff1ec]">📍</span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-[#063b32]">{severityLabel(r.severity_score)}</span>
                          <span className="block text-xs text-[#71867f]">Open {daysSince(r.created_at)} days</span>
                        </span>
                        <span className="text-[#0b8c76]">→</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className="mt-5 rounded-xl bg-[#f3f7f4] p-3 text-sm text-[#36564e]">
                No open spots reported in {ward.name} yet. Seen one? Report it and it shows up here.
              </p>
            )}

            <section className="mt-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#6a827b]">Who’s responsible</p>
              <ol className="mt-2 space-y-1.5 text-sm">
                {city.accountabilityFallback.map((step, i) => (
                  <li key={step.role} className="flex items-center gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#063b32] text-[11px] font-extrabold text-gold-300">
                      {i + 1}
                    </span>
                    {/ward/i.test(step.role) && mca ? (
                      <span className="text-[#36564e]">
                        <strong className="text-[#063b32]">{mca.name}</strong>
                        <span className="text-[#71867f]"> · {ward.name} {step.role}</span>
                        {mca.contact_email ? (
                          <a href={`mailto:${mca.contact_email}`} className="ml-1.5 font-bold text-[#0b8c76]">
                            email
                          </a>
                        ) : null}
                        {mca.contact_phone ? (
                          <a href={`tel:${mca.contact_phone}`} className="ml-1.5 font-bold text-[#0b8c76]">
                            call
                          </a>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-[#36564e]">
                        {/ward/i.test(step.role) ? `${ward.name} ${step.role}` : step.role}
                        {step.contactEmail ? null : <span className="text-[#9ab0a8]"> · contact coming soon</span>}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </section>

            <div className="mt-5 space-y-2">
              {ward.open > 0 ? (
                <a
                  href={wardEmail(ward, city, shareUrl)}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold-400 text-sm font-extrabold text-emerald-950"
                >
                  ✉️ Email the county about {ward.name}
                </a>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-center rounded-full border border-[#d9e9e4] text-sm font-bold text-[#063b32]"
                >
                  💬 Share ward
                </a>
                <button
                  type="button"
                  onClick={() => onZoom(ward)}
                  className="flex min-h-11 items-center justify-center rounded-full border border-[#d9e9e4] text-sm font-bold text-[#063b32]"
                >
                  🔍 Zoom in
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
