# Pilot brief — local cleanup group

Share this with your group before the first event.

## What the app does

1. **Report** trash on the map (photo + GPS)
2. **Corroborate** existing pins ("I've seen this") instead of reporting again
3. **Verify cleanup** after you've cleaned a spot (before/after on the pin)
4. **Log** total hours/kg for the day (optional journal)

Live app: https://nairobi-trash-quest.vercel.app

## Roles

| Who | What to do | Sign in? |
|-----|------------|----------|
| **Scout (1 per zone)** | Report new hotspots | Recommended |
| **Everyone else** | Corroborate pins you walk past | No |
| **Cleaners** | Verify cleanup with after photo at the spot | **Required** |
| **Organizer** | Admin: export data, moderate if needed | **Required** |

## Golden rules

1. **One reporter per zone** — don't everyone report the same pile.
2. **Already on the map?** Tap the pin → **"I've seen this"** — do not submit a second report.
3. **After cleaning** — sign in, open the pin, tap **Verify cleanup**, take the after photo **at the location**.
4. **Stay within ~50 m** of the pin when verifying cleanup.

## Event day flow

1. **Before:** Everyone who will verify cleanup creates an account (magic link email works on mobile).
2. **Recon (15 min):** Scouts report hotspots while logged in.
3. **Cleanup:** Work the map list; others corroborate as they pass pins.
4. **Per spot:** Cleaner verifies on the pin when done → pin turns teal with before/after.
5. **End of day:** Optional Log entry for total hours/kg; organizer exports CSV from admin gear menu.

## Mobile tips

- Bottom bar: **Report** (quick, no login) · **Verify** (after sign-in) · **Log** · **Me** (profile/sign-in)
- Tap any orange pin for directions, photos, and corroborate.
- First real report hides demo data on the map.

## Troubleshooting

- **Photo won't upload:** Allow camera/location permissions; try Wi‑Fi.
- **Verify says "not within 50m":** Stand closer to the original report location.
- **Can't sign in:** Ask organizer to add your Vercel URL in Supabase → Authentication → URL Configuration.
