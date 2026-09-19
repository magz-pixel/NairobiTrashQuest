# Fix Nairobi Site UI Research Synthesis

**Prepared by Manus AI**  
**Scope:** Public storytelling, civic map/reporting, community cleanup and Trash Race, funds and transparency, and authenticated operations experiences.  
**Implementation target:** A shared React and Tailwind system with route-aware shells, typed content/data contracts, accessible alternatives to maps and charts, and auditable status and financial records.

## Executive direction

Fix Nairobi should feel like **one civic service with several modes**, not a collection of unrelated marketing pages and dashboards. The public journey is: understand the local problem, see what needs doing, report or join an action, verify what changed, and follow the evidence. The authenticated journey is: act in the field, review work, manage operations, and maintain the public record. Each page should have one primary job and one dominant next action.

The design system should therefore combine a restrained Nairobi civic visual language with explicit information architecture. Documentary images, named people and places, dates, quotes, and evidence create warmth. Solid surfaces, strong typography, semantic controls, and visible provenance create trust. The interface must distinguish **submitted activity, human-reviewed status, community verification, authority confirmation, demo/local data, and live shared data**. It must never imply that a polished card, AI suggestion, or unverified photo is proof of impact.

The recommended build order is to establish the shared foundations first, then ship the public map/report loop, then community participation, then funds/transparency, and finally role-specific operations. Storytelling and operations can share data contracts and primitives while retaining different visual densities. This avoids the current risks of competing navigation, duplicated status models, inaccessible map-only interactions, invented data, and local writes that look like live truth.

## 1. Product architecture and information hierarchy

### 1.1 One service, four user modes

Use a single application shell and route model, but expose only the navigation relevant to the current mode. Public visitors need orientation and a clear civic action. Participants need task navigation. Privileged users need role-aware operational tools. The shell should make the distinction explicit instead of hiding privileged destinations behind tiny utility links.

| Mode | Primary user question | Primary routes | Dominant action | Information emphasis |
|---|---|---|---|---|
| Public orientation | What is Fix Nairobi and why does it matter? | `/`, `/mission`, `/stories` | `See the map` | Local problem, mechanism, people, proof |
| Civic action | What needs doing and how do I follow it? | `/map`, `/report/new`, `/verify`, `/accountability` | `Report a problem` | Location, status, evidence, next step |
| Community participation | Where can I join or record a cleanup? | `/cleanup-events`, `/trash-race`, `/leaderboard`, `/report-cleanup` | `Join a cleanup` | Event logistics, safety, transparent scoring |
| Funds and accountability | What is available, spent, and documented? | `/funds`, `/funds/donate`, `/funds/ledger`, `/funds/transparency` | `Donate` | Definitions, balances, transactions, evidence |
| Operations | What is my assigned job and what is the current record? | `/me`, `/missions`, `/marshal`, `/race/admin`, `/management` | Role-specific submit/review action | Actor, place, time, status, audit trail |

The public header should contain a compact set of orientation links: **Mission, Stories, Map, Funds**, followed by one high-emphasis action, normally **Report**. Cleanup Events, Trash Race, Leaderboard, My impact, and administration should be secondary or contextual navigation. This arrangement preserves the deliberate public journey recommended by the nonprofit storytelling research and prevents equal-weight destinations from competing in the first viewport. Charity: water demonstrates the value of an authored story archive with featured and field content [1]. Water.org’s Kenya page provides a useful sequence of local problem, response, changed conditions, and what comes next [2].

### 1.2 Route and shell rules

Render desktop and mobile navigation from one typed `publicLinks` array. The same source must define label, href, order, active matching, optional external status, and visibility. Do not maintain separate desktop and mobile lists. Use a second typed `operationsLinks` structure with role guards, and show an explicit signed-out explanation if a user reaches a privileged route without authorization.

Recommended route structure:

