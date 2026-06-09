-- 004 - Civic reporting lifecycle, moderation, wards, missions
-- IMPORTANT: Run 004a_report_status_enum.sql first, then run this file.

-- Allow anonymous reports (nullable user)
alter table public.reports alter column user_id drop not null;

alter table public.reports
  add column if not exists waste_type text,
  add column if not exists seen_count integer not null default 0 check (seen_count >= 0),
  add column if not exists flag_count integer not null default 0 check (flag_count >= 0),
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_reason text,
  add column if not exists ward_id text,
  add column if not exists area_name text,
  add column if not exists moderation_note text,
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists reporter_session text;

create index if not exists reports_status_severity_idx
  on public.reports (status, severity_score desc);

create index if not exists reports_ward_idx on public.reports (ward_id)
  where ward_id is not null;

-- Corroborations ("I've seen this")
create table if not exists public.report_corroborations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  session_id text not null,
  created_at timestamptz not null default now(),
  unique (report_id, session_id)
);

alter table public.report_corroborations enable row level security;

create policy "Anyone can view corroborations"
  on public.report_corroborations for select using (true);

create policy "Anyone can corroborate once per session"
  on public.report_corroborations for insert with check (true);

-- Flags
create table if not exists public.report_flags (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  session_id text,
  user_id uuid references public.profiles (id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.report_flags enable row level security;

create policy "Anyone can view flags"
  on public.report_flags for select using (true);

create policy "Anyone can flag reports"
  on public.report_flags for insert with check (true);

-- Increment seen_count on corroboration
create or replace function public.increment_seen_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reports
    set seen_count = seen_count + 1
    where id = new.report_id;
  return new;
end;
$$;

drop trigger if exists corroboration_increment_seen on public.report_corroborations;
create trigger corroboration_increment_seen
  after insert on public.report_corroborations
  for each row execute function public.increment_seen_count();

-- Increment flag_count and set status flagged
create or replace function public.increment_flag_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reports
    set flag_count = flag_count + 1,
        status = case when status = 'active' then 'flagged'::public.report_status else status end
    where id = new.report_id;
  return new;
end;
$$;

drop trigger if exists flag_increment_count on public.report_flags;
create trigger flag_increment_count
  after insert on public.report_flags
  for each row execute function public.increment_flag_count();

-- Nairobi wards (simplified seed — expand with full GeoJSON later)
create table if not exists public.wards (
  id text primary key,
  name text not null,
  sub_county text not null,
  constituency text,
  geojson jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.officials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  contact_email text,
  contact_phone text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.ward_officials (
  ward_id text not null references public.wards (id) on delete cascade,
  official_id uuid not null references public.officials (id) on delete cascade,
  primary key (ward_id, official_id)
);

alter table public.wards enable row level security;
alter table public.officials enable row level security;
alter table public.ward_officials enable row level security;

create policy "Wards viewable by everyone" on public.wards for select using (true);
create policy "Officials viewable by everyone" on public.officials for select using (true);
create policy "Ward officials viewable by everyone" on public.ward_officials for select using (true);

-- Seed sample Nairobi wards
insert into public.wards (id, name, sub_county, constituency) values
  ('westlands', 'Westlands', 'Westlands', 'Westlands'),
  ('kibra', 'Kibra', 'Kibra', 'Kibra'),
  ('cbd', 'Central Business District', 'Starehe', 'Starehe'),
  ('industrial-area', 'Industrial Area', 'Makadara', 'Makadara'),
  ('gikomba', 'Gikomba', 'Kamukunji', 'Kamukunji')
on conflict (id) do nothing;

insert into public.officials (id, name, role, contact_email) values
  ('00000000-0000-4000-8000-000000000001', 'Waste Management Desk', 'NCC Environment', 'environment@nairobi.go.ke'),
  ('00000000-0000-4000-8000-000000000002', 'Sub-County Admin', 'Sub-County Administrator', null)
on conflict (id) do nothing;

insert into public.ward_officials (ward_id, official_id)
select w.id, '00000000-0000-4000-8000-000000000001'::uuid
from public.wards w
on conflict do nothing;

-- Missions (gamification)
create table if not exists public.missions (
  id text primary key,
  title text not null,
  description text not null,
  reward_points integer not null default 0,
  target_count integer not null default 1,
  mission_type text not null check (mission_type in ('report', 'verify', 'cleanup_log', 'corroborate')),
  active boolean not null default true
);

create table if not exists public.user_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mission_id text not null references public.missions (id) on delete cascade,
  progress integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, mission_id)
);

alter table public.missions enable row level security;
alter table public.user_missions enable row level security;

create policy "Missions viewable by everyone" on public.missions for select using (true);
create policy "Users view own mission progress" on public.user_missions for select using (auth.uid() = user_id);
create policy "Users update own mission progress" on public.user_missions for insert with check (auth.uid() = user_id);
create policy "Users patch own mission progress" on public.user_missions for update using (auth.uid() = user_id);

insert into public.missions (id, title, description, reward_points, target_count, mission_type) values
  ('first-scan', 'First Scan', 'Report your first trash hotspot', 50, 1, 'report'),
  ('zone-defender', 'Zone Defender', 'Verify 1 cleanup within 50m', 100, 1, 'verify'),
  ('heat-hunter', 'Heat Hunter', 'Log 1 cleanup session', 75, 1, 'cleanup_log'),
  ('community-eye', 'Community Eye', 'Corroborate 3 reports', 30, 3, 'corroborate')
on conflict (id) do nothing;

-- Reward redemptions
create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reward_name text not null,
  token_cost integer not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'fulfilled', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.reward_redemptions enable row level security;
create policy "Users view own redemptions" on public.reward_redemptions for select using (auth.uid() = user_id);
create policy "Users request redemptions" on public.reward_redemptions for insert with check (auth.uid() = user_id);

-- Digest subscribers
create table if not exists public.digest_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.digest_subscribers enable row level security;
create policy "Anyone can subscribe to digest" on public.digest_subscribers for insert with check (true);

-- Admin flag on profiles
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Updated RLS for reports: public read active/pending for owners; anonymous insert
drop policy if exists "Active reports are viewable by everyone" on public.reports;
create policy "Public reports viewable"
  on public.reports for select
  using (
    status in ('active', 'verified_cleared', 'pending', 'flagged')
    or auth.uid() = user_id
  );

drop policy if exists "Authenticated users can insert reports" on public.reports;
create policy "Anyone can insert reports"
  on public.reports for insert
  with check (
    (auth.uid() = user_id)
    or (user_id is null and is_anonymous = true)
  );

-- Anonymous storage upload
drop policy if exists "Anonymous can upload report images" on storage.objects;
create policy "Anonymous can upload report images"
  on storage.objects for insert
  with check (
    bucket_id = 'report-images'
    and (storage.foldername(name))[1] = 'anonymous'
  );

-- Approve report function (admin)
create or replace function public.approve_report(report_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Not authorized';
  end if;
  update public.reports
    set status = 'active', approved_at = now()
    where id = report_uuid and status = 'pending';
end;
$$;

create or replace function public.reject_report(report_uuid uuid, reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Not authorized';
  end if;
  update public.reports
    set status = 'rejected', rejected_reason = reason
    where id = report_uuid;
end;
$$;
