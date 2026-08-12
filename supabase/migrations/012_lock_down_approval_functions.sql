-- 012 - Lock down report-approval / points RPCs
--
-- Revoke unauthenticated EXECUTE (PUBLIC + anon) on the five captured functions
-- from 011, grant EXECUTE to authenticated only, and keep/clarify in-body auth.
--
-- Authorization model used: profiles.is_admin (boolean), NOT badge_level.
-- badge_level (scout/ranger/guardian) is XP-derived gamification via
-- sync_badge_level() and is not an admin/marshal privilege.
--
-- === Decision: verify_report_cleared ===
-- This is (a) the citizen cleanup-verification step, NOT admin-gated.
-- Why:
--   * Body only requires auth.uid() IS NOT NULL + a cleared_image; it sets
--     status = 'verified_cleared' with cleared_at / cleared_image_url.
--   * Client ClearTrashModal calls this RPC for any signed-in cleaner.
--   * Original 009_verify_cleared.sql documents "any authenticated cleaner".
--   * Citizen "confirm this spot is dirty" is report_corroborations inserts
--     (seen_count), which is a separate feature — do not conflate the two.
-- Keep: authenticated-only EXECUTE + existing "must be logged in" body check.
-- Do NOT add is_admin here — that would break the citizen clear flow.
--
-- === award_points_on_clear ===
-- Trigger function (RETURNS trigger), not a client RPC. No is_admin body check:
-- it must still fire when verify_report_cleared transitions a row so the
-- reporter earns points. Gate is who can cause that transition (RPC grants +
-- verify_report_cleared auth). EXECUTE is still revoked from PUBLIC/anon.
--
-- Apply via migration tooling only — do not hand-edit production grants.

-- ---------------------------------------------------------------------------
-- approve_report — admin moderation (already checked is_admin)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- reject_report — admin moderation (already checked is_admin)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- award_points_on_clear — trigger only; no admin body gate (see header)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- verify_report_cleared — any authenticated cleaner (citizen clear flow)
-- ---------------------------------------------------------------------------
create or replace function public.verify_report_cleared(
  report_uuid uuid,
  cleared_image text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if cleared_image is null or length(trim(cleared_image)) = 0 then
    raise exception 'cleared_image is required';
  end if;

  update public.reports
  set
    status = 'verified_cleared',
    cleared_at = now(),
    cleared_image_url = cleared_image
  where id = report_uuid
    and status in ('active', 'flagged');

  get diagnostics updated_count = row_count;

  if updated_count = 0 then
    raise exception 'Report not found or not eligible to clear';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- award_event_attendance — admin / cleanup marshal (already checked is_admin)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Grants: drop unauthenticated EXECUTE; baseline = authenticated
-- Explicit REVOKE FROM anon is required — production had anon grants even
-- when PUBLIC was already revoked (see 011 capture notes).
-- ---------------------------------------------------------------------------
revoke all on function public.approve_report(uuid) from public;
revoke all on function public.approve_report(uuid) from anon;
grant execute on function public.approve_report(uuid) to authenticated;

revoke all on function public.reject_report(uuid, text) from public;
revoke all on function public.reject_report(uuid, text) from anon;
grant execute on function public.reject_report(uuid, text) to authenticated;

revoke all on function public.award_points_on_clear() from public;
revoke all on function public.award_points_on_clear() from anon;
grant execute on function public.award_points_on_clear() to authenticated;

revoke all on function public.verify_report_cleared(uuid, text) from public;
revoke all on function public.verify_report_cleared(uuid, text) from anon;
grant execute on function public.verify_report_cleared(uuid, text) to authenticated;

revoke all on function public.award_event_attendance(uuid, uuid, integer) from public;
revoke all on function public.award_event_attendance(uuid, uuid, integer) from anon;
grant execute on function public.award_event_attendance(uuid, uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Test plan (manual / SQL editor — do NOT run as part of migrate apply)
--
-- Prerequisites: one pending report id, one admin profile, one non-admin profile.
-- Replace :pending_report_id, :admin_uid, :user_uid as needed.
--
-- 1) anon must not have EXECUTE (catalog check):
--    select routine_name, grantee, privilege_type
--    from information_schema.role_routine_grants
--    where routine_name in (
--      'approve_report','reject_report','award_points_on_clear',
--      'verify_report_cleared','award_event_attendance'
--    )
--    and grantee in ('anon','PUBLIC')
--    and privilege_type = 'EXECUTE';
--    -- expect: 0 rows
--
-- 2) As anon JWT (or set role anon), calling approve_report should fail
--    with permission denied for function approve_report:
--    set local role anon;
--    select public.approve_report(':pending_report_id'::uuid);
--    -- expect: ERROR permission denied
--
-- 3) Authenticated non-admin: EXECUTE allowed, body rejects:
--    -- (session with JWT for :user_uid where is_admin = false)
--    select public.approve_report(':pending_report_id'::uuid);
--    -- expect: ERROR Not authorized
--
-- 4) Authenticated admin: succeeds:
--    -- (session with JWT for :admin_uid where is_admin = true)
--    select public.approve_report(':pending_report_id'::uuid);
--    -- expect: success; reports.status = 'active', approved_at set
--
-- 5) Citizen clear still works for any authenticated user:
--    select public.verify_report_cleared(
--      ':active_report_id'::uuid,
--      'https://example.com/cleared.jpg'
--    );
--    -- expect: success when caller is authenticated non-admin
-- ---------------------------------------------------------------------------