```ts
type NavLink = {
  id: string;
  label: string;
  href: string;
  match: (pathname: string) => boolean;
  kind: 'primary' | 'secondary' | 'action' | 'external';
  requiredRole?: 'hunter' | 'marshal' | 'admin' | 'management';
};

const publicLinks: NavLink[] = [
  { id: 'mission', label: 'Mission', href: '/mission', kind: 'primary', match: p => p.startsWith('/mission') },
  { id: 'stories', label: 'Stories', href: '/stories', kind: 'primary', match: p => p.startsWith('/stories') },
  { id: 'map', label: 'Map', href: '/map', kind: 'primary', match: p => p.startsWith('/map') },
  { id: 'funds', label: 'Funds', href: '/funds', kind: 'primary', match: p => p.startsWith('/funds') },
  { id: 'report', label: 'Report a problem', href: '/report/new', kind: 'action', match: p => p.startsWith('/report') },
];
```

The global shell should include a persistent skip link, semantic `header`, `nav`, `main`, and `footer` landmarks, a route-aware active state, a compact account control, and a contextual sub-navigation only where it improves task continuity. `/map` should provide Map, Report, Verify cleanup, Accountability, and My impact. `/funds` should provide Funds, Ledger, Transparency, and Donate. Community pages should provide Cleanup Events, Trash Race, Leaderboard, and How it works. Operations should use a separate `OperationsShell` with Participate and Operations groups.

## 2. Shared visual and content system

### 2.1 Design principles

The visual system should communicate **place, proof, and participation**. Emerald and canvas establish structure. Gold identifies action. Teal supplies secondary emphasis. A restrained warm field accent can distinguish urgency or human context. Documentary images and real artifacts should supply variation instead of gradients, random blobs, generic leaves, or decorative icon noise.

The system should not make every page look like a dark dashboard. Missions and Hunter profile can retain scrapbook and narrative qualities. Map, funds, marshal, admin, and management should use conventional controls and dense but legible evidence displays. ServiceNow and Salesforce’s separation of planning, dispatch, execution, and performance views supports role-specific operational surfaces rather than one undifferentiated dashboard [3] [4].

### 2.2 Shared tokens

Encode tokens in Tailwind theme configuration and CSS custom properties so public and operations surfaces share semantics even when their compositions differ. Use semantic tokens in components; do not hard-code page-specific colors.

| Token family | Suggested token | Purpose and usage |
|---|---|---|
| Structure | `--fn-forest` | Primary deep green for header, navigation, headings, and trust surfaces. |
| Context | `--fn-mint` | Light context panels, map/list support areas, and secondary emphasis. |
| Action | `--fn-gold` | Primary buttons, donation/report/Join actions, and selected focus accents. |
| Secondary action | `--fn-teal` | Links, evidence, supporting action, and non-primary highlights. |
| Warm field | `--fn-coral` | Urgency, moderation attention, and selected human field notes; never the sole status carrier. |
| Canvas | `--fn-canvas` | Warm off-white page background. |
| Surface | `--fn-surface` | Cards, sheets, tables, and modal surfaces. |
| Ink | `--fn-ink` | Near-black body text and high-contrast labels. |
| Muted | `--fn-muted` | Supporting text only; must remain readable at normal text contrast. |
| Border | `--fn-border` | Solid, restrained dividers and input boundaries. |
| Status | `--fn-success`, `--fn-info`, `--fn-warning`, `--fn-danger` | Semantic status paired with text, icon/shape, and accessible announcements. |
| Spacing | `--fn-space-1` through `--fn-space-8` | A small spacing scale for consistent vertical rhythm. |
| Radius | `--fn-radius-sm`, `--fn-radius-md` | Small-to-moderate rounding; avoid excessive pill and card treatment. |
| Shadow | `--fn-shadow-1` | Low-elevation separation only; never use glow as evidence. |
| Type | `--fn-display`, `--fn-body`, `--fn-mono` | Display, reading, and tabular-number/code roles. |

Use tabular numerals for amounts, weights, ranks, counts, and dates. Define minimum body sizes and line heights for narrow mobile screens. Keep text measure near 65–75 characters for narrative content and use a fixed-width detail/list column for desktop operational views. Typography and spacing must still work at 200% zoom.

### 2.3 Content and evidence contracts

Use one editorial model for home callouts, mission milestones, and stories:

