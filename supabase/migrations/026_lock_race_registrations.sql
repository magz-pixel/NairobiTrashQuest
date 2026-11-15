-- 026_lock_race_registrations.sql
-- PRIVACY FIX. Migration 007 let anyone read race_registrations, exposing racers' names,
-- phone numbers and emails. After this:
--   * the full row is readable only by the racer themself (their own ticket) and admins;
--   * the public sees race_registrations_public: squad, first name + last initial, city, date;
--   * only a signed-in user can register, and only as themself.
-- The app was updated in the same PR to read the public view. Run in the Supabase SQL editor.
-- Safe to run twice.

drop policy if exists "Registrations are readable" on public.race_registrations;

drop policy if exists "Racers read own registration" on public.race_registrations;
create policy "Racers read own registration" on public.race_registrations
  for select using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Admins read race registrations" on public.race_registrations;
create policy "Admins read race registrations" on public.race_registrations
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- No anonymous writes to race tables (CLAUDE.md rule). The register page already requires sign-in.
drop policy if exists "Anyone can register for a race" on public.race_registrations;
drop policy if exists "Signed-in users register themselves" on public.race_registrations;
create policy "Signed-in users register themselves" on public.race_registrations
  for insert with check (auth.uid() is not null and auth.uid() = user_id);

-- Public, non-personal view for leaderboards, squad counts and "who has joined".
-- Runs with the view owner's rights (bypasses the row policies above) but only exposes these columns.
create or replace view public.race_registrations_public as
select
  id,
  event_slug,
  city,
  nullif(trim(team_name), '') as team_name,
  split_part(trim(full_name), ' ', 1)
    || case when trim(full_name) ~ '\s'
            then ' ' || upper(left(substring(trim(full_name) from '(\S+)$'), 1)) || '.'
            else '' end
    as display_name,
  created_at
from public.race_registrations;

revoke all on public.race_registrations_public from anon, authenticated;
grant select on public.race_registrations_public to anon, authenticated;
