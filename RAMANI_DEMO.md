# Ramani Taka — screen-record script

Local-only Tanzania market demo. Does **not** change Nairobi production.

## Setup (once)

```bash
cp .env.ramani.example .env.ramani
```

Optional: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.ramani` if you want sign-in / uploads. Demo pins and crowdfunding work without them.

## Run

```bash
npm run dev:ramani
```

Open the URL Vite prints (usually `http://localhost:5173/`).

Nairobi mode is unchanged:

```bash
npm run dev
```

## Recording flow (~2 min)

1. **Map** — Dar es Salaam center, title **Ramani Taka**, orange active pins + teal cleared pins.
2. **Partial funding** — tap **Mwenge Bus Stand** or **Tabata Roadside** → progress bar → **Contribute now**.
3. **Mock payment** — pick M-Pesa or Tigo Pesa, enter a phone (`07XXXXXXXX`), choose **TSh 2,000**, confirm → success → bar updates.
4. **Fully funded** — tap **Kariakoo Market** or **Ubungo Roundabout** → badge *Goal reached — cleanup pending* (no contribute button).
5. **Cleared** — tap a teal pin (e.g. **Ilala — Bibi Titi Rd**) → before/after photos, no crowdfund panel.
6. **Language** — optional: tap **SW** in the header for Swahili crowdfund copy.

## Offline preview build

```bash
npm run build:ramani
npm run preview
```