```ts
type EditorialItem = {
  id: string;
  title: string;
  dek: string;
  date: string;
  location: string;
  people: string[];
  image?: string;
  alt?: string;
  body: string[];
  evidenceHref?: string;
  cta?: { label: string; href: string };
};
```

Human fields are mandatory for published stories and milestones. New content must be addable without changing layout code. The model requires an attributable date, location, people, media alternative, body, and evidence link when a claim depends on an operational record. Use real titles, quotes, partner credits, neighborhoods, and “what happened next” details. Never publish placeholder SVGs, fake handles, invented testimonials, or swap-me labels.

Operational records must use event arrays rather than a mutable status field:

```ts
type StatusEvent = {
  status: 'reported' | 'under_review' | 'acknowledged' | 'in_progress' |
    'community_verification' | 'verified_cleared' | 'rejected' | 'duplicate' | 'stale';
  occurredAt: string;
  actorType: 'resident' | 'crew' | 'moderator' | 'authority' | 'system';
  actorLabel: string;
  source: string;
  note?: string;
  evidenceUrl?: string;
};
```

Render the same event array in report detail, accountability, public history, and admin views. This prevents contradictions. Financial records should likewise use a typed transaction model with IDs, dates, direction, category, project, status, public label, description, evidence link, and privacy mode. Keep donor identity fields out of the public client payload by default.

## 3. Responsive behavior and interaction rules

Use content-first responsiveness rather than shrinking desktop compositions. Below `md`, use one column, stacked filters, full-width actions, readable list/card alternatives, and fixed or bottom-sheet details only when they preserve context. At `lg`, use two-column narrative/proof layouts and map/list compositions. The primary action must remain reachable without passing decorative content.

| Surface | Mobile rule | Desktop rule |
|---|---|---|
| Global navigation | Compact top bar, disclosure menu, persistent skip link, focus trap while open, focus return on close, route-change close. | Inline primary links, one action button, secondary/account controls separated. |
| Public hero | One column; H1, mechanism sentence, primary action, quieter link, then proof. | Narrative/proof split; live stats beneath the promise. |
| Map | Readable list by default, explicit Map/List toggle, bottom sheet for selected report. | `lg:grid-cols-[minmax(0,1fr)_26rem]` with map and detail panel. |
| Event discovery | List first, explicit Map view, filter disclosure or horizontal scroll row. | `lg:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.35fr)]` synchronized list/map. |
| Ledger | Stacked transaction cards or scrollable table with a visible cue. | Semantic table with aligned currency columns and sticky header. |
| Operations tables | Labeled semantic cards; preserve critical amount, actor, phone, and status. | Real table with keyboardable row actions and sticky header. |
| Detail panel | Full-height sheet with safe-area padding, large close button, scrollable content. | Right-side panel/drawer with context retained. |
| Actions | Sticky but non-obstructive bottom action bar where needed, with `pb-[env(safe-area-inset-bottom)]`. | Contextual action group near page header and content. |

Use a minimum 44px practical target for controls and never depend on a map pin, hover, tilt, color, icon shape, or animation as the only carrier of meaning. WCAG 2.2 provides target-size guidance and focus requirements [5].

The mobile menu and all dialogs, drawers, and sheets must trap focus while open, close on Escape, return focus to their trigger, and close on route change. A visible skip link must remain available. Avoid auto-opening surfaces on focus. Use native controls where they provide correct keyboard and screen-reader behavior.

## 4. Component primitives

Build shared primitives before page-specific layouts. Their APIs should encode accessibility and evidence requirements so each page family cannot accidentally regress them.

