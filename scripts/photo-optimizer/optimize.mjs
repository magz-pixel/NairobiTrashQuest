/**
 * One-time photo optimiser for Supabase Storage (report-images, cleanup-media).
 *
 * For every photo over 300 KB: back up the original locally, re-upload it at 1280 px / q72
 * (same path, so existing links keep working), add a 400 px "-thumb.jpg" next to it, and set a
 * 1-year cache header. Small photos just get a thumbnail. Nothing is deleted.
 *
 * PowerShell, from this folder:
 *   npm install
 *   $env:SUPABASE_URL="https://momkbsgfypjfujkhrtxb.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="<Supabase → Project Settings → API → service_role>"
 *   node optimize.mjs            # dry run: lists what would change
 *   node optimize.mjs --apply    # does it (backups go to ./backup)
 *
 * Never commit or share the service_role key.
 */
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const APPLY = process.argv.includes('--apply')
const BUCKETS = ['report-images', 'cleanup-media']
const MIN_BYTES = 300 * 1024
const CACHE = '31536000'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first (see the top of this file).')
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false } })

async function listAll(bucket, prefix = '') {
  const out = []
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await db.storage.from(bucket).list(prefix, { limit: 100, offset })
    if (error) throw error
    for (const item of data) {
      const full = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id === null) out.push(...(await listAll(bucket, full))) // folder
      else out.push({ path: full, size: item.metadata?.size ?? 0, type: item.metadata?.mimetype ?? '' })
    }
    if (data.length < 100) break
  }
  return out
}

let savedBytes = 0
for (const bucket of BUCKETS) {
  const files = (await listAll(bucket)).filter((f) => f.type.startsWith('image/') && !f.path.endsWith('-thumb.jpg'))
  const existing = new Set(files.map((f) => f.path))
  console.log(`\n${bucket}: ${files.length} photos`)
  for (const f of files) {
    const thumbPath = f.path.replace(/\.[a-z0-9]+$/i, '-thumb.jpg')
    const big = f.size > MIN_BYTES
    const needsThumb = !existing.has(thumbPath)
    if (!big && !needsThumb) continue
    console.log(`  ${f.path}  ${(f.size / 1e6).toFixed(2)} MB${big ? '  → shrink' : ''}${needsThumb ? '  + thumb' : ''}`)
    if (!APPLY) continue

    const { data: blob, error } = await db.storage.from(bucket).download(f.path)
    if (error) { console.warn('    download failed:', error.message); continue }
    const original = Buffer.from(await blob.arrayBuffer())

    if (big) {
      const backup = path.join('backup', bucket, f.path)
      await mkdir(path.dirname(backup), { recursive: true })
      await writeFile(backup, original)
      // Keep the same path (and extension) so every saved link still works; content becomes JPEG.
      const small = await sharp(original).rotate().resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 72, mozjpeg: true }).toBuffer()
      const { error: upErr } = await db.storage.from(bucket).update(f.path, small, { contentType: 'image/jpeg', cacheControl: CACHE, upsert: true })
      if (upErr) { console.warn('    re-upload failed:', upErr.message); continue }
      savedBytes += original.length - small.length
      console.log(`    ${(original.length / 1e6).toFixed(2)} MB → ${(small.length / 1e3).toFixed(0)} KB`)
    }
    if (needsThumb) {
      const thumb = await sharp(original).rotate().resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 68, mozjpeg: true }).toBuffer()
      const { error: tErr } = await db.storage.from(bucket).upload(thumbPath, thumb, { contentType: 'image/jpeg', cacheControl: CACHE, upsert: true })
      if (tErr) console.warn('    thumbnail failed:', tErr.message)
    }
  }
}
console.log(APPLY ? `\nDone. Saved ${(savedBytes / 1e6).toFixed(1)} MB per full set of views. Backups in ./backup` : '\nDry run only. Add --apply to make the changes.')
