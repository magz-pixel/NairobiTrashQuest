# Nairobi Trash Locator

Gamified PWA for tracking urban pollution hotspots on a live heatmap and verifying community cleanups.

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

2. **Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Run [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) in the SQL Editor
   - Enable Email auth (magic link) under Authentication → Providers
   - Copy project URL and anon key to `.env`:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Gemini edge function**

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase secrets set GEMINI_API_KEY=your-gemini-key
   npx supabase functions deploy analyze-trash
   ```

   For local dev without deploying, set `VITE_GEMINI_API_KEY` in `.env` (dev only).

4. **Run**

   ```bash
   npm run setup:check
   npm run dev
   ```

   See [DEMO.md](DEMO.md) for demo-day checklist (auth URLs, seed data, Vercel).

## Features

- Dark cyber-environmentalist UI with map as hero
- Dynamic heatmap weighted by severity and 72h time decay
- Report trash: camera/upload → Gemini analysis → Supabase insert
- Verify cleared: geolocation match + Gemini before/after → points awarded
- Realtime heatmap updates via Supabase Realtime
- Community events page

## Project structure

See plan in `.cursor/plans/` or the `src/` tree: `components/`, `hooks/`, `lib/`, `pages/`, `types/`.