| Primitive | Required behavior |
|---|---|
| `AppShell` / `OperationsShell` | Landmarks, skip link, route-aware navigation, responsive menu, account/role context, focus management. |
| `SiteNav` | Typed link source, active state, action hierarchy, external/new-tab labeling, mobile focus trap. |
| `PageHeader` | Breadcrumb/back link, role eyebrow, H1, one-sentence purpose, primary action, status/sync region. |
| `ActionBar` | One dominant action, keyboard-visible focus, safe-area support, disabled/loading/error states. |
| `StatusBadge` / `StatusLegend` | Text plus visual treatment, not color alone; explains lifecycle and stale/local/demo states. |
| `MapListToggle` | Equivalent map and semantic list paths; selected state announced. |
| `FilterBar` | Labeled controls, URL search-param state, Reset/Clear all, result count in `aria-live`, focus preservation. |
| `ReportCard` / `EventCard` | One clear target, descriptive link text, 44px hit area, status/date/location/evidence labels, fixed aspect-ratio media. |
| `ReportDetailSheet` | Focus trap/restoration, Escape/back dismissal, persistent summary, event timeline, evidence and next action. |
| `StatusTimeline` | Ordered event list, actor/source/time/note, stale and unknown states, no color-only chronology. |
| `EditorialTimeline` | Semantic `<ol>`, headings, date/location/people/media/why-it-mattered, `aria-labelledby`, chapter anchors. |
| `StoryCard` / `StoryDetail` | Editorial route, title/dek/byline/location/date, real image and alt, quote, problem/people/change, evidence, next story/action. |
| `LedgerTable` / `LedgerCardView` | Caption, `thead`, `th scope`, `td`, tabular numerals, pagination, CSV and plain-text/print path. W3C’s table guidance requires semantic associations, not styling alone [6]. |
| `DataSummary` | Metric, definition, period, source, last updated, coverage caveat, and “how calculated” disclosure. |
| `FormWizard` | Reducer-driven steps, visible step indicator, inline errors plus error summary, recovery states, privacy copy. |
| `Dialog` / `Drawer` | Native semantics, focus trap/restoration, Escape, consequence-first destructive confirmation. |
| `Toast` / `LiveRegion` | Async status announced; never sole error or success channel. |
| `TrustStatus` | Live shared or demo/local label, last refreshed, Refresh action, actor/source, support route. |
| `MediaFrame` | Explicit width/height, fixed aspect ratio, lazy loading, responsive `srcSet`/`sizes`, descriptive alt or empty alt when decorative. |

Cards should be accessible links or buttons with one clear target. Link labels should describe the destination. External or new-tab links must say so. Use `loading="lazy"` outside the first viewport and explicit dimensions to reduce layout shift.

## 5. Page-family layouts

### 5.1 Home, mission, and stories

The home page should state the local problem, mechanism, and next action in plain language. The hero should contain a Nairobi-grounded headline, one sentence describing the report → crew → verified-clear loop, one dominant CTA to `/map`, and one quieter link to `/mission` or `/stories`. Live stats belong beneath the promise and must expose loading, empty, demo, and last-updated states. Do not place a vague slogan over a giant image.

The recommended home sequence is **promise → mechanism → proof → next action**. Proof cards should link to the relevant map report, event, story, or ledger record. Add a nearby “How we verify” disclosure. The mission page should turn its scrapbook metaphor into an ordered semantic timeline with chapter anchors such as Start, Map, Race, Accountability, and Next. Each milestone requires a date, neighborhood or partner, media type, contributor, and short “why this mattered” line. The visual layer may retain paper cards, tape, tilt, and dark green board, but the reading order must be semantic and stable.

Stories should be an editorial route rather than a set of external links. The archive should have a featured item followed by authored field dispatches, profiles, explainers, and data stories, with distinctive titles and summaries. The detail template requires title/dek, location/date/byline, real image and descriptive alt text, a quote in the subject’s own voice, sections for problem/people/change, linked evidence, and next-story/next-action links. Girl Rising demonstrates how named protagonists, artifacts, participant quotes, and measured outcomes can make storytelling part of the program [7].

### 5.2 Map, reporting, verification, and accountability

Treat the map family as the operational core: **see the map, report a problem, verify the change, follow accountability**. The map page needs one H1, a plain-language explanation of pin meaning, severity/status filters, Map/List toggle, and dominant Report a problem action. The list must be an equivalent path for people who cannot use maps or have low bandwidth. FixMyStreet’s reporting flow supports location-first entry and a public recent-report model, while its documentation also warns that user-marked statuses can become unreliable without authority integration [8] [9].

