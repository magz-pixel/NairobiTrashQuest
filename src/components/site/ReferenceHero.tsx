import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReportStats } from '../../types/database'
import { useCity, useCityPath } from '../../lib/CityContext'

interface ReferenceHeroProps {
  stats: ReportStats
  loading: boolean
}

const arrow = 'M5 12h14M13 6l6 6-6 6'
const navItems = [
  ['Mission', '/mission'],
  ['Trash Map', '/map'],
  ['Cleanups', '/cleanups'],
  ['Trash Race', '/race'],
  ['Leaderboard', '/race/leaderboard'],
  ['Funds', '/funds'],
  ['My impact', '/me'],
] as const

export function ReferenceHero({ stats, loading }: ReferenceHeroProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const city = useCity()
  const path = useCityPath()

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', menuOpen)
    return () => document.body.classList.remove('overflow-hidden')
  }, [menuOpen])

  return (
    <section className="relative grid min-h-[max(680px,100svh)] w-full grid-cols-1 gap-5 overflow-hidden bg-canvas p-4 text-ink sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,.92fr)] lg:gap-8 lg:p-8 max-[768px]:block max-[768px]:min-h-[100svh] max-[768px]:p-0 max-[768px]:text-white">
      <div className="relative z-10 order-2 flex min-w-0 flex-col px-1 lg:order-1 lg:pl-5 max-[768px]:h-full max-[768px]:min-h-[100svh] max-[768px]:p-5 max-[420px]:p-4">
        <div className="flex items-center gap-8 pt-1 text-sm font-semibold text-ink sm:gap-12 max-[768px]:text-white">
          <Link to="/" className="shrink-0 text-sm font-extrabold uppercase tracking-[.08em] max-[768px]:text-white">Ramani-Taka</Link>
          <span className="hidden text-xs font-medium text-muted sm:inline max-[768px]:text-white/70">{city.label}, {city.country}</span>
          <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="group ml-auto flex h-10 w-11 flex-col items-end justify-center gap-1.5 rounded-lg p-2 text-ink transition hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 max-[768px]:text-white max-[768px]:hover:bg-white/10">
            <span className={`block h-0.5 rounded-full bg-current transition-all duration-300 ${menuOpen ? 'w-7 translate-y-2 rotate-45' : 'w-7'}`} />
            <span className={`block h-0.5 rounded-full bg-current transition-all duration-200 ${menuOpen ? 'w-7 opacity-0' : 'w-5'}`} />
            <span className={`block h-0.5 rounded-full bg-current transition-all duration-300 ${menuOpen ? 'w-7 -translate-y-1.5 -rotate-45' : 'w-7'}`} />
          </button>
        </div>
        <div className="mt-auto max-w-3xl py-10 sm:py-14 lg:py-16 max-[768px]:py-8 max-[420px]:py-5">
          <p className="mb-5 text-[11px] font-extrabold uppercase tracking-[.22em] text-muted max-[768px]:text-white/70">Ramani-Taka / field note 01</p>
          <h1 className="m-0 max-w-3xl text-[clamp(2.7rem,5.2vw,5.8rem)] font-semibold leading-[1.02] tracking-[-.055em] text-ink max-[768px]:text-[clamp(2rem,9.2vw,3rem)] max-[768px]:leading-[1.14] max-[768px]:text-white max-[420px]:text-[clamp(1.8rem,8.6vw,2.4rem)]">{city.label}, show us <span className="inline-block rounded-[16px] bg-[radial-gradient(circle_at_30%_30%,#45c6ae,#075e50_56%,#063b32)] px-[.2em] pb-[.14em] pt-[.06em] text-white shadow-[0_12px_30px_rgba(6,59,50,.16)] max-[768px]:rounded-xl">where it hurts.</span></h1>
          <p className="mt-7 max-w-[47ch] text-[clamp(14px,1.02vw,17px)] leading-[1.9] text-muted max-[768px]:mt-5 max-[768px]:max-w-[38ch] max-[768px]:text-[15px] max-[768px]:leading-[1.75] max-[768px]:text-white/85 max-[420px]:text-sm max-[420px]:leading-[1.7]">Report a dirty spot, rally a cleanup, and come back to show the change. The city gets better when the people who live here can see what is happening.</p>
          <Link to={path('/map')} className="group mt-9 inline-flex items-center gap-5 text-base font-semibold text-ink sm:mt-12 max-[768px]:mt-8 max-[768px]:text-white"><span>See the field map</span><span className="grid h-14 w-14 place-items-center rounded-full border border-ink/55 transition group-hover:translate-x-1 group-hover:bg-ink group-hover:text-white max-[768px]:border-white/70 max-[768px]:group-hover:bg-white max-[768px]:group-hover:text-ink"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d={arrow} /></svg></span></Link>
        </div>
      </div>

      <div className="order-1 isolate relative min-h-[430px] overflow-hidden rounded-[26px] bg-emerald-950 shadow-[0_24px_80px_rgba(6,59,50,.18)] lg:order-2 lg:min-h-0 max-[768px]:absolute max-[768px]:inset-0 max-[768px]:min-h-0 max-[768px]:rounded-none max-[768px]:shadow-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(251,191,36,.28),transparent_22%),radial-gradient(circle_at_22%_68%,rgba(45,212,191,.3),transparent_24%),linear-gradient(140deg,#063b32,#0b8c76 54%,#e0a426)]" />
        <video className="absolute inset-0 h-full w-full object-cover opacity-100" autoPlay muted loop playsInline preload="metadata" aria-hidden>
          <source src="/hero-nairobi-cleanup.mp4" type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 hidden max-[768px]:block max-[768px]:bg-[linear-gradient(180deg,rgba(4,18,28,.74)_0%,rgba(4,18,28,.48)_42%,rgba(4,18,28,.9)_100%)]" />
        <div className="absolute bottom-0 right-0 rounded-tl-[36px] bg-white px-5 py-4 text-ink sm:px-7 sm:py-5 max-[768px]:hidden"><Link to={path('/map')} aria-label="Open the field map" className="text-xs font-extrabold uppercase tracking-[.12em] hover:text-emerald-700">Open the map ↗</Link></div>
      </div>
      <div className={`fixed inset-0 z-50 transition ${menuOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'}`} aria-hidden={!menuOpen}>
        <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className={`absolute inset-0 bg-emerald-950/55 backdrop-blur-md transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`} />
        <nav aria-label="Primary navigation" className={`absolute inset-4 grid overflow-hidden rounded-[28px] bg-emerald-950 text-white shadow-[0_30px_100px_rgba(0,0,0,.35)] transition duration-500 sm:inset-6 lg:inset-8 lg:grid-cols-[1.35fr_.65fr] ${menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
          <div className="flex min-h-0 flex-col px-6 pb-6 pt-6 sm:px-10 sm:pb-10 sm:pt-8 lg:px-14">
            <div className="flex items-center justify-between border-b border-white/15 pb-6"><div><p className="text-[10px] font-extrabold uppercase tracking-[.24em] text-teal-200">Ramani-Taka / menu</p><p className="mt-1 text-sm text-white/50">Choose your next move</p></div><button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="grid h-11 w-11 place-items-center rounded-full border border-white/25 text-2xl leading-none transition hover:bg-white hover:text-emerald-950">×</button></div>
            <ul className="mt-5 overflow-x-hidden overflow-y-auto">{navItems.map(([label, href], index) => <li key={href}><Link to={path(href)} onClick={() => setMenuOpen(false)} className="group flex items-center gap-4 border-b border-white/10 py-3.5 transition hover:pl-3 hover:text-teal-200 sm:py-4"><span className="w-7 text-[10px] font-bold text-white/35">0{index + 1}</span><span className="text-[clamp(1.45rem,4vw,2.8rem)] font-semibold leading-none tracking-[-.045em]">{label}</span><span className="ml-auto translate-x-2 text-2xl opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">↗</span></Link></li>)}</ul>
            <div className="mt-auto flex flex-wrap items-center gap-4 pt-6 text-xs text-white/50"><span>Made for the people on the ground.</span><span className="h-1 w-1 rounded-full bg-gold-400" /><span>{city.label}, {city.country}</span></div>
          </div>
          <div className="relative hidden overflow-hidden bg-[#d9eee7] p-8 text-emerald-950 lg:flex lg:flex-col lg:justify-between lg:p-10"><div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-300/70 blur-2xl" /><div className="relative"><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-emerald-700">The field brief</p><h2 className="mt-5 max-w-xs text-4xl font-extrabold leading-[.95] tracking-[-.06em]">Put the city back in our hands.</h2><p className="mt-5 max-w-xs text-sm leading-6 text-emerald-950/65">One report can give a crew the place, the proof, and the reason to show up.</p></div><div className="relative rounded-2xl bg-white/75 p-5 shadow-sm"><div className="flex items-end justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-muted">Open places today</p><p className="mt-2 text-5xl font-extrabold tracking-[-.07em]">{loading ? '—' : stats.active}</p></div><span className="mb-1 h-3 w-3 rounded-full bg-[#ef8268] shadow-[0_0_0_7px_rgba(239,130,104,.18)]" /></div><Link to={path('/map')} onClick={() => setMenuOpen(false)} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-900 text-sm font-bold text-white transition hover:bg-emerald-700">Open the field map ↗</Link></div></div>
        </nav>
      </div>
    </section>
  )
}
