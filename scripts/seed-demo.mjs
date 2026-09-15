/**
 * Seeds demo hotspots when SUPABASE_SERVICE_ROLE_KEY is set.
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo.mjs [user-uuid]
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env')

function loadEnv() {
  const vars = {}
  if (!existsSync(envPath)) return vars
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    'Set VITE_SUPABASE_URL in .env and SUPABASE_SERVICE_ROLE_KEY in the environment.\n' +
      'Service role: Supabase → Project Settings → API → service_role (secret).\n' +
      'Or run scripts/seed-demo-reports.sql in the SQL Editor after sign-in.',
  )
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let userId = process.argv[2]

if (!userId) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1 })
  if (error || !data.users?.length) {
    console.error(
      'No auth users found. Sign in once via the app, then re-run:\n' +
        '  node scripts/seed-demo.mjs <your-user-uuid>',
    )
    process.exit(1)
  }
  userId = data.users[0].id
  console.log(`Using first auth user: ${userId}`)
}

const reports = [
  {
    user_id: userId,
    latitude: -1.286389,
    longitude: 36.817223,
    severity_score: 8,
    status: 'active',
    image_url: 'https://picsum.photos/seed/trash1/400/300',
    ai_tags: ['plastic', 'overflow'],
  },
  {
    user_id: userId,
    latitude: -1.292,
    longitude: 36.821,
    severity_score: 6,
    status: 'active',
    image_url: 'https://picsum.photos/seed/trash2/400/300',
    ai_tags: ['bags', 'street'],
  },
  {
    user_id: userId,
    latitude: -1.28,
    longitude: 36.81,
    severity_score: 9,
    status: 'active',
    image_url: 'https://picsum.photos/seed/trash3/400/300',
    ai_tags: ['dump', 'severe'],
  },
]

const { error } = await admin.from('reports').insert(reports)
if (error) {
  console.error('Seed failed:', error.message)
  process.exit(1)
}

console.log(`✓ Inserted ${reports.length} demo reports for user ${userId}`)
