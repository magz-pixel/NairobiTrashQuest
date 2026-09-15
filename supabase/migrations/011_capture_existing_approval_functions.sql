-- 011 - Capture existing report-approval / points RPC functions from production
--
-- Reverse-engineered from the live Supabase database on 2026-08-10.
-- These definitions were NOT originally authored as a migration; this file
-- documents what was actually running in production at capture time.
-- Behavior intentionally unchanged — capture only (read-only documentation).
--
-- Source query:
--   SELECT proname, pg_get_functiondef(oid)
--   FROM pg_proc
--   WHERE proname IN (
--     'approve_report', 'reject_report', 'award_points_on_clear',
--     'verify_report_cleared', 'award_event_attendance'
--   );
--
-- Grants were inspected separately (information_schema.role_routine_grants)
-- and are NOT applied here — this migration only records CREATE OR REPLACE
-- function bodies as they existed in production.

-- approve_report (from pg_get_functiondef)
CREATE OR REPLACE FUNCTION public.approve_report(report_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$

-- reject_report (from pg_get_functiondef)
CREATE OR REPLACE FUNCTION public.reject_report(report_uuid uuid, reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$

-- award_points_on_clear (from pg_get_functiondef)
CREATE OR REPLACE FUNCTION public.award_points_on_clear()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$

-- verify_report_cleared (from pg_get_functiondef)
CREATE OR REPLACE FUNCTION public.verify_report_cleared(report_uuid uuid, cleared_image text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$

-- award_event_attendance (from pg_get_functiondef)
CREATE OR REPLACE FUNCTION public.award_event_attendance(p_event_id uuid, p_user_id uuid, p_points integer DEFAULT 50)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$

