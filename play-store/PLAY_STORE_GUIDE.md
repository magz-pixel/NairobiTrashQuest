# Ramani-Taka on Google Play: step by step

The app is already an installable web app (PWA). For the Play Store we wrap that same app in a
**Trusted Web Activity (TWA)** using Google's **Bubblewrap** tool. The Play version always shows the live
site, so every website update reaches the app with no store resubmission.

## What you need (your accounts, about 1 hour)
1. **A Google Play Console developer account.** This is a one-time US$25 fee. Sign up at play.google.com/console.
   Use a business email you'll keep, and consider an organisation account under your registered entity.
2. **Node.js** (already installed) and a **Java JDK 17**. Bubblewrap offers to install the JDK and Android SDK for you.
3. **The privacy policy URL:** https://ramani-taka.co.ke/privacy (added in this PR).

## Build the app bundle
```bash
npm i -g @bubblewrap/cli
mkdir ramani-taka-android && cd ramani-taka-android
bubblewrap init --manifest https://ramani-taka.co.ke/manifest.webmanifest
```
Answer the prompts (the defaults come from our manifest):
- Application ID / package: **ke.co.ramanitaka.app** (it must match `public/.well-known/assetlinks.json`)
- App name **Ramani-Taka**, launcher name **Ramani-Taka**
- Start URL **/app?source=play**, theme colour **#063b32**
- Signing key: let Bubblewrap create one and **back up the keystore file and passwords somewhere safe**.
  If you lose them, you can never update the app.

```bash
bubblewrap build
```
This produces `app-release-bundle.aab`, which is what you upload to Play.

## Prove the website belongs to the app (removes the browser bar)
1. In Play Console → your app → **Setup → App integrity → App signing**, copy the **SHA-256 certificate fingerprint**.
2. Paste it into `public/.well-known/assetlinks.json` in place of `REPLACE_WITH_SHA256_…`, commit, and let Vercel deploy.
3. Check that https://ramani-taka.co.ke/.well-known/assetlinks.json shows it.

## Store listing checklist
- **Short description (80 characters):** "Pin trash, join cleanups, see your street change: the community trash map."
- **Full description:** what Ramani-Taka is, the 3 cities, how reports become public data for wards and counties.
- **Icon 512×512:** `public/icons/icon-512.png`
- **Feature graphic 1024×500:** use the Nairobi skyline (`design/nairobi-skyline.jpg`) with the logo and tagline.
- **Phone screenshots (at least 2):** the hub, the map with wards, a ward card, the feed, and the install page.
- **Category:** Social (or Maps & Navigation). **Content rating:** complete the questionnaire (user-generated photos = yes).
- **Data safety form:** match the privacy page. Location (approximate and precise, optional, not shared for ads),
  photos (user-provided, public), email (optional account), crash logs.
- **Testing:** Google requires new personal accounts to run a closed test with **12 testers for 14 days**
  before production. Recruit them from the Fix Nairobi community and the race squads.
