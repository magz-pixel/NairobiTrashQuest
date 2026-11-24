-- 031_community_cleanups.sql
-- Edwin's hotspot → funding → cleanup → proof loop, and community-run cleanups.
-- Needs 025 (bounties) and 027 (delete cleanups). Run in the Supabase SQL editor. Safe to run twice.
--
--  1. Approving cleanup proof now also marks the hotspot cleaned on the map (with the after-photo).
--  2. Each bounty can record how its money was spent (shown publicly on the spot).
--  3. Anyone signed in can post a cleanup: limits, future dates only, and community flagging
--     (3 flags hide it until an admin looks).
--  4. A cleanup can be linked to the hotspot it will clean ("Organise a cleanup here").

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
    select count(*) into n from public.events where organizer_id = auth.uid() and created_at > now() - interval '1 day';
    if n >= 3 then raise exception 'You can post up to 3 cleanups a day.'; end if;
    select count(*) into n from public.events where organizer_id = auth.uid() and event_date > now();
    if n >= 10 then raise exception 'You already have 10 upcoming cleanups. Run some first!'; end if;
  end if;
  return new;
end $$;
drop trigger if exists events_guard on public.events;
create trigger events_guard before insert or update on public.events for each row execute function public.events_guard();
