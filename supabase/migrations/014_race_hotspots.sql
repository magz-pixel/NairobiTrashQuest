-- 014 - Amazing Trash Race hotspots (admin pins + Field Agent clear)
-- RLS mirrors race_weight_logs (public read, admin write via profiles.is_admin).

create table if not exists public.race_hotspots (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null default 'amazing-trash-race-s2',
  latitude double precision not null,
  longitude double precision not null,
  label text not null,
  point_value integer not null check (point_value > 0),
  is_ghost_spot boolean not null default false,
  reference_image_url text,
  status text not null default 'active' check (status in ('active', 'cleared')),
  cleared_by_team_name text,
  cleared_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists race_hotspots_event_status_idx
  on public.race_hotspots (event_slug, status);

alter table public.race_hotspots enable row level security;

create policy "Race hotspots are publicly readable"
  on public.race_hotspots for select
  using (true);

create policy "Admins can insert race hotspots"
  on public.race_hotspots for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Admins can update race hotspots"
  on public.race_hotspots for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Admins can delete race hotspots"
  on public.race_hotspots for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Live map updates when a hotspot is cleared
do $$
begin
  alter publication supabase_realtime add table public.race_hotspots;
exception
  when duplicate_object then null;
  when others then
    if SQLERRM ilike '%already member%' then
      null;
    else
      raise;
    end if;
end $$;

-- Reference photos for hotspot briefing (admin upload only; public read)
insert into storage.buckets (id, name, public)
values ('race-hotspot-images', 'race-hotspot-images', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view race hotspot images" on storage.objects;
create policy "Anyone can view race hotspot images"
  on storage.objects for select
  using (bucket_id = 'race-hotspot-images');

drop policy if exists "Admins can upload race hotspot images" on storage.objects;
create policy "Admins can upload race hotspot images"
  on storage.objects for insert
  with check (
    bucket_id = 'race-hotspot-images'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "Admins can update race hotspot images" on storage.objects;
create policy "Admins can update race hotspot images"
  on storage.objects for update
  using (
    bucket_id = 'race-hotspot-images'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "Admins can delete race hotspot images" on storage.objects;
create policy "Admins can delete race hotspot images"
  on storage.objects for delete
  using (
    bucket_id = 'race-hotspot-images'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
