# Amazing Trash Race Season 2 — race-week checklist

Track these before race day.

## Must verify

- [ ] Run SQL migrations in order (or `npm run db:006` → `db:007` → `db:008` → `db:009` with Supabase access token):
  - `006_fund_ledger.sql`
  - `007_race_registrations.sql`
  - `008_race_weights.sql`
  - `009_verify_cleared.sql` (any signed-in cleaner can clear pins via RPC)
  - `010_event_rsvps.sql` (weekly cleanup RSVP + attendance XP)
- [ ] Set at least one `profiles.is_admin = true` for fund ledger + marshal + cleanup admin + CSV export
- [ ] Auth redirect URLs include production Vercel domain
- [ ] Production Vercel env (see below)
- [ ] Dry-run: report → corroborate → verify cleanup on a real phone
- [ ] Dry-run: register squad → `/race/marshal` log kg → `/race/leaderboard` updates
- [ ] `npm run verify:race-week` (local wiring) and `npm run pilot:smoke-test` (prod URL)

## Vercel / production env

```
VITE_SHOW_DEMO_DATA=false
# do NOT set VITE_FORCE_DEMO_DATA

VITE_MPESA_TILL=<real till or paybill>
VITE_MPESA_ACCOUNT_NAME=Fix Nairobi
VITE_MPESA_REFERENCE=DONATE
VITE_USDT_ADDRESS=<real TRC20 address>
VITE_USDT_NETWORK=TRC20 (Tron)
```

## Verify-cleanup RLS

Shipped in `009_verify_cleared.sql`: `verify_report_cleared(report_uuid, cleared_image)` security-definer RPC. Client uses it from Clear Trash modal. Apply 009 before race day or non-owners cannot clear others’ pins.

## Module B (shipped) + Sheet backup

In-app Event Engine slice is live:

- Squad registration: `/race`
- Marshal weights: `/race/marshal` (admin)
- Live leaderboard: `/race/leaderboard`
- Admin teams: `/race/admin`

Use a shared Google Sheet only as **backup** if the marshal phone loses connectivity; merge later with CSV export.

## Day-of URLs

- Org home: `/`
- Join / My impact: nav **Join** or `/me`
- Weekly cleanups: `/cleanups` (admin `/cleanups/manage`)
- Mission scrapbook: `/mission`
- Registration: `/race`
- Leaderboard: `/race/leaderboard`
- Marshal weights: `/race/marshal`
- Map: `/map`
- Funds (+ Donate Now): `/funds`

## Human-only (not agent)

- Paste real Till / USDT into Vercel env
- Confirm Auth redirects in Supabase dashboard
- Phone dry-runs after deploy
