# Fix Nairobi site + Amazing Trash Race S2

Marketing homepage, public fund ledger, and Season 2 race registration live in this same Vite app.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Fix Nairobi landing (with XPNC) |
| `/mission` | Journey scrapbook |
| `/map` | Existing trash locator tool |
| `/race` | Amazing Trash Race Season 2 registration + digital ticket |
| `/race/leaderboard` | Live squad leaderboard (kg + ticket bonus) |
| `/race/marshal` | Admin marshal weight logging |
| `/race/admin` | Admin registrations grouped by squad |
| `/funds` | Public money raised / spent / Donate Now (M-Pesa + USDT) |
| `/funds/manage` | Team ledger console (admin sign-in) |

## Supabase migrations (required for shared live data)

Run in the Supabase SQL Editor **in order** (or `npm run db:006` … `db:009` with a Supabase access token):

1. [`supabase/migrations/006_fund_ledger.sql`](supabase/migrations/006_fund_ledger.sql) — `fund_entries` + seed rows + RLS
2. [`supabase/migrations/007_race_registrations.sql`](supabase/migrations/007_race_registrations.sql) — `race_registrations` + RLS
3. [`supabase/migrations/008_race_weights.sql`](supabase/migrations/008_race_weights.sql) — marshal `race_weight_logs` + RLS
4. [`supabase/migrations/009_verify_cleared.sql`](supabase/migrations/009_verify_cleared.sql) — `verify_report_cleared` RPC for any signed-in cleaner
5. [`supabase/migrations/010_event_rsvps.sql`](supabase/migrations/010_event_rsvps.sql) — weekly cleanup RSVPs + `award_event_attendance`

Until 006–008 run, the UI falls back to **browser-local** ledger/tickets so you can still demo. Until 009 runs, only report owners can mark pins cleared via direct update (race volunteers need the RPC).

### Admin access for the ledger

```sql
update public.profiles
set is_admin = true
where id = '<your-auth-user-uuid>';
```

## Local demo

```bash
npm run dev
```

Open `http://localhost:5173/` — landing → register → funds → map.

## Race week follow-ups (ops)

See [`scripts/RACE_WEEK_CHECKLIST.md`](scripts/RACE_WEEK_CHECKLIST.md).

- Apply migrations 006–009; set `is_admin`
- Vercel: `VITE_SHOW_DEMO_DATA=false` + `VITE_MPESA_*` / `VITE_USDT_*`
- `npm run verify:race-week` and `npm run pilot:smoke-test`
- Marshal Sheet = backup only (in-app `/race/marshal` is primary)