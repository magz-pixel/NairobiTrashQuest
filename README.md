# Nairobi Trash Locator

Gamified PWA for tracking urban pollution hotspots on a live heatmap, civic reporting (Namma Kasa-style), and trash-hunter rewards.

## Stack

- React + Vite + TypeScript + Tailwind CSS + Framer Motion
- react-leaflet + leaflet.heat
- Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- Google Gemini Vision (via `analyze-trash` edge function)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Supabase — run ALL migrations in order**

   In the SQL Editor, run each file:

   - [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
   - [`supabase/migrations/002_realtime.sql`](supabase/migrations/002_realtime.sql)
   - [`supabase/migrations/003_gamification_and_blog.sql`](supabase/migrations/003_gamification_and_blog.sql)
   - [`supabase/migrations/004a_report_status_enum.sql`](supabase/migrations/004a_report_status_enum.sql) **run first**
   - [`supabase/migrations/004_civic_lifecycle.sql`](supabase/migrations/004_civic_lifecycle.sql) **run second**
   - [`supabase/migrations/005_officials_seed.sql`](supabase/migrations/005_officials_seed.sql) (MCA/MP placeholders for accountability flow)

   Or via CLI: `npm run db:migrate` (requires `SUPABASE_SERVICE_ROLE_KEY`).

3. **Environment**

   Copy `.env.example` to `.env` and set:

   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (required)
   - `VITE_DEMO_MODE=true` — mock AI without Gemini
   - `VITE_SHOW_DEMO_DATA=true` — client-side map hotspots
   - `VITE_AUTO_APPROVE_REPORTS=true` — anonymous reports go live immediately (set `false` for moderation queue)

4. **Gemini edge function** (optional for production AI)

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase secrets set GEMINI_API_KEY=your-gemini-key
   npx supabase functions deploy analyze-trash
   npx supabase functions deploy public-stats
   npx supabase functions deploy weekly-digest
   npx supabase functions deploy whatsapp-webhook
   ```

   Optional secrets: `RESEND_API_KEY` (digest emails), `WHATSAPP_WEBHOOK_SECRET`, `AUTO_APPROVE_REPORTS`.

5. **Run**

   ```bash
   npm run setup:check
   npm run dev
   ```

   See [DEMO.md](DEMO.md) for demo-day checklist.

## Features

### Civic map (Namma Kasa-inspired)
- Anonymous 30-second trash reporting (no login)
- Map/list views, severity + status filters, cluster markers
- Report detail sheet: photo, days open, accountability, I've seen this, flag incorrect
- Public analytics: unresolved / resolved / worst areas
- CC-BY CSV data export, WhatsApp report link, Swahili toggle

### Trash hunter gamification
- Google OAuth + magic link login
- Cleanup logs (hours/kg/eco → tokens), missions with DB progress
- Reward redemption requests, profile XP and badges
- Verify cleanup earns XP + updates map

### Admin
- Set `profiles.is_admin = true` for your user in Supabase
- Moderation queue for pending reports (when `VITE_AUTO_APPROVE_REPORTS=false`)

## Project structure

`src/components/map/` — map HUD, clusters, detail sheet  
`src/components/panels/` — hunter panels + analytics + admin  
`supabase/migrations/` — database schema
