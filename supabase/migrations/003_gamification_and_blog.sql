-- 003_gamification_and_blog.sql
-- Gamification + cleanup logs + community posts

create table if not exists public.cleanup_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  hours numeric not null check (hours >= 0),
  kg numeric not null check (kg >= 0),
  eco_multiplier integer not null default 0 check (eco_multiplier between 0 and 5),
  impact_points integer not null default 0 check (impact_points >= 0),
  location_text text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  before_image_url text,
  after_image_url text,
  created_at timestamptz not null default now()
);

create index if not exists cleanup_logs_user_created_idx
  on public.cleanup_logs (user_id, created_at desc);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  before_image_url text,
  after_image_url text,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_idx
  on public.posts (created_at desc);

create or replace function public.calculate_impact_points(
  hours numeric,
  kg numeric,
  eco_multiplier integer
)
returns integer
language sql
immutable
as $$
  select greatest(
    0,
    round(hours * 10 + kg * 5 + eco_multiplier * 20)::integer
  );
$$;

create or replace function public.set_cleanup_log_points()
returns trigger
language plpgsql
as $$
begin
  new.impact_points := public.calculate_impact_points(new.hours, new.kg, new.eco_multiplier);
  return new;
end;
$$;

drop trigger if exists cleanup_logs_set_points on public.cleanup_logs;
create trigger cleanup_logs_set_points
  before insert or update of hours, kg, eco_multiplier on public.cleanup_logs
  for each row execute function public.set_cleanup_log_points();

create or replace function public.award_points_on_cleanup_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set total_impact_points = total_impact_points + new.impact_points
    where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists cleanup_logs_award_points on public.cleanup_logs;
create trigger cleanup_logs_award_points
  after insert on public.cleanup_logs
  for each row execute function public.award_points_on_cleanup_log();

alter table public.cleanup_logs enable row level security;
alter table public.posts enable row level security;

-- cleanup logs: users can manage their own logs
drop policy if exists "Users can view own cleanup logs" on public.cleanup_logs;
create policy "Users can view own cleanup logs"
  on public.cleanup_logs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own cleanup logs" on public.cleanup_logs;
create policy "Users can insert own cleanup logs"
  on public.cleanup_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own cleanup logs" on public.cleanup_logs;
create policy "Users can update own cleanup logs"
  on public.cleanup_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- posts: public feed, but write access is authenticated and scoped to owner
drop policy if exists "Posts are viewable by everyone" on public.posts;
create policy "Posts are viewable by everyone"
  on public.posts for select
  using (true);

drop policy if exists "Authenticated users can create posts" on public.posts;
create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own posts" on public.posts;
create policy "Users can update own posts"
  on public.posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own posts" on public.posts;
create policy "Users can delete own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- Storage: cleanup media bucket
insert into storage.buckets (id, name, public)
values ('cleanup-media', 'cleanup-media', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view cleanup media" on storage.objects;
create policy "Anyone can view cleanup media"
  on storage.objects for select
  using (bucket_id = 'cleanup-media');

drop policy if exists "Authenticated users can upload cleanup media" on storage.objects;
create policy "Authenticated users can upload cleanup media"
  on storage.objects for insert
  with check (bucket_id = 'cleanup-media' and auth.role() = 'authenticated');

drop policy if exists "Users can update own cleanup media" on storage.objects;
create policy "Users can update own cleanup media"
  on storage.objects for update
  using (
    bucket_id = 'cleanup-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

