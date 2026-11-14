import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { uploadReportImage } from '../../lib/gemini'
import { compressImageFile } from '../../lib/uploads'
import { SignInButton } from '../auth/SignInButton'
import { PhotoPicker } from './PhotoPicker'

interface Comment {
  id: string
  author_name: string | null
  body: string
  created_at: string
}
interface Photo {
  id: string
  url: string
  created_at: string
}

function ago(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`
}

/** Roadmap #7: extra photos and comments on a hotspot (needs migration 024). */
export function ReportDiscussion({ reportId }: { reportId: string }) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [ready, setReady] = useState<boolean | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return
    const [c, p] = await Promise.all([
      supabase.from('report_comments').select('id,author_name,body,created_at').eq('report_id', reportId).order('created_at'),
      supabase.from('report_photos').select('id,url,created_at').eq('report_id', reportId).order('created_at'),
    ])
    setReady(!c.error)
    setComments((c.data ?? []) as Comment[])
    setPhotos((p.data ?? []) as Photo[])
  }, [reportId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!cancelled) await load()
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  if (ready === false) return null // migration 024 not run yet

  const post = async () => {
    if (!user || !text.trim()) return
    setBusy(true)
    setMessage(null)
    const { error } = await supabase.from('report_comments').insert({
      report_id: reportId,
      user_id: user.id,
      author_name: profile?.username ?? null,
      body: text.trim().slice(0, 600),
    })
    setBusy(false)
    if (error) return setMessage(error.message)
    setText('')
    void load()
  }

  const addPhoto = async (file: File) => {
    if (!user) return
    setBusy(true)
    setMessage(null)
    try {
      const url = await uploadReportImage(user.id, reportId, await compressImageFile(file))
      const { error } = await supabase.from('report_photos').insert({ report_id: reportId, url, user_id: user.id })
      if (error) throw error
      setMessage('Photo added. Thanks!')
      void load()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not add the photo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-5 space-y-4">
      {photos.length > 0 ? (
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[var(--text-muted)]">More photos</p>
          <div className="-mx-1 mt-2 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
            {photos.map((p) => (
              <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="shrink-0 snap-start">
                <img src={p.url} alt="Extra photo of this spot" loading="lazy" className="h-28 w-36 rounded-xl object-cover" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[var(--text-muted)]">
          Comments {comments.length ? `· ${comments.length}` : ''}
        </p>
        {comments.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-muted)]">No comments yet. Know something about this spot? Share it.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {comments.map((c) => (
              <li key={c.id} className="rounded-xl bg-[#f3f7f4] p-3 text-sm">
                <p className="text-[var(--text-primary)]">{c.body}</p>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {c.author_name ?? 'Neighbour'} · {ago(c.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}

        {user ? (
          <div className="mt-3 space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={600}
              rows={2}
              placeholder="e.g. Still there this morning. It's blocking the drain by the stage."
              className="fn-field mt-0 text-sm"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy || !text.trim()}
                onClick={() => void post()}
                className="min-h-11 rounded-full bg-[#063b32] px-5 text-sm font-bold text-white disabled:opacity-50"
              >
                Post comment
              </button>
            </div>
            <p className="pt-1 text-[11px] font-bold text-[var(--text-muted)]">Add a newer photo of this spot</p>
            <PhotoPicker hasPhoto={false} onPick={(f) => void addPhoto(f)} />
          </div>
        ) : (
          <SignInButton variant="dark" label="Sign in to comment or add photos" className="mt-3 w-full" />
        )}
        {message ? <p className="mt-2 text-sm font-bold text-[#087766]">{message}</p> : null}
      </div>
    </section>
  )
}
