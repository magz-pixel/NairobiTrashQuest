-- 025_bounties.sql
-- Micro-bounties: neighbours pledge money to a hotspot; once the target is reached the bounty
-- opens, and a member in good standing can claim it, clean the spot, upload proof, and get paid.
--
-- Lifecycle:  funding ──(confirmed pledges ≥ target)──▶ open ──claim──▶ claimed
--             claimed ──proof uploaded──▶ in_review ──admin approves──▶ paid
--             (admin can cancel at any stage; a claim that expires returns the bounty to open)
--
-- Money rules:
--   * Pledges are created as 'pending' by signed-in users only. They become 'confirmed' ONLY
--     via the M-Pesa callback (service role) or an admin who has seen the money arrive.
--   * Anonymous users can't write to any of these tables.
-- Run in the Supabase SQL editor. Safe to run twice.

-- ─────────────────────────────────────────────────────────────── tables
create table if not exists public.hotspot_bounties (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.reports (id) on delete cascade,
  city text not null default 'nairobi',
  currency text not null default 'KES',
  target_amount numeric(12, 2) not null check (target_amount > 0),
  status text not null default 'funding'
    check (status in ('funding', 'open', 'claimed', 'in_review', 'paid', 'cancelled')),
  claimed_by uuid references public.profiles (id) on delete set null,
  claimed_at timestamptz,
  claim_expires_at timestamptz,
  opened_at timestamptz,
  paid_at timestamptz,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hotspot_bounties_city_status_idx on public.hotspot_bounties (city, status);

create table if not exists public.bounty_pledges (
  id uuid primary key default gen_random_uuid(),
  bounty_id uuid not null references public.hotspot_bounties (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  display_name text,                      -- shown publicly; null = "A neighbour"
  amount numeric(12, 2) not null check (amount > 0 and amount <= 1000000),
  currency text not null default 'KES',
  method text not null check (method in ('mpesa', 'usdt', 'usdc', 'manual')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed', 'refunded')),
  payer_phone text,                       -- M-Pesa number (private: never in public views)
  provider_ref text,                      -- M-Pesa CheckoutRequestID / receipt, or chain tx hash
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists bounty_pledges_bounty_idx on public.bounty_pledges (bounty_id, status);
create index if not exists bounty_pledges_ref_idx on public.bounty_pledges (provider_ref);

create table if not exists public.bounty_claims (
  id uuid primary key default gen_random_uuid(),
  bounty_id uuid not null references public.hotspot_bounties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'claimed'
    check (status in ('claimed', 'submitted', 'approved', 'rejected', 'expired')),
  proof_image_url text,
  note text,
  payout_method text check (payout_method in ('mpesa', 'usdt', 'usdc')),
  payout_ref text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);
create index if not exists bounty_claims_bounty_idx on public.bounty_claims (bounty_id, created_at desc);

-- ─────────────────────────────────────────────────────── good standing
-- Tune the thresholds here. The app shows the same checklist (src/lib/bounties.ts → STANDING_RULES).
create or replace function public.bounty_standing(uid uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with p as (select * from public.profiles where id = uid),
       r as (select count(*) filter (where status <> 'rejected') as reports,
                    count(*) filter (where status = 'verified_cleared' and cleared_by = uid) as clears
             from public.reports where user_id = uid or cleared_by = uid),
       c as (select count(*) as open_claims from public.bounty_claims
             where user_id = uid and status in ('claimed', 'submitted'))
  select jsonb_build_object(
    'account_days', coalesce(extract(day from now() - (select created_at from p))::int, 0),
    'points',       coalesce((select total_impact_points from p), 0),
    'reports',      (select reports from r),
    'clears',       (select clears from r),
    'open_claims',  (select open_claims from c),
    'eligible',
      coalesce((select created_at from p) < now() - interval '14 days', false)
      and coalesce((select total_impact_points from p), 0) >= 100
      and (select reports from r) >= 3
      and (select open_claims from c) = 0
  );
$$;
grant execute on function public.bounty_standing(uuid) to authenticated;

create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- ─────────────────────────────────────────── public progress (no private fields)
create or replace view public.bounty_progress as
select
  b.id, b.report_id, b.city, b.currency, b.target_amount, b.status, b.claimed_by, b.claimed_at, b.claim_expires_at,
  b.opened_at, b.paid_at, b.created_at,
  coalesce(sum(p.amount) filter (where p.status = 'confirmed'), 0) as raised,
  coalesce(sum(p.amount) filter (where p.status = 'pending'), 0) as pending,
  count(p.id) filter (where p.status = 'confirmed') as backers
from public.hotspot_bounties b
left join public.bounty_pledges p on p.bounty_id = b.id
group by b.id;
grant select on public.bounty_progress to anon, authenticated;

create or replace view public.bounty_backers as
select bounty_id, coalesce(display_name, 'A neighbour') as name, amount, currency, method, confirmed_at
from public.bounty_pledges
where status = 'confirmed';
grant select on public.bounty_backers to anon, authenticated;

-- ─────────────────────────────────── auto-open when confirmed pledges reach the target
create or replace function public.bounty_sync_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  bid uuid := coalesce(new.bounty_id, old.bounty_id);
  total numeric;
begin
  select coalesce(sum(amount), 0) into total from public.bounty_pledges where bounty_id = bid and status = 'confirmed';
  update public.hotspot_bounties
     set status = 'open', opened_at = now(), updated_at = now()
   where id = bid and status = 'funding' and total >= target_amount;
  return null;
end $$;
drop trigger if exists bounty_pledges_sync on public.bounty_pledges;
create trigger bounty_pledges_sync after insert or update of status, amount on public.bounty_pledges
  for each row execute function public.bounty_sync_status();

-- ─────────────────────────────────────────── claiming (atomic, standing-checked)
-- 48-hour window to clean and upload proof, otherwise the bounty reopens (see expire function).
create or replace function public.claim_bounty(p_bounty uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  claim_id uuid;
begin
  if uid is null then raise exception 'Sign in to claim a bounty'; end if;
  if not (public.bounty_standing(uid) ->> 'eligible')::boolean then
    raise exception 'Your account is not yet in good standing to claim bounties';
  end if;
  update public.hotspot_bounties
     set status = 'claimed', claimed_by = uid, claimed_at = now(),
         claim_expires_at = now() + interval '48 hours', updated_at = now()
   where id = p_bounty and status = 'open';
  if not found then raise exception 'This bounty is not open for claiming'; end if;
  insert into public.bounty_claims (bounty_id, user_id) values (p_bounty, uid) returning id into claim_id;
  return claim_id;
end $$;
grant execute on function public.claim_bounty(uuid) to authenticated;

create or replace function public.submit_bounty_proof(p_claim uuid, p_image text, p_note text, p_payout text)
returns void language plpgsql security definer set search_path = public as $$
declare bid uuid;
begin
  update public.bounty_claims
     set status = 'submitted', proof_image_url = p_image, note = p_note, payout_method = p_payout, submitted_at = now()
   where id = p_claim and user_id = auth.uid() and status = 'claimed'
  returning bounty_id into bid;
  if bid is null then raise exception 'Claim not found or already submitted'; end if;
  update public.hotspot_bounties set status = 'in_review', updated_at = now() where id = bid;
end $$;
grant execute on function public.submit_bounty_proof(uuid, text, text, text) to authenticated;

-- Call from a cron (pg_cron) or the admin page: reopen claims that ran out of time.
create or replace function public.expire_bounty_claims()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.bounty_claims c set status = 'expired'
    from public.hotspot_bounties b
   where c.bounty_id = b.id and c.status = 'claimed' and b.status = 'claimed' and b.claim_expires_at < now();
  update public.hotspot_bounties
     set status = 'open', claimed_by = null, claimed_at = null, claim_expires_at = null, updated_at = now()
   where status = 'claimed' and claim_expires_at < now();
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function public.expire_bounty_claims() to authenticated;

-- ─────────────────────────────────────────────────────────────── RLS
alter table public.hotspot_bounties enable row level security;
alter table public.bounty_pledges enable row level security;
alter table public.bounty_claims enable row level security;

drop policy if exists "Bounties are public" on public.hotspot_bounties;
create policy "Bounties are public" on public.hotspot_bounties for select using (true);
drop policy if exists "Admins manage bounties" on public.hotspot_bounties;
create policy "Admins manage bounties" on public.hotspot_bounties for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Pledges: you see your own; admins see all. Public totals come from the views above.
drop policy if exists "See own pledges" on public.bounty_pledges;
create policy "See own pledges" on public.bounty_pledges for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));
drop policy if exists "Signed-in users pledge" on public.bounty_pledges;
create policy "Signed-in users pledge" on public.bounty_pledges for insert
  with check (auth.uid() = user_id and status = 'pending' and confirmed_at is null);
drop policy if exists "Admins confirm pledges" on public.bounty_pledges;
create policy "Admins confirm pledges" on public.bounty_pledges for update
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Claims: public can see who is working on a spot (accountability); writes go through the functions.
drop policy if exists "Claims are public" on public.bounty_claims;
create policy "Claims are public" on public.bounty_claims for select using (true);
drop policy if exists "Admins review claims" on public.bounty_claims;
create policy "Admins review claims" on public.bounty_claims for update
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Live progress bars
do $$ begin
  alter publication supabase_realtime add table public.bounty_pledges, public.hotspot_bounties;
exception when others then null; end $$;