The report wizard should be reducer-driven: **location → evidence → classification → review**. Users can search an area, use current location, place or adjust a pin, add a photo and details, then submit. GPS denial must fall back to manual pinning. Nearby duplicates should show the existing report, distance, status, and explicit `View this report` / `Report anyway` choices. Anonymous reporting should remain low-friction while explaining exactly what becomes public.

Report detail should answer **What happened? Who is responsible? What changed? What can I do next?** Include the status event timeline, ward/department, age, corroboration, flag action, escalation route, related cleanup, ledger links when relevant, and a subscribe-to-updates option with consent. Verification should require after evidence and nearest-report confirmation, while allowing manual map confirmation. Store verification method, reviewer, model result/version, confidence or review note, and outcome. AI can assist classification; it cannot be the unquestioned authority.

Accountability should derive from the same public event log. Include open/verified counts, acknowledgement and clearance times, area/category breakdown, responsible actor, and a paginated table. Every chart needs a text takeaway and accessible table or downloadable data. Show provenance, denominator, coverage, timestamp, included statuses, and the caveat that report volume is not equivalent to real-world incidence. GOV.UK and USWDS guidance reinforce perceivable, operable public services and textual/table equivalents for data visualizations [10] [11].

Design edge states before polish: loading, offline draft, GPS denial, manual pin, upload retry, AI unavailable/manual review, duplicate, pending moderation, stale report, failed verification, and successful submission with a shareable report ID. A successful state must say whether the record is saved locally or shared live.

### 5.3 Cleanup events, Trash Race, and leaderboard

Make community pages one loop: **discover a cleanup → understand the challenge → join or host → report and verify → see neighborhood impact**. The event index should use a typed model containing event ID, title, neighborhood, ward, coordinates, start/end, organizer, public status, capacity, joined count, supplies, safety, image, and verification status. Render the same data as desktop list/map and mobile cards. Clean Up Australia provides a strong precedent for postcode search, public/private eligibility, registration, rescheduling, and safety messaging [12] [13].

Event cards should lead with date, time, exact meeting point, ward or neighborhood, organizer, capacity, what to bring, safety notes, and Join. The detail page adds Add to calendar, Directions, logistics checklist, emergency contact, accessibility, waste handoff, rain/cancellation policy, and a one-line summary before the user commits. On small screens, default to a readable list and expose the map explicitly.

Trash Race should be a visible stepper: **1 Choose a cleanup or team, 2 Check in, 3 Collect and report, 4 Verify, 5 Celebrate/share**. Distinguish team score from individual contribution. Define points for attendance, hosting, verified bags/weight, accurate reporting, and returning to a site. Show the metric, period, source, verification status, and exact action that changed a score. Litterati’s model is useful because it connects collection data to policy and targeted investment rather than treating points as the sole outcome [14].

The leaderboard should provide scope, time period, category, and metric controls. Use a semantic table on wide screens with caption, `thead`, `th scope`, and an `aria-live` summary. On narrow screens, render labeled rank cards with the same information. Show collective totals, the viewer’s own position even when outside the top ten, progress toward the next milestone, and optional nickname/opt-out. Empty states should invite a first cleanup rather than display a blank polished dashboard. Never reward unsafe speed, duplicate submissions, oversized counts, or exclusionary team behavior.

### 5.4 Funds, donations, ledger, and transparency

Use a task-oriented funds architecture: **Funds** explains available resources and supported work, **Donate** enables the action, **Ledger** exposes transaction records, and **Transparency** explains methodology and governance. Keep Donate as the single high-contrast contextual action. The Funds hero answers what Fix Nairobi is trying to change, how much is available, and what visitors can do next. Open Collective’s audience-oriented entry points and append-only ledger model are useful references [15] [16].

Above the ledger rows, show total received, spent, committed/unallocated balance, reporting period, and last updated. Each metric must link to a plain-language definition and calculation disclosure. Ledger rows require date, amount, direction, category/project, channel, status, description, and evidence link. Manual/offline entries should be labeled. Donor emails, phone numbers, payment identifiers, and re-identifying combinations must never be public. PCN Foundation’s treatment of manual and anonymous gifts provides a practical privacy pattern [17].

