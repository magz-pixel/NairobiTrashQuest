-- Amazing Trash Race marshal weight logs (Season 2 leaderboard)
-- Run after 007_race_registrations.sql

create table if not exists public.race_weight_logs (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null default 'amazing-trash-race-s2',
  team_name text not null,
  kg numeric(10, 2) not null check (kg > 0),
  waste_category text not null check (waste_category in ('plastic', 'organic', 'mixed', 'other')),
  logged_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists race_weight_logs_event_team_idx
  on public.race_weight_logs (event_slug, team_name);

alter table public.race_weight_logs enable row level security;

create policy "Race weights are publicly readable"
  on public.race_weight_logs for select
  using (true);

create policy "Admins can insert race weights"
  on public.race_weight_logs for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Admins can delete race weights"
  on public.race_weight_logs for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
