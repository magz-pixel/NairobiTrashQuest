import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useReports } from '../hooks/useReports'
import { useReportStats } from '../hooks/useReportStats'
import { SignInButton } from '../components/auth/SignInButton'
import { ReferenceHero } from '../components/site/ReferenceHero'
import { SiteFooter } from '../components/site/SiteNav'

const features = [
  { eyebrow: '01 / Find the spot', title: 'See what needs doing.', copy: 'Reports from Eastlands, the CBD, Donholm and beyond, gathered in one honest view of the streets.', tone: 'dark' },
  { eyebrow: '02 / Bring the crew', title: 'Turn a pin into a plan.', copy: 'Add a photo, share the location, and give neighbours the context they need to show up.', tone: 'mint' },
  { eyebrow: '03 / Show the change', title: 'Leave a clean trace.', copy: 'When a place is cleared, the community can verify it. Progress should be easy to see and hard to fake.', tone: 'gold' },
]

export function CommandCenterPage() {
  const { user, profile } = useAuth()
  const { allReports, loading } = useReports()
  const stats = useReportStats(allReports)
  const firstName = profile?.username?.split(' ')[0] ?? 'neighbour'

  return (
    <div className="fn-rebuild min-h-full overflow-hidden bg-canvas text-ink">
      <main>
        <ReferenceHero stats={stats} loading={loading} />

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700">How it works on the ground</p><h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-[-.05em] sm:text-5xl">A small action. A visible difference.</h2></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{features.map((feature, index) => <motion.article key={feature.eyebrow} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }} className={`min-h-[320px] rounded-[1.5rem] p-6 sm:p-8 ${feature.tone === 'dark' ? 'bg-emerald-950 text-white' : feature.tone === 'gold' ? 'bg-gold-100 text-emerald-950' : 'bg-[#dff0e9] text-ink'}`}><div className="flex items-start justify-between"><span className="text-xs font-extrabold uppercase tracking-[.18em] opacity-65">{feature.eyebrow}</span><span className="text-2xl">↗</span></div><div className="mt-24"><h3 className="text-2xl font-extrabold tracking-[-.04em]">{feature.title}</h3><p className="mt-3 text-sm leading-6 opacity-70">{feature.copy}</p></div></motion.article>)}</div></section>

        <section className="bg-[#e7f4ef] px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700">No black boxes</p><h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-[-.05em]">If the street changes, you should be able to see it.</h2><p className="mt-5 max-w-md text-base leading-7 text-muted">From first report to verified clear, the trail stays open to the people who raised it.</p><Link to="/funds" className="mt-7 inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-900">See the public ledger →</Link></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-[1.5rem] bg-white p-6 shadow-[var(--shadow-card)]"><p className="text-5xl font-extrabold tracking-[-.06em] text-emerald-800">{loading ? '—' : stats.resolutionRate}%</p><p className="mt-3 font-bold">resolution rate</p><p className="mt-2 text-sm leading-6 text-muted">Reports that moved from signal to verified clear.</p></div><div className="rounded-[1.5rem] bg-emerald-950 p-6 text-white shadow-[var(--shadow-card)]"><p className="text-5xl font-extrabold tracking-[-.06em] text-gold-300">24/7</p><p className="mt-3 font-bold">community signal</p><p className="mt-2 text-sm leading-6 text-teal-100/65">A living view of what needs attention next.</p></div></div></div></section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="rounded-[2rem] bg-emerald-900 px-6 py-12 text-center text-white sm:px-12"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-gold-300">Take it from here</p><h2 className="mx-auto mt-4 max-w-2xl text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">See a dirty spot? Put it where people can act.</h2><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-teal-50/70">One photo. One location. One more reason for a crew to show up.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/map" className="inline-flex min-h-12 items-center rounded-[var(--radius-control)] bg-gold-400 px-6 text-sm font-extrabold text-emerald-950 hover:bg-gold-300">Open the map ↗</Link>{user ? <Link to="/me" className="inline-flex min-h-12 items-center rounded-[var(--radius-control)] border border-white/20 px-6 text-sm font-bold text-white hover:bg-white/10">Hi, {firstName}</Link> : <SignInButton label="Join the crew" className="min-h-12 border border-white/20 bg-white/10 text-white hover:bg-white/15" />}</div></div></section>
      </main>
      <SiteFooter />
    </div>
  )
}
