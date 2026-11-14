import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { claimBounty, fetchStanding, money, myOpenClaim, STANDING_RULES, submitProof, type BountyProgress, type PayMethod, type Standing } from '../../lib/bounties'
import { uploadReportImage } from '../../lib/gemini'
import { compressImageFile } from '../../lib/uploads'
import { SignInButton } from '../auth/SignInButton'
import { PhotoPicker } from '../reports/PhotoPicker'
import { Modal } from '../ui/Modal'

/** Claim an open bounty (good standing required), then come back to upload the after-photo. */
export function ClaimSheet({ bounty, place, open, onClose, onDone }: { bounty: BountyProgress; place: string; open: boolean; onClose: () => void; onDone: () => void }) {
  const { user } = useAuth()
  const [standing, setStanding] = useState<Standing | null>(null)
  const [claim, setClaim] = useState<{ id: string; status: string } | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [payout, setPayout] = useState<PayMethod>('mpesa')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !user) return
    void fetchStanding(user.id).then(setStanding)
    void myOpenClaim(bounty.id, user.id).then(setClaim)
  }, [open, user, bounty.id])

  const doClaim = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const id = await claimBounty(bounty.id)
      setClaim({ id, status: 'claimed' })
      onDone()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not claim.')
    } finally {
      setBusy(false)
    }
  }

  const doSubmit = async () => {
    if (!user || !claim || !file) return
    setBusy(true)
    setMsg(null)
    try {
      const url = await uploadReportImage(user.id, bounty.report_id, await compressImageFile(file))
      await submitProof(claim.id, url, note, payout)
      setClaim({ ...claim, status: 'submitted' })
      onDone()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not submit proof.')
    } finally {
      setBusy(false)
    }
  }

  const checks = standing
    ? [
        { ok: standing.account_days >= STANDING_RULES.minAccountDays, label: `Account at least ${STANDING_RULES.minAccountDays} days old`, now: `${standing.account_days} days` },
        { ok: standing.points >= STANDING_RULES.minPoints, label: `${STANDING_RULES.minPoints}+ impact points`, now: `${standing.points} pts` },
        { ok: standing.reports >= STANDING_RULES.minReports, label: `${STANDING_RULES.minReports}+ spots reported or cleared`, now: `${standing.reports}` },
        { ok: standing.open_claims === 0, label: 'No other bounty in progress', now: standing.open_claims ? 'busy' : 'free' },
      ]
    : []

  return (
    <Modal open={open} onClose={onClose} title={`Claim · ${place}`}>
      {!user ? (
        <div className="space-y-3 text-sm text-[#5d746e]">
          <p>Only members in good standing can claim bounties, so funders know a real, accountable crew is doing the work.</p>
          <SignInButton variant="dark" label="Sign in to claim" className="w-full" />
        </div>
      ) : claim?.status === 'submitted' ? (
        <p className="text-center text-sm text-[#5d746e]">
          <span className="block text-5xl">🔍</span>
          <b className="mt-2 block text-lg text-[#063b32]">Proof in review</b>
          The team checks your after-photo against the original. Payout of {money(bounty.currency, bounty.target_amount)} follows approval.
        </p>
      ) : claim ? (
        <div className="space-y-3">
          <p className="rounded-2xl bg-[#effaf5] p-3 text-sm text-[#063b32]">
            ⏱️ It's yours until <b>{bounty.claim_expires_at ? new Date(bounty.claim_expires_at).toLocaleString() : '48 hours from claiming'}</b>. Clean it, then upload an after-photo from the same angle.
          </p>
          <PhotoPicker hasPhoto={!!file} onPick={setFile} />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. 12 bags, collected by county truck at 4pm" className="fn-field text-sm" />
          <label className="block">
            <span className="fn-label">Get paid with</span>
            <select value={payout} onChange={(e) => setPayout(e.target.value as PayMethod)} className="fn-field">
              <option value="mpesa">M-Pesa</option>
              <option value="usdt">USDT (test mode)</option>
              <option value="usdc">USDC (test mode)</option>
            </select>
          </label>
          {msg ? <p className="text-sm font-bold text-[#a44738]">{msg}</p> : null}
          <button type="button" disabled={busy || !file} onClick={() => void doSubmit()} className="w-full rounded-full bg-[#0b8c76] py-3.5 font-extrabold text-white disabled:opacity-50">
            {busy ? 'Uploading…' : 'Submit proof'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#063b32] p-4 text-white">
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#fbbf24]">Bounty</p>
            <p className="text-3xl font-extrabold">{money(bounty.currency, bounty.target_amount)}</p>
            <p className="mt-1 text-xs text-white/70">48 hours to clean and upload proof. Paid after the team verifies.</p>
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#5d746e]">Good standing</p>
            {standing ? (
              <ul className="mt-2 space-y-1.5">
                {checks.map((c) => (
                  <li key={c.label} className="flex items-center gap-2 text-sm">
                    <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-extrabold ${c.ok ? 'bg-[#0b8c76] text-white' : 'bg-[#f3f7f4] text-[#a44738]'}`}>{c.ok ? '✓' : '·'}</span>
                    <span className="flex-1 text-[#12332d]">{c.label}</span>
                    <span className="text-xs text-[#5d746e]">{c.now}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[#5d746e]">Checking your record…</p>
            )}
          </div>
          {msg ? <p className="text-sm font-bold text-[#a44738]">{msg}</p> : null}
          <button type="button" disabled={busy || !standing?.eligible} onClick={() => void doClaim()} className="w-full rounded-full bg-[#fbbf24] py-3.5 font-extrabold text-[#063b32] disabled:opacity-50">
            {standing && !standing.eligible ? 'Keep reporting to unlock claiming' : busy ? 'Claiming…' : 'Claim this bounty'}
          </button>
        </div>
      )}
    </Modal>
  )
}
