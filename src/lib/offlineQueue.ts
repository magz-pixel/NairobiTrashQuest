/**
 * Offline reporting (roadmap #7): when there's no signal, a report (photo + details) is saved on
 * the phone in IndexedDB and sent automatically once the connection is back.
 */
import { supabase } from './supabase'
import { resolvePlace } from './wards'
import { getSessionId } from './session'
import { uploadReportImage } from './gemini'

export interface QueuedReport {
  id: string
  photo: Blob
  photoName: string
  latitude: number
  longitude: number
  severity: number
  wasteCategories: string[]
  note: string
  city: string
  queuedAt: string
}

const DB = 'rt-offline'
const STORE = 'reports'
const AUTO_APPROVE = import.meta.env.VITE_AUTO_APPROVE_REPORTS !== 'false'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const listeners = new Set<() => void>()
export function onQueueChange(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
const changed = () => listeners.forEach((fn) => fn())

export async function queueReport(r: QueuedReport) {
  await tx('readwrite', (s) => s.put(r))
  changed()
}

export async function listQueued(): Promise<QueuedReport[]> {
  try {
    return (await tx('readonly', (s) => s.getAll())) as QueuedReport[]
  } catch {
    return []
  }
}

async function remove(id: string) {
  await tx('readwrite', (s) => s.delete(id))
  changed()
}

/** True for errors that mean "no connection" rather than "the server said no". */
export function isNetworkError(err: unknown) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  const msg = err instanceof Error ? err.message : String(err)
  return /failed to fetch|network|load failed|timeout|offline/i.test(msg)
}

async function send(r: QueuedReport) {
  const file = new File([r.photo], r.photoName || 'photo.jpg', { type: r.photo.type || 'image/jpeg' })
  const imageUrl = await uploadReportImage('anonymous', r.id, file)
  const place = await resolvePlace(r.latitude, r.longitude, r.city)
  const { error } = await supabase.from('reports').upsert(
    {
      id: r.id,
      user_id: null,
      latitude: r.latitude,
      longitude: r.longitude,
      severity_score: r.severity,
      status: AUTO_APPROVE ? 'active' : 'pending',
      image_url: imageUrl,
      ai_tags: r.wasteCategories,
      is_anonymous: true,
      reporter_session: getSessionId(),
      ward_id: place?.wardId ?? null,
      area_name: place?.areaName ?? null,
      waste_type: r.wasteCategories,
      approved_at: AUTO_APPROVE ? new Date().toISOString() : null,
      moderation_note: [r.note.trim() || null, `Saved offline ${r.queuedAt}`].filter(Boolean).join(' — '),
      city: r.city,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  )
  if (error) throw error
}

let flushing = false

/** Try to send everything waiting. Returns how many were sent. */
export async function flushQueue(): Promise<number> {
  if (flushing || (typeof navigator !== 'undefined' && !navigator.onLine)) return 0
  flushing = true
  let sent = 0
  try {
    for (const r of await listQueued()) {
      try {
        await send(r)
        await remove(r.id)
        sent += 1
      } catch (err) {
        if (isNetworkError(err)) break // still offline — try again later
        // Rejected by the server (e.g. policy): keep it so nothing is silently lost.
      }
    }
  } finally {
    flushing = false
  }
  return sent
}
