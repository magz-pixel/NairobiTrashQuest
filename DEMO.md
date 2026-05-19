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
   - `supabase/migrations/002_realtime.sql`
   - `scripts/seed-demo-reports.sql` (after you sign in once in the app)

## AI for reports

- **Demo now:** `VITE_DEMO_MODE=true` in `.env` (mock AI, no API key).
- **Real Gemini:** set `VITE_GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey) and set `VITE_DEMO_MODE=false`.

## Seed from terminal (optional)

```bash
# After sign-in; requires service role key from Supabase → Settings → API
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
npm run seed:demo
```

## Deploy (Vercel)

```bash
npx vercel login
npx vercel --prod
```

Set environment variables in Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DEMO_MODE=true` (or `VITE_GEMINI_API_KEY`).

Add the Vercel URL to Supabase redirect URLs (see above).
