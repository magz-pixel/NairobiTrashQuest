import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { complaintMailto } from '../../lib/wards'

export interface AccountabilityStep {
  role: string
  name: string
  contactEmail: string | null
}

interface AccountabilityFlowProps {
  wardId: string | null
  areaName: string
  reportId: string
  isDemo?: boolean
}

const FALLBACK_STEPS: Omit<AccountabilityStep, 'name'>[] = [
  { role: 'NCC Environment Desk', contactEmail: 'environment@nairobi.go.ke' },
  { role: 'Sub-County Administrator', contactEmail: null },
  { role: 'Ward MCA', contactEmail: null },
  { role: 'Constituency MP', contactEmail: null },
]

function roleOrder(role: string): number {
  const r = role.toLowerCase()
  if (r.includes('environment') || r.includes('ncc')) return 1
  if (r.includes('sub-county') || r.includes('administrator')) return 2
  if (r.includes('assembly') || r.includes('mca')) return 3
  if (r.includes('parliament') || r.includes('mp')) return 4
  return 5
}

export function AccountabilityFlow({
  wardId,
  areaName,
  reportId,
  isDemo,
}: AccountabilityFlowProps) {
  const [wardName, setWardName] = useState(areaName)
  const [subCounty, setSubCounty] = useState<string | null>(null)
  const [officials, setOfficials] = useState<AccountabilityStep[]>([])

  useEffect(() => {
    setWardName(areaName)
    if (!wardId) {
      setSubCounty(null)
      setOfficials(
        FALLBACK_STEPS.map((s) => ({
          ...s,
          name: s.role.includes('MCA')
            ? 'Ward MCA (placeholder)'
            : s.role.includes('MP')
              ? 'Constituency MP (placeholder)'
              : s.role.includes('Environment')
                ? 'Waste Management Desk'
                : 'Sub-County Admin',
        })),
      )
      return
    }

    supabase
      .from('wards')
      .select('name, sub_county')
      .eq('id', wardId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setWardName(data.name)
          setSubCounty(data.sub_county)
        }
      })

    supabase
      .from('ward_officials')
      .select('officials(name, role, contact_email)')
      .eq('ward_id', wardId)
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as {
          officials: { name: string; role: string; contact_email: string | null } | null
        }[]
        const fromDb = rows
          .map((r) => r.officials)
          .filter((o): o is { name: string; role: string; contact_email: string | null } => !!o)
          .map((o) => ({
            role: o.role,
            name: o.name,
            contactEmail: o.contact_email,
          }))
          .sort((a, b) => roleOrder(a.role) - roleOrder(b.role))

        if (fromDb.length > 0) {
          setOfficials(fromDb)
        } else {
          setOfficials(
            FALLBACK_STEPS.map((s) => ({
              ...s,
              name: s.role.includes('MCA')
                ? 'Ward MCA (placeholder)'
                : s.role.includes('MP')
                  ? 'Constituency MP (placeholder)'
                  : s.role.includes('Environment')
                    ? 'Waste Management Desk'
                    : 'Sub-County Admin',
            })),
          )
        }
      })
  }, [wardId, areaName])

  const steps: { label: string; detail: string; contactEmail: string | null }[] = [
    {
      label: 'Report logged',
      detail: areaName,
      contactEmail: null,
    },
    {
      label: 'Ward',
      detail: wardName,
      contactEmail: null,
    },
  ]

  if (subCounty) {
    steps.push({ label: 'Sub-County', detail: subCounty, contactEmail: null })
  }

  for (const official of officials) {
    steps.push({
      label: official.role,
      detail: official.name,
      contactEmail: official.contactEmail,
    })
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-gray-50 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Accountability chain
        </p>
        {isDemo && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700">
            Demo officials
          </span>
        )}
      </div>

      <ol className="relative space-y-0 border-l-2 border-[var(--brand-teal)]/30 pl-4">
        {steps.map((step, i) => (
          <li key={`${step.label}-${i}`} className="relative pb-4 last:pb-0">
            <span
              className="absolute -left-[calc(0.5rem+5px)] top-0.5 flex h-2.5 w-2.5 rounded-full bg-[var(--brand-teal)] ring-2 ring-white"
              aria-hidden
            />
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
              {step.label}
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{step.detail}</p>
            {step.contactEmail && (
              <a
                href={`mailto:${step.contactEmail}`}
                className="text-[10px] text-[var(--brand-teal)]"
              >
                Contact →
              </a>
            )}
          </li>
        ))}
      </ol>

      <a
        href={complaintMailto(areaName, reportId)}
        className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[var(--brand-teal)]/30 bg-[var(--brand-teal)]/10 px-3 py-2 text-xs font-semibold text-[var(--brand-teal)]"
      >
        File a complaint with responsible officials →
      </a>
    </div>
  )
}
