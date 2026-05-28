import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { uploadCleanupMedia } from '../../lib/uploads'
import type { Post } from '../../types/database'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface BlogPanelProps {
  open: boolean
  onClose: () => void
}

export function BlogPanel({ open, onClose }: BlogPanelProps) {
  const { user } = useAuth()
  const beforeRef = useRef<HTMLInputElement>(null)
  const afterRef = useRef<HTMLInputElement>(null)

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchPosts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    setPosts((data ?? []) as Post[])
    setLoading(false)
  }

  useEffect(() => {
    if (!open) return
    fetchPosts()
  }, [open])

  const submitPost = async () => {
    if (!user) {
      setStatus('Sign in required.')
      return
    }
    if (!title.trim() || !body.trim()) {
      setStatus('Add a title and a short writeup.')
      return
    }

    setSubmitting(true)
    setStatus('Posting…')
    try {
      let beforeUrl: string | null = null
      let afterUrl: string | null = null
      const baseId = crypto.randomUUID()

      if (beforeFile) {
        beforeUrl = await uploadCleanupMedia(
          user.id,
          `${baseId}-post-before`,
          beforeFile,
        )
      }
      if (afterFile) {
        afterUrl = await uploadCleanupMedia(
          user.id,
          `${baseId}-post-after`,
          afterFile,
        )
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        title: title.trim(),
        body: body.trim(),
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
      })
      if (error) throw error

      setTitle('')
      setBody('')
      setBeforeFile(null)
      setAfterFile(null)
      setStatus('Posted!')
      await fetchPosts()
      setTimeout(() => setStatus(null), 700)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close feed"
            className="absolute inset-0 z-[1100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute z-[1200] flex w-full flex-col border-white/10 bg-[var(--bg-charcoal)]/98 shadow-[0_-20px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl max-md:inset-x-0 max-md:bottom-0 max-md:h-[92dvh] max-md:rounded-t-2xl max-md:border-t md:right-0 md:top-0 md:h-full md:max-w-md md:rounded-none md:border-l md:shadow-[-8px_0_40px_rgba(0,0,0,0.5)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="border-b border-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Community feed
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                Before & after
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Share proof, stories, and progress.
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <Card className="bg-black/40">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                  Create post
                </p>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--neon-clean)]/60"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What did you clean? How much? Where?"
                  className="mt-2 h-24 w-full resize-none rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--neon-clean)]/60"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => beforeRef.current?.click()}
                  >
                    Before photo
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => afterRef.current?.click()}
                  >
                    After photo
                  </Button>
                  <input
                    ref={beforeRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)}
                  />
                  <input
                    ref={afterRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="mt-2 text-[10px] text-white/45">
                  {beforeFile ? `Before: ${beforeFile.name}` : 'Before: none'} ·{' '}
                  {afterFile ? `After: ${afterFile.name}` : 'After: none'}
                </div>
                {status && (
                  <p className="mt-2 text-xs text-[var(--neon-clean)]">{status}</p>
                )}
                <Button
                  type="button"
                  className="mt-3 w-full"
                  disabled={!user || submitting}
                  onClick={submitPost}
                >
                  {submitting ? 'Posting…' : user ? 'Post' : 'Sign in to post'}
                </Button>
              </Card>

              {loading ? (
                <p className="text-sm text-white/50">Loading posts…</p>
              ) : posts.length === 0 ? (
                <Card className="bg-black/40">
                  <p className="text-sm text-white/70">No posts yet.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {posts.map((p) => (
                    <Card key={p.id} className="bg-black/40">
                      <p className="font-semibold text-white">{p.title}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {new Date(p.created_at).toLocaleString()}
                      </p>
                      <p className="mt-2 text-sm text-white/75">{p.body}</p>
                      {(p.before_image_url || p.after_image_url) && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {p.before_image_url && (
                            <img
                              src={p.before_image_url}
                              alt="Before"
                              className="aspect-video w-full rounded-lg object-cover"
                            />
                          )}
                          {p.after_image_url && (
                            <img
                              src={p.after_image_url}
                              alt="After"
                              className="aspect-video w-full rounded-lg object-cover"
                            />
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

