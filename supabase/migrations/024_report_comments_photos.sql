-- 024_report_comments_photos.sql
-- Roadmap #7: comments on hotspot reports and extra photos (up to 3 at reporting, more later
-- from neighbours). Run in the Supabase SQL editor. Safe to run twice.

create table if not exists public.report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  author_name text,
  body text not null check (char_length(body) between 1 and 600),
  created_at timestamptz not null default now()
);
create index if not exists report_comments_report_idx on public.report_comments (report_id, created_at);

create table if not exists public.report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  url text not null,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists report_photos_report_idx on public.report_photos (report_id, created_at);

alter table public.report_comments enable row level security;
alter table public.report_photos enable row level security;

drop policy if exists "Comments are public" on public.report_comments;
create policy "Comments are public" on public.report_comments for select using (true);

-- Comments need an account (keeps the conversation accountable and spam-free).
drop policy if exists "Signed-in users comment" on public.report_comments;
create policy "Signed-in users comment" on public.report_comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "Admins remove comments" on public.report_comments;
create policy "Admins remove comments" on public.report_comments
  for delete using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "Report photos are public" on public.report_photos;
create policy "Report photos are public" on public.report_photos for select using (true);

-- Signed-in users can add photos to any report; anonymous reporters can attach extra photos
-- only to a report created in the last 15 minutes (i.e. the one they just submitted).
drop policy if exists "Add report photos" on public.report_photos;
create policy "Add report photos" on public.report_photos
  for insert with check (
    (auth.uid() is not null and auth.uid() = user_id)
    or (
      user_id is null
      and exists (
        select 1 from public.reports r
        where r.id = report_id and r.created_at > now() - interval '15 minutes'
      )
    )
  );

drop policy if exists "Admins remove report photos" on public.report_photos;
create policy "Admins remove report photos" on public.report_photos
  for delete using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
