import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { SignInButton } from '../auth/SignInButton'
import { useCity } from '../../lib/CityContext'
import { applyAsOrganizer, myApplication, type OrganizerApplication } from '../../lib/organizers'

/** Shown to signed-in users who aren't verified organisers yet: apply, or see where the application is. */
export function OrganizerApply() {
  const { user, profile, refreshProfile } = useAuth()
  const city = useCity()
  const [app, setApp] = useState<OrganizerApplication | null | undefined>(undefined)
  const [form, setForm] = useState({ full_name: '', phone: '', neighbourhood: '', motivation: '', experience: '', links: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    void myApplication(user.id).then((a) => !cancelled && setApp(a))
    return () => {
      cancelled = true
    }
  }, [user])

  if (!user) {
    return (
      <div className="space-y-3 rounded-[1.5rem] bg-[#effaf5] p-6 text-[#063b32]">
        <h2 className="text-xl font-extrabold">Sign in to organise cleanups</h2>
        <p className="text-sm leading-6 text-[#36564e]">
          Anyone can join cleanups. To post your own, sign in and apply to become a verified organiser. It takes 2 minutes.
        </p>
        <SignInButton variant="dark" label="Sign in to apply" />
      </div>
    )
  }
  if (app === undefined) return <p className="text-sm text-[#5d746e]">Loading…</p>

  if (app?.status === 'pending' || profile?.organizer_status === 'pending') {
    return (
      <div className="rounded-[1.5rem] bg-[#effaf5] p-6 text-[#063b32]">
        <p className="text-3xl">⏳</p>
        <h2 className="mt-2 text-xl font-extrabold">Your organiser application is under review</h2>
        <p className="mt-2 text-sm leading-6 text-[#36564e]">
          The Ramani-Taka team usually replies within a few days. Once you're verified you can post cleanups here and they'll
          appear on the map. Until then, you can still report spots and join other cleanups.
        </p>
      </div>
    )
  }

  const declined = app?.status === 'declined'
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await applyAsOrganizer(
        {
          user_id: user.id,
          city: city.slug,
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          neighbourhood: form.neighbourhood.trim(),
          motivation: form.motivation.trim(),
          experience: form.experience.trim() || null,
          links: form.links.trim() || null,
        },
        declined,
      )
      setApp(await myApplication(user.id))
      void refreshProfile?.()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not send your application.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#063b32]">Become a verified organiser</h2>
      <p className="text-sm leading-6 text-[#5d746e]">
        Anyone can report spots and join cleanups. To <b>post</b> cleanups for others to join, we verify organisers first, so
        every event on Ramani-Taka is real and safe. It takes 2 minutes.
      </p>
      {declined && app?.admin_note ? (
        <p className="fn-warn">Your last application wasn't approved: {app.admin_note}. You're welcome to apply again.</p>
      ) : null}
      <input required minLength={2} maxLength={80} value={form.full_name} onChange={set('full_name')} placeholder="Full name" className="fn-field" />
      <input required type="tel" minLength={7} maxLength={20} value={form.phone} onChange={set('phone')} placeholder="Phone (only the team sees this)" className="fn-field" />
      <input required minLength={2} maxLength={80} value={form.neighbourhood} onChange={set('neighbourhood')} placeholder={`Your neighbourhood in ${city.label}`} className="fn-field" />
      <textarea required minLength={10} maxLength={800} rows={3} value={form.motivation} onChange={set('motivation')} placeholder="Why do you want to organise cleanups?" className="fn-field" />
      <textarea maxLength={800} rows={2} value={form.experience} onChange={set('experience')} placeholder="Cleanups or community work you've done before (optional)" className="fn-field" />
      <input maxLength={300} value={form.links} onChange={set('links')} placeholder="Social media or group links (optional)" className="fn-field" />
      {msg ? <p className="text-sm font-bold text-[#a44738]">{msg}</p> : null}
      <button type="submit" disabled={busy} className="fn-action fn-action-gold justify-center disabled:opacity-50">
        {busy ? 'Sending…' : declined ? 'Apply again' : 'Apply to organise'}
      </button>
    </form>
  )
}
