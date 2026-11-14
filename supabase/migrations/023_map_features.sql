-- 023_map_features.sql
-- Bins and trees (roadmap #5 and #6) as one shared "map features" layer, plus a log of
-- condition check-ins (bin full / damaged / missing; tree alive / struggling / dead).
-- Run in the Supabase SQL editor. Safe to run twice.

create table if not exists public.map_features (
  id uuid primary key default gen_random_uuid(),
  city text not null default 'nairobi',
  kind text not null check (kind in ('bin', 'tree')),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  -- bin: ok | full | damaged | missing ; tree: alive | struggling | dead
  status text not null,
  -- trees only: planted (newly planted) | existing
  origin text check (origin is null or origin in ('planted', 'existing')),
  species text,
  planted_on date,
  image_url text,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint map_features_status_ok check (
    (kind = 'bin' and status in ('ok', 'full', 'damaged', 'missing'))
    or (kind = 'tree' and status in ('alive', 'struggling', 'dead'))
  )
);

create index if not exists map_features_city_kind_idx on public.map_features (city, kind);

create table if not exists public.feature_updates (
  id uuid primary key default gen_random_uuid(),
  feature_id uuid not null references public.map_features (id) on delete cascade,
  status text not null,
  image_url text,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists feature_updates_feature_idx on public.feature_updates (feature_id, created_at desc);

alter table public.map_features enable row level security;
alter table public.feature_updates enable row level security;

drop policy if exists "Map features are public" on public.map_features;
create policy "Map features are public" on public.map_features for select using (true);

drop policy if exists "Signed-in users add map features" on public.map_features;
create policy "Signed-in users add map features" on public.map_features
  for insert with check (auth.uid() = created_by);

drop policy if exists "Admins edit map features" on public.map_features;
create policy "Admins edit map features" on public.map_features
  for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "Feature updates are public" on public.feature_updates;
create policy "Feature updates are public" on public.feature_updates for select using (true);

drop policy if exists "Signed-in users add feature updates" on public.feature_updates;
create policy "Signed-in users add feature updates" on public.feature_updates
  for insert with check (auth.uid() = created_by);

-- A check-in updates the feature's current status (runs as owner so citizens don't need UPDATE rights).
create or replace function public.apply_feature_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  k text;
begin
  select kind into k from public.map_features where id = new.feature_id;
  if (k = 'bin' and new.status in ('ok', 'full', 'damaged', 'missing'))
     or (k = 'tree' and new.status in ('alive', 'struggling', 'dead')) then
    update public.map_features set status = new.status, updated_at = now() where id = new.feature_id;
  end if;
  return new;
end;
$$;

drop trigger if exists feature_updates_apply on public.feature_updates;
create trigger feature_updates_apply
  after insert on public.feature_updates
  for each row execute function public.apply_feature_update();
