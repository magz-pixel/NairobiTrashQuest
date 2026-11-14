import { Link } from 'react-router-dom'
import { FixNairobiMark } from '../components/site/BrandMark'

const UPDATED = '14 November 2026'

/**
 * Privacy policy — required for the Google Play listing (roadmap #1) and good practice anyway.
 * Plain language; describes what the app actually collects today.
 */
export function PrivacyPage() {
  return (
    <div className="min-h-[100dvh] bg-[#f4f7f2] text-[#12332d]">
      <header className="border-b border-white/10 bg-emerald-950 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <FixNairobiMark className="shrink-0" />
            <span className="font-[family-name:var(--font-display)] text-lg font-bold">Ramani-Taka</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10 leading-7 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-[#063b32] [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-3 [&_ul]:mt-3">
        <p className="fn-eyebrow">Privacy policy</p>
        <h1 className="fn-display mt-2 text-4xl font-extrabold tracking-[-.03em] text-[#063b32]">Your privacy on Ramani-Taka</h1>
        <p className="text-sm text-[#71867f]">Last updated {UPDATED}</p>

        <p>
          Ramani-Taka (including Fix Nairobi, Fix Kampala and Fix Dar es Salaam) is a community trash map. This page explains
          what we collect when you use the website or the app, why, and what you can do about it.
        </p>

        <h2>What is public</h2>
        <p>
          The point of Ramani-Taka is a public record. When you report a trash spot, pin a bin or tree, or verify a cleanup,
          the <strong>photo, location, time, category and status</strong> are shown to everyone on the map and may be
          shared as open data with communities, researchers, NGOs and local government. Don’t include faces, number plates
          or anything private in photos.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Reports and map pins</strong>: photo, GPS location you choose, category, severity and any note you add.
          </li>
          <li>
            <strong>Location</strong>: only when you report, pin, verify a cleanup or tap “show my location”, and only with
            your phone’s permission. We don’t track you in the background.
          </li>
          <li>
            <strong>Account (optional)</strong>: if you sign in with Google or an email link, we store your email address and
            a display name to save your reports, cleanups, race tickets and points. Your email is never shown publicly.
          </li>
          <li>
            <strong>Race registration</strong>: name, phone and email you provide, used to run the event.
          </li>
          <li>
            <strong>An anonymous session ID</strong> on your device, used to limit spam reports.
          </li>
          <li>
            <strong>Error logs</strong> (via Sentry) when something breaks, so we can fix it. These don’t include your photos.
          </li>
          <li>
            <strong>Reports saved offline</strong> stay only on your phone until they are sent.
          </li>
        </ul>

        <h2>What we don’t do</h2>
        <ul>
          <li>We don’t sell your data or show ads.</li>
          <li>We don’t use advertising trackers.</li>
        </ul>

        <h2>Services we use</h2>
        <p>
          Supabase (database, sign-in and photo storage), Vercel (hosting), Google Gemini (checking that a photo shows
          trash), OpenFreeMap / OpenStreetMap (map tiles), Twilio (WhatsApp reports) and Sentry (error logs). They process
          data only to provide these services.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>You can report without an account.</li>
          <li>You can turn off location access in your phone settings at any time.</li>
          <li>
            You can ask us to delete your account and the personal details linked to it, or to remove a photo you posted.
            Public map points may be kept without your name so the record stays useful.
          </li>
        </ul>

        <h2>Children</h2>
        <p>Ramani-Taka isn’t aimed at children under 13. Schools taking part should do so with a teacher’s supervision.</p>

        <h2>Contact and deletion requests</h2>
        <p>
          Message us on WhatsApp at <a className="font-bold text-[#0b8c76]" href="https://wa.me/254758993687">+254 758 993687</a>{' '}
          or on Instagram / TikTok <strong>@FixNairobi</strong> with “Delete my data” and the email you signed in with. We aim to
          respond within 14 days.
        </p>
      </main>
    </div>
  )
}
