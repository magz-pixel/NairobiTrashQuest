# Demo quick reference

## Run locally

```bash
npm install
npm run setup:check
npm run dev
```

Open http://localhost:5173

## Supabase dashboard (one-time)

Project: `momkbsgfypjfujkhrtxb` → https://supabase.com/dashboard/project/momkbsgfypjfujkhrtxb

1. **Authentication → URL Configuration**
   - Site URL: `http://localhost:5173` (switch to your Vercel URL when demoing on a phone)
   - Redirect URLs (add both):
     - `http://localhost:5173`
     - `https://YOUR-APP.vercel.app`

2. **SQL Editor** — run in order if not already applied:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_realtime.sql`
   - `supabase/migrations/003_gamification_and_blog.sql`
   - `supabase/migrations/004a_report_status_enum.sql` **run first** (enum values must commit separately)
   - `supabase/migrations/004_civic_lifecycle.sql` **run second**
   - `supabase/migrations/005_officials_seed.sql` (MCA/MP placeholders)
   - `scripts/seed-demo-reports.sql` (after you sign in once in the app)

## AI for reports

- **Demo now:** `VITE_DEMO_MODE=true` in `.env` (mock AI, no API key).
- **Production:** deploy the `analyze-trash` edge function and set the `GEMINI_API_KEY` secret on Supabase. The browser bundle does not call Gemini.

## Seed from terminal (optional)

```bash
# After sign-in; requires service role key from Supabase → Settings → API
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
npm run seed:demo
```

## Deploy (Vercel)

**Option A — CLI**

```bash
npx vercel login
npx vercel --prod
```

**Option B — Dashboard**

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) → Import the repo.
3. Framework: Vite (or use existing `vercel.json`).
4. Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_DEMO_MODE` = `true` for a demo without the edge function. Leave it unset in production so photo checks use `analyze-trash`.
5. Deploy, then add your `https://….vercel.app` URL to Supabase redirect URLs (see above).

**SQL via CLI** (after `npx supabase login`):

```bash
npm run db:realtime
npm run db:seed
```
