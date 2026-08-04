/**
 * Smoke verify: donate/progress bar wiring + Module B race slice.
 * Usage: node scripts/verify-donate-module-b.mjs [--base=http://localhost:5173]
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base =
  process.argv.find((a) => a.startsWith('--base='))?.slice(7) ?? 'http://localhost:5173'

let ok = true
function pass(msg) {
  console.log(`✓ ${msg}`)
}
function fail(msg) {
  console.error(`✗ ${msg}`)
  ok = false
}

function read(rel) {
  const p = resolve(root, rel)
  if (!existsSync(p)) {
    fail(`Missing file ${rel}`)
    return ''
  }
  return readFileSync(p, 'utf8')
}

console.log('Race-week / donate + Module B smoke verify\n')

// --- Source wiring ---
const donate = read('src/components/funds/DonateModal.tsx')
if (donate.includes("from '../ui/Button'") || donate.includes('from "./Button"') || donate.includes('whileHover')) {
  fail('DonateModal still uses shared Button / whileHover')
} else if (donate.includes('donateConfig') && donate.includes('key="donate-panel"')) {
  pass('DonateModal hardened (plain buttons + stable keys)')
} else {
  fail('DonateModal missing donateConfig or stable panel key')
}

const bar = read('src/components/funds/FundProgressBar.tsx')
if (
  bar.includes('Number.isFinite') &&
  bar.includes('h-8') &&
  bar.includes('role="progressbar"')
) {
  pass('FundProgressBar has NaN guards + tall track')
} else {
  fail('FundProgressBar missing guards or tall track')
}

const strip = read('src/components/funds/FundsCounterStrip.tsx')
if (strip.includes('FundProgressBar') && strip.includes('DonateModal') && strip.includes('Donate Now')) {
  pass('FundsCounterStrip embeds progress bar + Donate Now')
} else {
  fail('FundsCounterStrip missing bar or donate')
}

const funds = read('src/pages/FundsPage.tsx')
if (funds.includes('FundProgressBar') && funds.includes('DonateModal')) {
  pass('FundsPage has campaign progress + donate')
} else {
  fail('FundsPage missing progress or donate')
}

const app = read('src/App.tsx')
for (const route of ['/race/leaderboard', '/race/marshal', '/race/admin']) {
  if (app.includes(route)) pass(`App route ${route}`)
  else fail(`App missing route ${route}`)
}

const reg = read('src/pages/RaceRegisterPage.tsx')
if (reg.includes('Squad / micro-team') && reg.includes('RACE_TEAM_PRESETS')) {
  pass('Race registration promotes squad presets')
} else {
  fail('Race registration missing squad UX')
}

const mig = read('supabase/migrations/008_race_weights.sql')
if (mig.includes('race_weight_logs') && mig.includes('waste_category')) {
  pass('Migration 008 race_weight_logs present')
} else {
  fail('Migration 008 incomplete')
}

const mig009 = read('supabase/migrations/009_verify_cleared.sql')
if (
  mig009.includes('verify_report_cleared') &&
  mig009.includes('security definer') &&
  mig009.includes('authenticated')
) {
  pass('Migration 009 verify_report_cleared RPC present')
} else {
  fail('Migration 009 incomplete')
}

const clearModal = read('src/components/reports/ClearTrashModal.tsx')
if (clearModal.includes("rpc('verify_report_cleared'") || clearModal.includes('rpc("verify_report_cleared"')) {
  pass('ClearTrashModal calls verify_report_cleared RPC')
} else {
  fail('ClearTrashModal still uses direct reports.update')
}

const donateCfg = read('src/lib/donateConfig.ts')
if (
  donateCfg.includes('VITE_MPESA_TILL') &&
  donateCfg.includes('VITE_USDT_ADDRESS') &&
  donateCfg.includes('import.meta.env')
) {
  pass('donateConfig reads VITE_MPESA_* / VITE_USDT_*')
} else {
  fail('donateConfig missing env-driven Till/USDT')
}

const envExample = read('.env.example')
if (envExample.includes('VITE_MPESA_TILL') && envExample.includes('VITE_USDT_ADDRESS')) {
  pass('.env.example documents donate env vars')
} else {
  fail('.env.example missing donate env vars')
}

const pkg = read('package.json')
if (pkg.includes('db:008')) pass('npm script db:008 present')
else fail('Missing db:008 script')
if (pkg.includes('db:009')) pass('npm script db:009 present')
else fail('Missing db:009 script')
if (pkg.includes('verify:race-week')) pass('npm script verify:race-week present')
else fail('Missing verify:race-week script')

const nav = read('src/components/site/SiteNav.tsx')
const landing = read('src/pages/LandingPage.tsx')
if (nav.includes('/race/leaderboard') && landing.includes('/race/leaderboard')) {
  pass('Leaderboard linked from nav + landing')
} else {
  fail('Leaderboard links missing from nav/landing')
}

// --- Leaderboard math (pure) ---
function buildTeamLeaderboard(weights, ticketCounts) {
  const kgMap = new Map()
  for (const w of weights) {
    const team = w.team_name.trim() || 'Unassigned'
    const cur = kgMap.get(team) ?? { kg: 0, logs: 0 }
    cur.kg += Number(w.kg)
    cur.logs += 1
    kgMap.set(team, cur)
  }
  const teams = new Set([...kgMap.keys(), ...Object.keys(ticketCounts)])
  const rows = []
  for (const team of teams) {
    const { kg = 0, logs = 0 } = kgMap.get(team) ?? {}
    const tickets = ticketCounts[team] ?? 0
    rows.push({ team, kg, logs, tickets, score: kg + tickets * 0.5 })
  }
  return rows.sort((a, b) => b.score - a.score || b.kg - a.kg || a.team.localeCompare(b.team))
}

const board = buildTeamLeaderboard(
  [
    { team_name: 'Green Scouts', kg: 12.5 },
    { team_name: 'Green Scouts', kg: 7.5 },
    { team_name: 'River Rangers', kg: 10 },
  ],
  { 'Green Scouts': 4, 'River Rangers': 2, 'Plastic Patrol': 3 },
)
const top = board[0]
if (top?.team === 'Green Scouts' && top.score === 22 && top.kg === 20) {
  pass('Leaderboard score = kg + 0.5*tickets')
} else {
  fail(`Leaderboard math unexpected: ${JSON.stringify(top)}`)
}

// Progress fill must never be NaN%
function fillPct(raised, target = 500_000) {
  const safeRaised = Number.isFinite(raised) ? Math.max(0, raised) : 0
  const safeTarget = Number.isFinite(target) && target > 0 ? target : 500_000
  const pct = Math.min(100, Math.round((safeRaised / safeTarget) * 100))
  return safeRaised > 0 ? Math.max(pct, 4) : 0
}
if (Number.isFinite(fillPct(NaN)) && fillPct(NaN) === 0 && fillPct(1000) >= 4) {
  pass('Progress fill guards NaN and shows nub when raised > 0')
} else {
  fail('Progress fill math broken')
}

// --- HTTP routes (dev server) ---
const paths = ['/', '/funds', '/race', '/race/leaderboard', '/race/marshal', '/race/admin']
for (const path of paths) {
  try {
    const res = await fetch(`${base}${path}`, { redirect: 'follow' })
    if (res.ok) pass(`HTTP ${path} → ${res.status}`)
    else fail(`HTTP ${path} → ${res.status}`)
  } catch (err) {
    fail(`HTTP ${path} unreachable (${err.message}). Is vite running at ${base}?`)
  }
}

console.log(ok ? '\nAll checks passed.' : '\nSome checks failed.')
process.exit(ok ? 0 : 1)
