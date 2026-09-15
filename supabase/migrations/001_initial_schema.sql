-- 001_initial_schema.sql
-- Nairobi Trash Locator

create extension if not exists "pgcrypto";

create type public.report_status as enum ('active', 'verified_cleared');
create type public.badge_level as enum ('scout', 'ranger', 'guardian');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  total_impact_points integer not null default 0 check (total_impact_points >= 0),
  badge_level public.badge_level not null default 'scout',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  severity_score smallint not null check (severity_score between 1 and 10),
  status public.report_status not null default 'active',
  image_url text not null,
  ai_tags jsonb not null default '[]'::jsonb,
  cleared_image_url text,
  cleared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  location text not null,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  event_date timestamptz not null,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index reports_status_created_idx on public.reports (status, created_at desc);
create index reports_active_geo_idx on public.reports (latitude, longitude)
  where status = 'active';
create index events_date_idx on public.events (event_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

create or replace function public.sync_badge_level()
returns trigger
language plpgsql
as $$
begin
  new.badge_level := case
    when new.total_impact_points >= 500 then 'guardian'::public.badge_level
    when new.total_impact_points >= 150 then 'ranger'::public.badge_level
    else 'scout'::public.badge_level
  end;
  return new;
end;
$$;

create trigger profiles_sync_badge
  before insert or update of total_impact_points on public.profiles
  for each row execute function public.sync_badge_level();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
begin
  base_username := coalesce(
    nullif(split_part(new.email, '@', 1), ''),
    'player'
  );
  insert into public.profiles (id, username)
  values (new.id, base_username || '_' || substr(new.id::text, 1, 6))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.award_points_on_clear()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  points integer;
begin
  if old.status = 'active'
     and new.status = 'verified_cleared'
     and new.cleared_at is not null then
    points := greatest(10, new.severity_score * 5);
    update public.profiles
      set total_impact_points = total_impact_points + points
      where id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger reports_award_points
  after update on public.reports
  for each row execute function public.award_points_on_clear();

alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.events enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Active reports are viewable by everyone"
  on public.reports for select
  using (status = 'active' or auth.uid() = user_id);

create policy "Authenticated users can insert reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reports"
  on public.reports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Events are viewable by everyone"
  on public.events for select using (true);

create policy "Authenticated users can create events"
  on public.events for insert
  with check (auth.uid() = organizer_id);

create policy "Organizers can update own events"
  on public.events for update
  using (auth.uid() = organizer_id);

insert into storage.buckets (id, name, public)
values ('report-images', 'report-images', true)
on conflict (id) do nothing;

create policy "Anyone can view report images"
  on storage.objects for select
  using (bucket_id = 'report-images');

create policy "Authenticated users can upload report images"
  on storage.objects for insert
  with check (
    bucket_id = 'report-images'
    and auth.role() = 'authenticated'
  );

create policy "Users can update own uploads"
  on storage.objects for update
  using (
    bucket_id = 'report-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
