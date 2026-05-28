/**
 * Verifies local env and Supabase connectivity for demo setup.
 * Usage: node scripts/setup-check.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env')

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

console.log('Nairobi Trash Locator — setup check\n')

if (!url || !anon) {
  console.error('✗ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  ok = false
} else {
  console.log('✓ Supabase env vars present')
}

if (env.VITE_GEMINI_API_KEY) {
  console.log('✓ VITE_GEMINI_API_KEY set (live Gemini)')
} else if (env.VITE_DEMO_MODE === 'true') {
  console.log('✓ VITE_DEMO_MODE=true (mock AI for demo)')
} else {
  console.warn('⚠ No Gemini key and demo mode off — report flow may fail')
}

if (url && anon) {
  try {
    const res = await fetch(`${url}/rest/v1/reports?select=id&limit=1`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    })
    if (res.ok) {
      const rows = await res.json()
      console.log(`✓ Supabase REST OK (${Array.isArray(rows) ? rows.length : 0} sample row(s))`)
    } else {
      console.error(`✗ Supabase REST ${res.status}: ${await res.text()}`)
      ok = false
    }
  } catch (err) {
    console.error('✗ Supabase REST failed:', err.message)
    ok = false
  }

  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anon },
    })
    if (res.ok) {
      const settings = await res.json()
      const external = settings?.external || {}
      if (external.email !== false) {
        console.log('✓ Email auth appears enabled')
      } else {
        console.warn('⚠ Enable Email provider in Supabase → Authentication → Providers')
        ok = false
      }
    }
  } catch {
    console.warn('⚠ Could not verify auth settings')
  }
}

console.log('\nManual steps (Supabase Dashboard):')
console.log('  1. Authentication → URL Configuration')
console.log('     Site URL: http://localhost:5173 (or your Vercel URL)')
console.log('     Redirect URLs: http://localhost:5173, https://your-app.vercel.app')
console.log('  2. SQL Editor → run supabase/migrations/002_realtime.sql')
console.log('  3. Optional: scripts/seed-demo-reports.sql (after first sign-in)')

process.exit(ok ? 0 : 1)
