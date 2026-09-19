import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useCityPath } from '../../lib/CityContext'
import { SiteFooter, SiteNav } from './SiteNav'

export function PublicShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return <div className="fn-rebuild min-h-full bg-[#f4f7f2] text-[#12332d]"><SiteNav /><div className="fn-page-rail" aria-hidden="true" />{children}{footer && <SiteFooter />}</div>
}

export function PageIntro({ eyebrow, title, body, action }: { eyebrow: string; title: string; body?: string; action?: ReactNode }) {
  return <header className="fn-intro"><div className="fn-intro-index" aria-hidden="true"><span>RT</span><b>2026</b></div><div className="fn-intro-copy"><p className="fn-eyebrow">{eyebrow}</p><h1 className="fn-display">{title}</h1>{body && <p className="fn-intro-body">{body}</p>}{action && <div className="fn-intro-actions">{action}</div>}</div><div className="fn-intro-signal" aria-hidden="true"><span>FIELD SIGNAL</span><i /><i /><i /><i /></div></header>
}

export function StatTile({ label, value, detail, accent = 'gold' }: { label: string; value: ReactNode; detail?: string; accent?: 'gold' | 'teal' | 'coral' }) {
  return <div className={`fn-stat fn-stat-${accent}`}><div className="fn-stat-top"><p>{label}</p><span>↗</span></div><strong>{value}</strong>{detail && <span className="fn-stat-detail">{detail}</span>}</div>
}

export function ActionLink({ to, children, tone = 'dark' }: { to: string; children: ReactNode; tone?: 'dark' | 'gold' | 'light' }) {
  const path = useCityPath()
  const cls = tone === 'gold' ? 'fn-action fn-action-gold' : tone === 'light' ? 'fn-action fn-action-light' : 'fn-action fn-action-dark'
  return <Link to={path(to)} className={cls}><span>{children}</span><b aria-hidden>↗</b></Link>
}

export function SectionLabel({ children }: { children: ReactNode }) { return <p className="fn-eyebrow">{children}</p> }

export function OpsFrame({ title, eyebrow, description, backTo, children }: { title: string; eyebrow: string; description: string; backTo?: string; children: ReactNode }) {
  const path = useCityPath()
  return <PublicShell><main className="fn-ops-page"><div className="fn-ops-wrap">{backTo && <Link to={path(backTo)} className="fn-back">← Back to public view</Link>}<div className="fn-ops-heading"><SectionLabel>{eyebrow}</SectionLabel><h1 className="fn-display">{title}</h1><p>{description}</p></div><div className="mt-10">{children}</div></div></main></PublicShell>
}

export function StatusChip({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'gold' | 'coral' }) { return <span className={`fn-chip fn-chip-${tone}`}><i />{children}</span> }
