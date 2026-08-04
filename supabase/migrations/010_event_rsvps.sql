-- Weekly cleanups: RSVP + admin award attendance points
-- Run after base events table (001) and profiles.is_admin (004)

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'going'
    check (status in ('going', 'attended', 'cancelled')),
  points_awarded integer not null default 0 check (points_awarded >= 0),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists event_rsvps_event_idx on public.event_rsvps (event_id);
create index if not exists event_rsvps_user_idx on public.event_rsvps (user_id);

alter table public.event_rsvps enable row level security;

drop policy if exists "Users can view own rsvps" on public.event_rsvps;
create policy "Users can view own rsvps"
  on public.event_rsvps for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "Users can insert own rsvps" on public.event_rsvps;
create policy "Users can insert own rsvps"
  on public.event_rsvps for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own going status" on public.event_rsvps;
create policy "Users can update own going status"
  on public.event_rsvps for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage all rsvps" on public.event_rsvps;
create policy "Admins manage all rsvps"
  on public.event_rsvps for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "Authenticated users can create events" on public.events;
create policy "Authenticated users can create events"
  on public.events for insert
  with check (
    auth.uid() = organizer_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "Admins update events" on public.events;
create policy "Admins update events"
  on public.events for update
  using (
    auth.uid() = organizer_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Admin awards attendance XP once (security definer)
create or replace function public.award_event_attendance(
  p_event_id uuid,
  p_user_id uuid,
  p_points integer default 50
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  prev_points integer := 0;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin = true
  ) then
    raise exception 'Not authorized';
  end if;

  if p_points is null or p_points < 1 or p_points > 500 then
    raise exception 'Invalid points';
  end if;

  select coalesce(points_awarded, 0) into prev_points
  from public.event_rsvps
  where event_id = p_event_id and user_id = p_user_id;

  insert into public.event_rsvps (event_id, user_id, status, points_awarded)
  values (p_event_id, p_user_id, 'attended', p_points)
  on conflict (event_id, user_id) do update
    set status = 'attended',
        points_awarded = case
          when public.event_rsvps.points_awarded > 0 then public.event_rsvps.points_awarded
          else p_points
        end;

  if coalesce(prev_points, 0) = 0 then
    update public.profiles
    set total_impact_points = total_impact_points + p_points
    where id = p_user_id;
  end if;
end;
$$;

revoke all on function public.award_event_attendance(uuid, uuid, integer) from public;
grant execute on function public.award_event_attendance(uuid, uuid, integer) to authenticated;