Use a semantic table with server-side pagination, CSV export, and print/plain-text view. On mobile, provide stacked cards or a clearly cued horizontal table. Filters for period, project, income/expense, status, and channel must synchronize to URL parameters, display removable chips, provide Clear all, and announce result counts. Transparency should explain what is included, excluded, manually posted, reversed, delayed, or covered by another account. Do not call a balance live or a ledger complete unless the data pipeline supports that claim.

Donate should offer preset and custom amounts, one-time/monthly choice, minimal required fields, and a two- or three-step flow with a persistent summary of destination, fees, and expected impact. Preserve the Fix Nairobi shell if a provider handoff is required and return users to a receipt/status page. Donation usability research emphasizes clear purpose, discoverable controls, low-friction forms, and impact-led copy [18] [19].

### 5.5 Hunter profile, missions, marshal, admin, and management

Operations require a distinct shell but shared tokens and primitives. The Hunter profile should lead with identity, badge, points, reports, clears, attendance, and ticket, followed by “Do next” actions and a chronological activity feed. Missions retain the scrapbook/story layer but add a semantic timeline, milestone rail, meaningful alt text, and evidence.

Marshal is a one-thumb checkpoint flow: choose squad, enter kg with numeric keypad, select category, optionally select hotspot, submit, then see a receipt. Preserve the last-used squad/category locally but never silently reuse weight. Use an idempotency key/client event ID. Distinguish saved locally from saved to the live leaderboard. If a hotspot is already cleared, preserve the entered weight and offer a weight-only path.

Admin should separate configuration from review. Race admin uses Hotspots and Registrations views with search, filters, sort, pagination or virtualization, export, and a detail drawer. Hotspot editing needs latitude/longitude validation, image preview, upload progress, duplicate-coordinate warning, point-value explanation, and explicit ghost/decoy labeling. Destructive actions require confirmation, consequence text, audit context, and cancel as the easy default.

Management should show donations, expenses, balance, upcoming cleanup, and unawarded attendance, followed by recent activity and separate mutation panels. Every mutation exposes actor, timestamp, immutable ID, current mode, sync time, and void reason. Below `md`, render the same records as labeled cards. Service management references support grouping operations by task, resource, location, and role rather than one long form [3] [4].

Every privileged page needs a `TrustStatus` region stating **Live shared data** or **Demo/local data**, last refreshed time, Refresh action, and support/migration route. Amber demo styling is appropriate, but the label must also be text and announced to assistive technology. Never use optimistic success language when a server write failed or remains local.

## 6. Accessibility, motion, performance, and localization

Accessibility is a product requirement, not a final audit. Meet WCAG 2.2 AA expectations for text alternatives, keyboard operation, visible focus, contrast, target size, reflow, status messages, and robust semantics [5]. Use `focus-visible:ring-2` with a high-contrast offset. Ensure controls remain operable at 200% zoom and 320px width. Every image needs meaningful alt text or an explicit decorative alternative. Every data table needs a caption and header associations. Every chart needs a summary, labels, and a non-visual data path.

Use `MotionConfig reducedMotion="user"` around the app and a `useReducedMotion()` hook for local transitions. Framer Motion should explain cause and effect: short opacity/translate reveals, selected card/pin continuity, edge slides for sheets, list insertions, and brief success receipts. Avoid perpetual motion, parallax, large scale/pan effects, auto-rotating carousels, rank shuffles, and stagger delays that make reading wait. Add CSS `@media (prefers-reduced-motion: reduce)` coverage. MDN documents the media query as the mechanism for removing, reducing, or replacing nonessential animation [20].

Performance should prioritize slow mobile connections. Use responsive images with `srcSet` and `sizes`, lazy-load below-fold media, reserve aspect-ratio space, defer nonessential map/chart code, provide a list-first experience, and preserve the complete static content path without autoplay video or external social embeds. Do not require GPS or camera permissions to complete a report.

Core action, error, empty, and status copy should be localized in English and Swahili. Preserve Nairobi neighborhood names and locally used phrasing. Test narrow-width wrapping, mixed-language labels, validation errors, and status announcements. Confirm neighborhood, safety, waste handoff, and Sheng phrasing with Nairobi residents, organizers, and cleanup crews before publishing.

