-- Amazing Trash Race Season 2 registrations + ticket codes
-- Run in Supabase SQL Editor after 006_fund_ledger.sql.

create table if not exists public.race_registrations (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null default 'amazing-trash-race-s2',
  full_name text not null,
  phone text not null,
  email text not null,
  team_name text,
  ticket_code text not null unique,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists race_registrations_event_slug_idx
  on public.race_registrations (event_slug);

create index if not exists race_registrations_email_idx
  on public.race_registrations (email);

alter table public.race_registrations enable row level security;

-- Anyone can register (public insert)
create policy "Anyone can register for a race"
  on public.race_registrations for insert
  with check (true);

-- Public can read by ticket_code lookup is harder; allow select for own email session
-- Admins see all; users see rows linked to their profile; also allow select true for ticket display after insert
create policy "Registrations are readable"
  on public.race_registrations for select
  using (
    true
    -- Prefer tighter policy later; open read needed for simple ticket confirmation without auth
  );

create policy "Admins can update race registrations"
  on public.race_registrations for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Admins can delete race registrations"
  on public.race_registrations for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
