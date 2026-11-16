-- 029_abuse_limits.sql
-- Anti-abuse limits before a public launch. Run in the Supabase SQL editor. Safe to run twice.
--
--  1. A generic rate-limit counter that Edge Functions (service role only) can call:
--     AI photo checks and WhatsApp reports use it.
--  2. Anonymous reports: max 6 per device per hour, and a global brake of 60 anonymous reports
--     per 10 minutes (stops scripted floods; normal use is far below this).
--  3. The anonymous device id (reports.reporter_session) moves to a private table so the public
--     can no longer link one person's anonymous reports together.
--  4. Comments: max 10 per user per 10 minutes. Pledges: max 5 pending per user.
--     Extra photos: max 6 per report.
-- Limits are friendly errors the app shows as-is. Tune the numbers below.

-- ───────────────────────────────────────────── 1. generic rate limiter
create table if not exists public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  key text not null,
  at timestamptz not null default now()
);
create index if not exists rate_limit_hits_lookup on public.rate_limit_hits (bucket, key, at desc);
alter table public.rate_limit_hits enable row level security; -- no policies: service role only

-- Returns true and records a hit if under the limit, false if the caller should be refused.
create or replace function public.rate_limit_hit(p_bucket text, p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  select count(*) into n from public.rate_limit_hits
   where bucket = p_bucket and key = p_key and at > now() - make_interval(secs => p_window_seconds);
  if n >= p_max then return false; end if;
  insert into public.rate_limit_hits (bucket, key) values (p_bucket, p_key);
  -- Housekeeping: keep the table small.
  if random() < 0.01 then delete from public.rate_limit_hits where at < now() - interval '2 days'; end if;
  return true;
end $$;
revoke all on function public.rate_limit_hit(text, text, int, int) from public, anon, authenticated;

-- ───────────────────────────────────────────── 2 + 3. anonymous reports
create table if not exists public.report_sessions (
  -- Deferred so the row can be written from the BEFORE INSERT trigger, before the report exists.
  report_id uuid primary key references public.reports (id) on delete cascade deferrable initially deferred,
  session_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists report_sessions_hash_idx on public.report_sessions (session_hash, created_at desc);
alter table public.report_sessions enable row level security; -- private

create or replace function public.reports_abuse_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sess text := nullif(trim(coalesce(new.reporter_session, '')), '');
  h text;
  n int;
begin
  if auth.uid() is null then
    select count(*) into n from public.reports where user_id is null and created_at > now() - interval '10 minutes';
    if n >= 60 then
      raise exception 'Lots of reports are coming in right now. Please try again in a few minutes.';
    end if;
    if sess is not null then
      h := md5('rt-session:' || sess);
      select count(*) into n from public.report_sessions where session_hash = h and created_at > now() - interval '1 hour';
      if n >= 6 then
        raise exception 'You''ve reported a lot of spots this hour. Thank you! Please try again later, or sign in to keep reporting.';
      end if;
    end if;
  else
    select count(*) into n from public.reports where user_id = auth.uid() and created_at > now() - interval '1 hour';
    if n >= 20 then
      raise exception 'That''s a lot of reports in one hour. Please try again a bit later.';
    end if;
  end if;
  if sess is not null then
    insert into public.report_sessions (report_id, session_hash)
    values (new.id, coalesce(h, md5('rt-session:' || sess)))
    on conflict (report_id) do nothing;
  end if;
  new.reporter_session := null; -- never stored on the public row
  return new;
end $$;

drop trigger if exists reports_abuse_guard on public.reports;
create trigger reports_abuse_guard before insert on public.reports
  for each row execute function public.reports_abuse_guard();
drop trigger if exists reports_move_session on public.reports;
drop function if exists public.reports_move_session();

-- Move the session ids that are already public into the private table.
insert into public.report_sessions (report_id, session_hash, created_at)
select id, md5('rt-session:' || reporter_session), created_at
  from public.reports where reporter_session is not null
on conflict (report_id) do nothing;
update public.reports set reporter_session = null where reporter_session is not null;

-- ───────────────────────────────────────────── 4. comments, pledges, photos
create or replace function public.comments_rate_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from public.report_comments where user_id = new.user_id and created_at > now() - interval '10 minutes';
  if n >= 10 then raise exception 'You''re commenting very fast. Please wait a few minutes.'; end if;
  return new;
end $$;
drop trigger if exists comments_rate_guard on public.report_comments;
create trigger comments_rate_guard before insert on public.report_comments
  for each row execute function public.comments_rate_guard();

create or replace function public.pledges_rate_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from public.bounty_pledges where user_id = new.user_id and status = 'pending';
  if n >= 5 then raise exception 'You have 5 pledges waiting for payment. Complete or cancel those first.'; end if;
  return new;
end $$;
drop trigger if exists pledges_rate_guard on public.bounty_pledges;
create trigger pledges_rate_guard before insert on public.bounty_pledges
  for each row execute function public.pledges_rate_guard();

create or replace function public.report_photos_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from public.report_photos where report_id = new.report_id;
  if n >= 6 then raise exception 'This spot already has plenty of photos.'; end if;
  return new;
end $$;
drop trigger if exists report_photos_guard on public.report_photos;
create trigger report_photos_guard before insert on public.report_photos
  for each row execute function public.report_photos_guard();

-- Comment and display names show publicly: keep them short.
alter table public.bounty_pledges drop constraint if exists bounty_pledges_display_name_len;
alter table public.bounty_pledges add constraint bounty_pledges_display_name_len check (display_name is null or char_length(display_name) <= 40);