## 7. Trust, moderation, and data governance

Trust should appear at the point of decision. Link proof cards to the relevant map, event, report history, or ledger entry. Identify Fix Nairobi and partner roles. Distinguish community report, machine-assisted classification, human review, community verification, and authority confirmation. Add a nearby “How we verify” disclosure rather than burying methodology in a footer.

Define an auditable lifecycle for reports and cleanup outcomes. Include stale, rejected, duplicate, flagged, and pending states with plain-language reasons. Do not silently hide reports. Keep a correction/flag action near report, event, ledger, and leaderboard records. Explain coverage, update cadence, included statuses, denominator, and data source beside every public metric. Do not invent current balances, event dates, partners, prizes, organizer names, testimonials, or neighborhood comparisons when official data is unavailable.

The public API should return only the fields appropriate to the current audience. Donor identity is private by default. Model metadata and raw coordinates belong behind a provenance disclosure or privileged view unless there is a documented reason to publish them. A separate accountability data model should not exist: derive it from the same event log as report history and admin views.

## 8. Prioritized implementation roadmap

### Phase 0 — Evidence and product contracts

Before visual refinement, inventory current routes, components, local fallback behavior, and data sources. Remove placeholder assets and mark unknown content as pending. Confirm official Fix Nairobi event, partner, fund, and Trash Race facts with project owners. Define route ownership, roles, status taxonomy, event schemas, editorial schema, transaction schema, privacy modes, and demo/live labels. Establish English/Swahili terminology and content review responsibility.

**Exit criteria:** no invented production claims; typed contracts approved; each public metric has a source, timestamp, denominator, and coverage note; each role has an explicit route and permission model.

### Phase 1 — Foundations and shared shell

Implement Tailwind tokens, typography, spacing, status semantics, `AppShell`, `OperationsShell`, `SiteNav`, skip link, `PageHeader`, `ActionBar`, `TrustStatus`, `MediaFrame`, buttons, links, forms, dialogs, drawers, `LiveRegion`, and focus-management utilities. Build navigation from typed arrays and add route-aware active states. Add reduced-motion configuration, responsive image handling, and baseline Storybook or route fixtures.

**Exit criteria:** keyboard-only navigation works across shell states; mobile menu traps and restores focus; 320px and 200% zoom are usable; live/demo status is visually and textually distinct; automated accessibility checks pass on representative routes.

### Phase 2 — Public home, mission, and story foundation

Rewrite the home hero around the local problem, report → crew → verified-clear loop, `/map` action, quieter story/mission path, and honest proof states. Refactor mission into `EditorialTimeline`. Build story archive and detail template from the editorial model. Add real media requirements, byline/location/date, quotes, evidence links, and next actions.

**Exit criteria:** every published milestone has human fields; all cards are accessible links; no placeholder copy/assets remain; story details are indexable, keyboard-readable, and linked to evidence.

### Phase 3 — Map/report/verification loop

Ship the map/list equivalent, filter state in URL parameters, report wizard, anonymous/manual location path, duplicate choice, upload retry, report detail sheet, typed status event timeline, verification flow, and accountability record. Implement loading, offline draft, stale, failed verification, and success/share states before polish. Use Playwright routes for `/map?report=`, `/report/new`, `/verify`, and `/accountability`.

**Exit criteria:** a screen-reader user can complete and follow a report without opening the map; every status has actor/source/time; GPS denial and offline behavior are recoverable; public views and admin views render the same event history.

### Phase 4 — Cleanup events, Trash Race, and leaderboard

Implement event data model, searchable list/map experience, event detail logistics, join flow, host path, visible race stepper, transparent scoring schema, verification note, semantic leaderboard, personal-position panel, nickname/opt-out, and socially useful empty states. Validate all event names, dates, rules, and branding against project-owner evidence before publishing.

**Exit criteria:** users can discover an event without location permission or map use; joining and hosting are distinct; scores explain metric/period/source/action; unsafe or duplicate behavior is not rewarded; collective and personal outcomes are both visible.

### Phase 5 — Funds, donation, ledger, and transparency

