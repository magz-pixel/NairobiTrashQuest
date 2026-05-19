/**
 * Run a SQL file via Supabase Management API.
 * Requires: supabase login  OR  SUPABASE_ACCESS_TOKEN env var
 *
 * Usage: node scripts/run-sql.mjs supabase/migrations/002_realtime.sql
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const projectRef = 'momkbsgfypjfujkhrtxb'
const sqlFile = process.argv[2]

if (!sqlFile) {
  console.error('Usage: node scripts/run-sql.mjs <path-to.sql>')
  process.exit(1)
}

const sqlPath = resolve(process.cwd(), sqlFile)
if (!existsSync(sqlPath)) {
  console.error('File not found:', sqlPath)
  process.exit(1)
}

function getAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN
  const tokenPath = resolve(homedir(), '.supabase', 'access-token')
  if (existsSync(tokenPath)) return readFileSync(tokenPath, 'utf8').trim()
  return null
}

const token = getAccessToken()
if (!token) {
  console.error(
    'No Supabase access token. Run: npx supabase login\n' +
      'Or set SUPABASE_ACCESS_TOKEN, then re-run.',
  )
  process.exit(1)
}

const sql = readFileSync(sqlPath, 'utf8')
const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  },
)

const body = await res.text()
if (!res.ok) {
  if (body.includes('already member of publication')) {
    console.log('✓ Already applied:', sqlFile)
    process.exit(0)
  }
  console.error(`SQL failed (${res.status}):`, body)
  process.exit(1)
}

console.log('✓ Applied:', sqlFile)
if (body && body !== '[]') console.log(body)
