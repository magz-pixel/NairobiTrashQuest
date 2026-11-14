import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useCity, useCityPath } from '../../lib/CityContext'
import { CitySky } from './CitySky'
import { SiteFooter, SiteNav } from './SiteNav'

export function PublicShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return <div className="fn-rebuild min-h-full bg-[#f4f7f2] text-[#12332d]"><SiteNav />{children}{footer && <SiteFooter />}</div>
}

/** Inner-page header: the city's skyline as a short band behind the title (no more text-only walls). */
export function PageIntro({ eyebrow, title, body, action }: { eyebrow: string; title: string; body?: string; action?: ReactNode }) {
  const city = useCity()
  return (
    <CitySky cities={[city.slug]} variant="band">
      <div className="mx-auto max-w-7xl px-5 pb-14 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pb-20 lg:pt-20">
        <p className="sky-glass sky-ink inline-flex rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.14em]">
          {eyebrow}
        </p>
        <h1 className="sky-ink fn-display mt-4 max-w-3xl text-[clamp(2.2rem,8vw,4.25rem)] font-extrabold leading-[1.04] tracking-[-.035em]">
          {title}
        </h1>
        {body && <p className="sky-ink-soft mt-4 max-w-xl text-[17px] leading-7">{body}</p>}
        {action && <div className="mt-6 flex flex-wrap gap-3">{action}</div>}
      </div>
    </CitySky>
  )
}

export function StatTile({ label, value, detail, accent = 'gold' }: { label: string; value: ReactNode; detail?: string; accent?: 'gold' | 'teal' | 'coral' }) {
  return <div className={`fn-stat fn-stat-${accent}`}><div className="fn-stat-top"><p>{label}</p></div><strong>{value}</strong>{detail && <span className="fn-stat-detail">{detail}</span>}</div>
}

export function ActionLink({ to, children, tone = 'dark' }: { to: string; children: ReactNode; tone?: 'dark' | 'gold' | 'light' }) {
  const path = useCityPath()
  const cls = tone === 'gold' ? 'fn-action fn-action-gold' : tone === 'light' ? 'fn-action fn-action-light' : 'fn-action fn-action-dark'
  return <Link to={path(to)} className={cls}><span>{children}</span><b aria-hidden>→</b></Link>
}

export function SectionLabel({ children }: { children: ReactNode }) { return <p className="fn-eyebrow">{children}</p> }

export function OpsFrame({ title, eyebrow, description, backTo, children }: { title: string; eyebrow: string; description: string; backTo?: string; children: ReactNode }) {
  const path = useCityPath()
  return <PublicShell><main className="fn-ops-page"><div className="fn-ops-wrap">{backTo && <Link to={path(backTo)} className="fn-back">← Back to public view</Link>}<div className="fn-ops-heading"><SectionLabel>{eyebrow}</SectionLabel><h1 className="fn-display">{title}</h1><p>{description}</p></div><div className="mt-10">{children}</div></div></main></PublicShell>
}

export function StatusChip({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'gold' | 'coral' }) { return <span className={`fn-chip fn-chip-${tone}`}><i />{children}</span> }