Implement funds summary, definitions, freshness, ledger table/card view, URL filters, CSV export, print/plain-text path, transparency methodology, privacy labels, donation flow, provider handoff/return state, and correction route. Connect every published balance and transaction to actual organization data. Add server-side pagination and avoid exposing donor identity.

**Exit criteria:** no financial number appears without period, source, definition, and update state; keyboard and screen-reader table navigation works; mobile ledger remains readable; donation completion and provider handoff are unambiguous.

### Phase 6 — Role-based operations

Implement Hunter profile, semantic Missions, Marshal checkpoint mode, Race admin tabs, hotspot editor, registrations review, management overview, ledger mutations, audit trail, sync status, idempotency, retry, and local/live distinction. Preserve emotional storytelling on profile and missions while keeping privileged controls utilitarian.

**Exit criteria:** repeated marshal entry is fast on one thumb; local writes never look live; destructive actions are recoverable and audited; every privileged page has role context, actor/time/place, and a clear primary job.

### Phase 7 — Field validation and continuous hardening

Run moderated field sessions with Nairobi residents, cleanup crews, organizers, marshals, and administrators. Test keyboard-only navigation, NVDA/VoiceOver, 200% zoom, reduced motion, high contrast, 320px width, slow 3G, GPS/camera denial, offline submit, duplicate handling, stale reports, ledger filters, and long values. Instrument completion and trust separately: report completion, GPS fallback, duplicate acceptance, verification review rate, update opens, acknowledgement time, event join completion, CSV downloads, and evidence-link opens.

**Exit criteria:** field participants can explain what a status means, where evidence comes from, whether data is live, and what to do next. Usability findings are converted into route-level acceptance tests. Analytics do not expose donor identity or optimize solely for competitive behavior.

## 9. Definition of done for every route

A route is ready only when its primary job and dominant action are clear above the fold; its content has real attribution, date, place, and source where applicable; its loading, empty, error, offline, stale, demo, and success states are written; its mobile and non-map/non-chart alternatives preserve meaning; keyboard focus and focus restoration are predictable; motion respects reduced-motion settings; controls meet target-size and contrast requirements; status and live updates are announced; and the route has a test fixture for long labels, 320px width, 200% zoom, and missing optional data.

The shared system is successful when users can move from a local story to a concrete action, from an action to verifiable evidence, and from evidence to accountable next steps without guessing which page, control, or data source to trust.

## References

[1]: https://www.charitywater.org/stories "charity: water Stories"
[2]: https://water.org/our-impact/where-we-work/kenya/ "Water.org Where We Work: Kenya"
[3]: https://www.servicenow.com/products/field-service-management.html "ServiceNow Field Service Management"
[4]: https://www.salesforce.com/service/field-service-management/ "Salesforce Field Service Management"
[5]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines (WCAG) 2.2"
[6]: https://www.w3.org/WAI/tutorials/tables/ "W3C Tables Tutorial"
[7]: https://www.girlrising.org/india "Girl Rising India"
[8]: https://www.fixmystreet.com/ "FixMyStreet"
[9]: https://www.fixmystreet.com/about/understanding-report-data "FixMyStreet: Understanding Report Data"
[10]: https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps "GOV.UK Accessibility Requirements for Public Sector Websites and Apps"
[11]: https://designsystem.digital.gov/components/data-visualizations/ "U.S. Web Design System Data Visualizations"
[12]: https://register.cleanup.org.au/join-a-clean-up "Clean Up Australia: Join a Clean Up"
[13]: https://www.cleanup.org.au/ "Clean Up Australia"
[14]: https://www.litterati.org/ "Litterati"
[15]: https://opencollective.com/ "Open Collective"
[16]: https://documentation.opencollective.com/advanced/ledger "Open Collective Ledger Documentation"
[17]: https://pcnfoundation.com/ledger "PCN Foundation Public Ledger"
[18]: https://www.nngroup.com/articles/donation-usability/ "Nielsen Norman Group: Donation Usability"
[19]: https://118group.com/research/great-nonprofit-donation-pages/ "118 Group: Great Nonprofit Donation Pages"
[20]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion "MDN: prefers-reduced-motion"
