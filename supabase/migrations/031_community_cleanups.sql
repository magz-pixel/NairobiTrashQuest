-- 031_community_cleanups.sql
-- Edwin's hotspot → funding → cleanup → proof loop, and community-run cleanups.
-- Needs 025 (bounties) and 027 (delete cleanups). Run in the Supabase SQL editor. Safe to run twice.
--
--  1. Approving cleanup proof now also marks the hotspot cleaned on the map (with the after-photo).
--  2. Each bounty can record how its money was spent (shown publicly on the spot).
--  3. Verified organisers (apply, then approved by the team) and admins can post cleanups. Limits,
--     future dates only, community flagging (3 flags hide it), and organisers must document a
--     finished cleanup within 7 days before posting the next one.
--  4. A cleanup can be linked to the hotspot it will clean ("Organise a cleanup here").
--  5. Organiser applications, cleanup completion reports, and a public organiser track record.

-- ───────────────────────────────────────── 2. spending breakdown on bounties
alter table public.hotspot_bounties add column if not exists spend jsonb;        -- [{ "label": "Bags", "amount": 1200 }, …]
alter table public.hotspot_bounties add column if not exists spend_note text;

-- ───────────────────────────────────────── 1. approve proof = spot cleaned
create or replace function public.approve_bounty_claim(p_claim uuid, p_approve boolean, p_spend jsonb default null, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  b record;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admins only';
  end if;
  select * into c from public.bounty_claims where id = p_claim for update;
  if c is null or c.status <> 'submitted' then raise exception 'This claim is not waiting for review'; end if;
  select * into b from public.hotspot_bounties where id = c.bounty_id for update;

  if not p_approve then
    update public.bounty_claims set status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid() where id = p_claim;
    update public.hotspot_bounties
       set status = 'open', claimed_by = null, claimed_at = null, claim_expires_at = null, updated_at = now()
     where id = b.id;
    return;
  end if;

  update public.bounty_claims set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid() where id = p_claim;
  update public.hotspot_bounties
     set status = 'paid', paid_at = now(), spend = coalesce(p_spend, spend), spend_note = coalesce(p_note, spend_note), updated_at = now()
   where id = b.id;
  -- The hotspot itself: cleaned, with proof, credited to the crew member.
  update public.reports
     set status = 'verified_cleared',
         cleared_at = now(),
         cleared_by = c.user_id,
         cleared_image_url = coalesce(c.proof_image_url, cleared_image_url),
         updated_at = now()
   where id = b.report_id;
end $$;
revoke all on function public.approve_bounty_claim(uuid, boolean, jsonb, text) from public, anon;
grant execute on function public.approve_bounty_claim(uuid, boolean, jsonb, text) to authenticated;

-- Spending can also be added/edited after payout (admins).
create or replace function public.set_bounty_spend(p_bounty uuid, p_spend jsonb, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admins only';
  end if;
  update public.hotspot_bounties set spend = p_spend, spend_note = p_note, updated_at = now() where id = p_bounty;
end $$;
revoke all on function public.set_bounty_spend(uuid, jsonb, text) from public, anon;
grant execute on function public.set_bounty_spend(uuid, jsonb, text) to authenticated;

-- Expose spend on the public progress view (column added at the end so the view can be replaced).
create or replace view public.bounty_progress as
select
  b.id, b.report_id, b.city, b.currency, b.target_amount, b.status, b.claimed_by, b.claimed_at, b.claim_expires_at,
  b.opened_at, b.paid_at, b.created_at,
  coalesce(sum(p.amount) filter (where p.status = 'confirmed'), 0) as raised,
  coalesce(sum(p.amount) filter (where p.status = 'pending'), 0) as pending,
  count(p.id) filter (where p.status = 'confirmed') as backers,
  b.spend,
  b.spend_note
from public.hotspot_bounties b
left join public.bounty_pledges p on p.bounty_id = b.id
group by b.id;
grant select on public.bounty_progress to anon, authenticated;

-- ───────────────────────────────────────── 3 + 4. community cleanups
alter table public.events add column if not exists report_id uuid references public.reports (id) on delete set null;
alter table public.events add column if not exists hidden boolean not null default false;
create index if not exists events_report_idx on public.events (report_id);

create table if not exists public.event_flags (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.event_flags enable row level security;
drop policy if exists "Users flag events" on public.event_flags;
create policy "Users flag events" on public.event_flags for insert with check (auth.uid() = user_id);
drop policy if exists "Admins read event flags" on public.event_flags;
create policy "Admins read event flags" on public.event_flags for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- 3 different people flag it → hidden from the public until an admin reviews it.
create or replace function public.event_flag_hide()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.event_flags where event_id = new.event_id) >= 3 then
    update public.events set hidden = true where id = new.event_id;
  end if;
  return null;
end $$;
drop trigger if exists event_flag_hide on public.event_flags;
create trigger event_flag_hide after insert on public.event_flags for each row execute function public.event_flag_hide();

-- Hidden cleanups: only the organiser and admins still see them.
drop policy if exists "Events are viewable by everyone" on public.events;
create policy "Events are viewable by everyone" on public.events for select
  using (
    not hidden
    or auth.uid() = organizer_id
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Posting rules for non-admins: date in the next 6 months, 3 new cleanups a day, 10 upcoming at once.
-- Organisers can't un-hide their own flagged cleanup.
create or replace function public.events_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  admin boolean := exists (select 1 from public.profiles where id = auth.uid() and is_admin = true);
  n int;
begin
  if admin or auth.uid() is null then return new; end if;
  if tg_op = 'UPDATE' and old.hidden and not new.hidden then
    raise exception 'This cleanup was flagged by the community. An admin will review it.';
  end if;
  if new.event_date < now() - interval '1 hour' or new.event_date > now() + interval '6 months' then
    raise exception 'Pick a date within the next 6 months.';
  end if;
  if char_length(coalesce(new.title, '')) not between 4 and 120 then
    raise exception 'Give the cleanup a short title (4–120 characters).';
  end if;
  if tg_op = 'INSERT' then
    if coalesce((select organizer_status from public.profiles where id = auth.uid()), '') <> 'verified' then
      raise exception 'Only verified organisers can post cleanups. Apply to become an organiser first.';
    end if;
    if exists (
      select 1 from public.events e
       where e.organizer_id = auth.uid()
         and e.event_date < now() - interval '7 days'
         and not e.hidden
         and not exists (select 1 from public.event_reports r where r.event_id = e.id)
    ) then
      raise exception 'Please document your last cleanup (photos and results) before posting a new one.';
    end if;
    select count(*) into n from public.events where organizer_id = auth.uid() and created_at > now() - interval '1 day';
    if n >= 3 then raise exception 'You can post up to 3 cleanups a day.'; end if;
    select count(*) into n from public.events where organizer_id = auth.uid() and event_date > now();
    if n >= 10 then raise exception 'You already have 10 upcoming cleanups. Run some first!'; end if;
  end if;
  return new;
end $$;
drop trigger if exists events_guard on public.events;
create trigger events_guard before insert or update on public.events for each row execute function public.events_guard();

-- ───────────────────────────────────────── 5. organisers
alter table public.profiles add column if not exists organizer_status text
  check (organizer_status in ('pending', 'verified', 'declined'));
alter table public.profiles add column if not exists organizer_verified_at timestamptz;
-- profiles UPDATE is revoked for clients (013), so users can't verify themselves.

create table if not exists public.organizer_applications (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  phone text not null check (char_length(phone) between 7 and 20),   -- private: team only
  city text not null default 'nairobi',
  neighbourhood text not null check (char_length(neighbourhood) between 2 and 80),
  motivation text not null check (char_length(motivation) between 10 and 800),
  experience text check (char_length(experience) <= 800),
  links text check (char_length(links) <= 300),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);
alter table public.organizer_applications enable row level security;
drop policy if exists "Apply as organiser" on public.organizer_applications;
create policy "Apply as organiser" on public.organizer_applications for insert
  with check (auth.uid() = user_id and status = 'pending');
drop policy if exists "Reapply as organiser" on public.organizer_applications;
create policy "Reapply as organiser" on public.organizer_applications for update
  using (auth.uid() = user_id and status = 'declined')
  with check (auth.uid() = user_id and status = 'pending');
drop policy if exists "Read own or all as admin" on public.organizer_applications;
create policy "Read own or all as admin" on public.organizer_applications for select
  using (auth.uid() = user_id or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Applying marks the profile pending (so the app can show "under review").
create or replace function public.organizer_application_pending()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set organizer_status = 'pending'
   where id = new.user_id and coalesce(organizer_status, '') <> 'verified';
  return new;
end $$;
drop trigger if exists organizer_application_pending on public.organizer_applications;
create trigger organizer_application_pending after insert or update of status on public.organizer_applications
  for each row when (new.status = 'pending') execute function public.organizer_application_pending();

create or replace function public.review_organizer_application(p_user uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admins only';
  end if;
  update public.organizer_applications
     set status = case when p_approve then 'approved' else 'declined' end,
         admin_note = p_note, reviewed_at = now(), reviewed_by = auth.uid()
   where user_id = p_user;
  update public.profiles
     set organizer_status = case when p_approve then 'verified' else 'declined' end,
         organizer_verified_at = case when p_approve then now() else organizer_verified_at end
   where id = p_user;
end $$;
revoke all on function public.review_organizer_application(uuid, boolean, text) from public, anon;
grant execute on function public.review_organizer_application(uuid, boolean, text) to authenticated;

-- Expected turnout on a cleanup.
alter table public.events add column if not exists expected_participants int
  check (expected_participants is null or expected_participants between 1 and 5000);

-- Proof that a cleanup happened: the organiser's record.
create table if not exists public.event_reports (
  event_id uuid primary key references public.events (id) on delete cascade,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  before_url text,
  after_url text not null,
  attendees int not null check (attendees between 0 and 5000),
  bags int check (bags between 0 and 100000),
  kg numeric(10, 1) check (kg between 0 and 1000000),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);
alter table public.event_reports enable row level security;
drop policy if exists "Cleanup reports are public" on public.event_reports;
create policy "Cleanup reports are public" on public.event_reports for select using (true);
drop policy if exists "Organisers document their cleanups" on public.event_reports;
create policy "Organisers document their cleanups" on public.event_reports for insert
  with check (
    auth.uid() = organizer_id
    and exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid() and e.event_date < now() + interval '1 day')
  );
drop policy if exists "Organisers edit their cleanup reports" on public.event_reports;
create policy "Organisers edit their cleanup reports" on public.event_reports for update
  using (auth.uid() = organizer_id) with check (auth.uid() = organizer_id);

-- Public track record. "Trusted" = verified + 3 documented cleanups.
create or replace view public.organizer_stats as
select
  p.id as organizer_id,
  p.username,
  p.organizer_status,
  count(e.id) filter (where e.event_date < now() and not e.hidden) as cleanups_held,
  count(r.event_id) as documented,
  coalesce(sum(r.attendees), 0) as people_mobilised,
  coalesce(sum(r.kg), 0) as kg_collected,
  coalesce(sum(r.bags), 0) as bags_collected,
  (p.organizer_status = 'verified' and count(r.event_id) >= 3) as trusted
from public.profiles p
join public.events e on e.organizer_id = p.id
left join public.event_reports r on r.event_id = e.id
group by p.id;
grant select on public.organizer_stats to anon, authenticated;

-- Existing admins (Arnold, Edwin) count as verified organisers.
update public.profiles set organizer_status = 'verified', organizer_verified_at = coalesce(organizer_verified_at, now())
 where is_admin = true and coalesce(organizer_status, '') <> 'verified';
