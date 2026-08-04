# Go live — Supabase + Vercel (step by step)

Do these in order. About 30–60 minutes if accounts are ready.

---

## Part A — Supabase migrations (shared live data)

You need tickets, funds, race weights, verify-clear, and cleanup RSVPs on the **cloud** database (not only your laptop).

### A1. Open SQL Editor

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Open project **nairobi-trash-locator** (or your project)
3. Left menu → **SQL Editor** → **New query**

### A2. Run migrations in order

For each file below:

1. Open the file in your repo under `supabase/migrations/`
2. Copy **all** of its content
3. Paste into SQL Editor
4. Click **Run**
5. Confirm success (green / no error)

Run **in this order**:

| Order | File |
|------:|------|
| 1 | `006_fund_ledger.sql` |
| 2 | `007_race_registrations.sql` |
| 3 | `008_race_weights.sql` |
| 4 | `009_verify_cleared.sql` |
| 5 | `010_event_rsvps.sql` |

If you get “already exists” on tables/policies, that is usually fine for `if not exists` migrations. If a `create policy` fails because the policy name exists, you can skip that file or drop the old policy first.

**CLI alternative** (if you have `npx supabase login` or `SUPABASE_ACCESS_TOKEN`):

```bash
npm run db:006
npm run db:007
npm run db:008
npm run db:009
npm run db:010
```

### A3. Make Edwin (and you) admins

1. Ask each person to **Join / Sign in** once on the live (or local) site so a `profiles` row exists  
2. Supabase → **Authentication** → **Users** → copy their **User UID**  
3. SQL Editor:

```sql
update public.profiles
set is_admin = true
where id = 'PASTE-USER-UUID-HERE';
```

Or use `scripts/set-admin.sql` and replace the placeholder.

Without this, `/race/admin`, `/race/marshal`, `/cleanups/manage`, and `/funds/manage` stay locked.

### A4. Auth URLs (required for Google / magic link)

1. Supabase → **Authentication** → **URL configuration**  
2. **Site URL** = your production domain, e.g. `https://nairobi-trash-quest.vercel.app`  
3. **Redirect URLs** include:
   - `https://YOUR-VERCEL-DOMAIN/**`
   - `http://localhost:5173/**` (local dev)

4. If using **Google**: Authentication → Providers → Google → enable + Client ID/Secret from Google Cloud.

### A5. Quick proof migrations worked

In SQL Editor:

```sql
select count(*) from public.race_registrations;
select count(*) from public.fund_entries;
select count(*) from public.race_weight_logs;
-- event_rsvps may be empty until someone RSVPs
select count(*) from public.event_rsvps;
```

No “relation does not exist” errors.

---

## Part B — Vercel production

### B1. Connect / deploy the repo

1. [https://vercel.com](https://vercel.com) → your project (or **Import** the GitHub repo)  
2. Framework: **Vite** (auto)  
3. Build: `npm run build` · Output: `dist`  
4. Deploy from the branch you share with the team (usually `main`)

### B2. Environment variables

Vercel → Project → **Settings** → **Environment Variables** → Production (and Preview if you want).

**Required:**

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | Same as local `.env` |
| `VITE_SUPABASE_ANON_KEY` | Same as local `.env` |
| `VITE_SHOW_DEMO_DATA` | `false` |

**Do not set** `VITE_FORCE_DEMO_DATA` on production.

**Strongly recommended for race week:**

| Name | Value |
|------|--------|
| `VITE_MPESA_TILL` | Real Till/Paybill |
| `VITE_MPESA_ACCOUNT_NAME` | Fix Nairobi |
| `VITE_MPESA_REFERENCE` | DONATE |
| `VITE_USDT_ADDRESS` | Real wallet or leave unset (shows placeholder) |
| `VITE_USDT_NETWORK` | `TRC20 (Tron)` |

After saving env vars → **Deployments** → **Redeploy** (env only applies on new build).

### B3. Redeploy after code push

```bash
git add -A
git commit -m "Describe your change"
git push origin HEAD
```

Vercel builds automatically if the GitHub integration is on.

### B4. Smoke on production URL

1. Open `https://YOUR-DOMAIN/`  
2. **Register S2** → get ticket → confirm **no** “saved locally” amber warning  
3. Admin signs in → `/race/admin` sees that registration  
4. `/cleanups` → featured race shows **Warriors joined** count  
5. `/map` → should **not** be pure demo pins if DB has real reports and demo env is false  
6. Optional: `npm run pilot:smoke-test -- --url=https://YOUR-DOMAIN`

---

## Part C — Share with the team

**Public links**

- Home: `/`  
- Register Season 2: `/race`  
- Cleanups + race card: `/cleanups`  
- Leaderboard: `/race/leaderboard`  
- Map: `/map`  

**Edwin / coordinators (after admin flag)**

- Squads list: `/race/admin`  
- Marshal kg: `/race/marshal`  
- Post weekly cleanups: `/cleanups/manage`  
- Fund ledger: `/funds/manage`  

**WhatsApp one-liner**

> Fix Nairobi × XPNC — register free for Amazing Trash Race S2 (15 Aug):  
> `https://YOUR-DOMAIN/race`

---

## If something fails

| Symptom | Fix |
|---------|-----|
| Ticket says “Saved locally” | Migration 007 not run or wrong Supabase URL/key on Vercel |
| Admin page “access required” | Run `is_admin = true` for that user’s UUID |
| Magic link / Google broken | Auth redirect URLs + Site URL |
| Map full of fake pins | `VITE_SHOW_DEMO_DATA=false` + redeploy |
| Cleanups RSVP errors | Run migration 010 |

You are not blocked on more product features for soft launch once A + B + one real registration show up for Edwin.
