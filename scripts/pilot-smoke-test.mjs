/**
 * Production readiness smoke test for pilot launch.
 * Usage: node scripts/pilot-smoke-test.mjs [--url https://nairobi-trash-quest.vercel.app]
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env')
const prodUrl =
  process.argv.find((a) => a.startsWith('--url='))?.slice(6) ??
  'https://nairobi-trash-quest.vercel.app'

function loadEnv() {
  if (!existsSync(envPath)) return {}
  const vars = {}
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
  }
  return vars
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const anon = env.VITE_SUPABASE_ANON_KEY
let ok = true
const notes = []

function pass(msg) {
  console.log(`✓ ${msg}`)
}
function fail(msg) {
  console.error(`✗ ${msg}`)
  ok = false
}
function warn(msg) {
  console.warn(`⚠ ${msg}`)
  notes.push(msg)
}

console.log('Nairobi Trash Locator — pilot smoke test\n')
console.log(`Production URL: ${prodUrl}\n`)

if (!url || !anon) {
  fail('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
} else {
  pass('Supabase env vars present')
}

try {
  const res = await fetch(prodUrl, { redirect: 'follow' })
  if (res.ok) pass(`Production site reachable (${res.status})`)
  else fail(`Production site returned ${res.status}`)
} catch (err) {
  fail(`Production site unreachable: ${err.message}`)
}

if (url && anon) {
  const headers = { apikey: anon, Authorization: `Bearer ${anon}` }

  try {
    const res = await fetch(`${url}/rest/v1/reports?select=id,status,image_url&limit=5`, {
      headers,
    })
    if (res.ok) {
      const rows = await res.json()
      pass(`Reports API OK (${rows.length} live report(s) — demo shows when 0)`)
    } else {
      fail(`Reports API ${res.status}`)
    }
  } catch (err) {
    fail(`Reports API: ${err.message}`)
  }

  try {
    const res = await fetch(
      `${url}/rest/v1/report_corroborations?select=id&limit=1`,
      { headers },
    )
    if (res.ok) pass('Corroborations table readable')
    else fail(`Corroborations API ${res.status}`)
  } catch (err) {
    fail(`Corroborations API: ${err.message}`)
  }

  try {
    const res = await fetch(`${url}/rest/v1/cleanup_logs?select=id&limit=1`, {
      headers,
    })
    if (res.ok) pass('Cleanup logs table readable')
    else warn(`Cleanup logs API ${res.status} (sign-in required for insert)`)
  } catch {
    warn('Could not verify cleanup_logs table')
  }

  try {
    const res = await fetch(`${url}/storage/v1/object/list/report-images`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: '', limit: 1 }),
    })
    if (res.ok) {
      pass('Storage bucket "report-images" accessible')
    } else if (res.status === 404) {
      fail('Storage bucket "report-images" missing — run migrations')
    } else {
      warn(`Storage list returned ${res.status} — uploads may still work via RLS policies`)
    }
  } catch (err) {
    warn(`Storage check: ${err.message}`)
  }

  try {
    const res = await fetch(`${url}/functions/v1/analyze-trash`, {
      method: 'OPTIONS',
      headers: { apikey: anon },
    })
    if (res.ok || res.status === 204) {
      pass('analyze-trash edge function reachable')
    } else {
      warn(`analyze-trash OPTIONS returned ${res.status} — set VITE_DEMO_MODE=true on Vercel if not deployed`)
    }
  } catch {
    warn('analyze-trash edge function not reachable — use VITE_DEMO_MODE=true for pilot')
  }
}

if (env.VITE_DEMO_MODE === 'true') {
  pass('VITE_DEMO_MODE=true (AI steps will not block pilot)')
} else if (env.VITE_GEMINI_API_KEY) {
  pass('VITE_GEMINI_API_KEY set locally')
} else {
  warn('No VITE_DEMO_MODE or Gemini key locally — confirm Vercel env for production')
}

if (env.VITE_AUTO_APPROVE_REPORTS !== 'false') {
  pass('VITE_AUTO_APPROVE_REPORTS enabled (reports go live immediately)')
} else {
  warn('VITE_AUTO_APPROVE_REPORTS=false — reports need admin approval before map')
}

console.log('\n--- Manual mobile checklist (do once on a phone) ---')
console.log('1. Quick Report: photo + GPS → orange pin appears, demo data gone')
console.log('2. Second browser: tap pin → "I\'ve seen this" → count +1')
console.log('3. Sign in → tap pin → Verify cleanup → after photo at spot → teal pin')
console.log('4. Log tab: submit hours/kg → profile points update')

if (notes.length) {
  console.log('\nNotes:')
  for (const n of notes) console.log(`  • ${n}`)
}

process.exit(ok ? 0 : 1)
