-- Queue a cleanup for the existing admin moderation panel when AI verification
-- is unavailable.
--
-- Why this migration is required:
--   * verify_report_cleared (009/015) always sets status = verified_cleared.
--     That awards points immediately and is the success path, not a review queue.
--   * Reports RLS only lets the owner UPDATE a row. A cleaner is often not the
--     reporter, so the client cannot attach an after-photo for admin review.
--
-- Visibility (important):
--   * status = 'pending' is excluded from the public map (useReports.mapReports).
--   * A hotspot under cleanup review must stay visible. Keep status as
--     'active' or 'flagged' and mark the row with:
--       moderation_note = 'Pending cleanup verification'
--       cleared_image_url = after photo
--       cleared_by / cleared_at = who submitted and when
--   * New trash reports still use status = 'pending' with no after-photo.
--
-- Safe to run twice: CREATE OR REPLACE + idempotent grants.

create or replace function public.submit_cleanup_for_review(
  report_uuid uuid,
  cleared_image text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cleaned_url text;
  updated_count int;
  submissions_today int;
  day_start timestamptz := date_trunc('day', timezone('utc', now()));
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  cleaned_url := nullif(btrim(cleared_image), '');
  if cleaned_url is null then
    raise exception 'cleared_image is required';
  end if;

  -- After photos must come from our public report-images bucket URL.
  if cleaned_url !~* '^https?://'
     or position('/storage/v1/object/public/report-images/' in cleaned_url) = 0 then
    raise exception 'cleared_image must be a report-images storage URL';
  end if;

  if length(cleaned_url) > 2048 then
    raise exception 'cleared_image URL is too long';
  end if;

  -- 10 cleanup-review submissions per user per UTC day (pending + admin-approved).
  select count(*)::int into submissions_today
  from public.reports r
  where r.cleared_by = uid
    and (
      (
        r.moderation_note = 'Pending cleanup verification'
        and r.cleared_at >= day_start
      )
      or (
        r.status = 'verified_cleared'
        and r.approved_at is not null
        and r.approved_at >= day_start
        and r.cleared_image_url is not null
      )
    );

  if submissions_today >= 10 then
    raise exception 'Cleanup submission limit reached for today';
  end if;

  update public.reports
  set
    -- Keep active/flagged so the pin stays on the public map.
    cleared_image_url = cleaned_url,
    cleared_by = uid,
    cleared_at = timezone('utc', now()),
    moderation_note = 'Pending cleanup verification'
  where id = report_uuid
    and status in ('active', 'flagged')
    and (
      moderation_note is distinct from 'Pending cleanup verification'
      or cleared_image_url is null
    );

  get diagnostics updated_count = row_count;

  if updated_count = 0 then
    raise exception 'Report not found or not eligible for review';
  end if;
end;
$$;

revoke all on function public.submit_cleanup_for_review(uuid, text) from public;
revoke all on function public.submit_cleanup_for_review(uuid, text) from anon;
grant execute on function public.submit_cleanup_for_review(uuid, text) to authenticated;

-- Admin-only (same is_admin gate as migration 012). Cleanup reviews stay
-- active/flagged until approved → verified_cleared. New trash reports still
-- use status = pending → active.
create or replace function public.approve_report(report_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count int;
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Not authorized';
  end if;

  update public.reports
  set
    status = 'verified_cleared',
    approved_at = now(),
    cleared_at = now(),
    moderation_note = null
  where id = report_uuid
    and status in ('active', 'flagged')
    and cleared_image_url is not null
    and moderation_note = 'Pending cleanup verification';

  get diagnostics updated_count = row_count;
  if updated_count > 0 then
    return;
  end if;

  update public.reports
    set status = 'active', approved_at = now()
    where id = report_uuid and status = 'pending';
end;
$$;

-- Admin-only (same is_admin gate as migration 012). Rejecting a cleanup photo
-- restores the hotspot fields; other rows are still rejected.
create or replace function public.reject_report(report_uuid uuid, reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count int;
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Not authorized';
  end if;

  update public.reports
  set
    cleared_image_url = null,
    cleared_by = null,
    cleared_at = null,
    moderation_note = null
  where id = report_uuid
    and status in ('active', 'flagged')
    and cleared_image_url is not null
    and moderation_note = 'Pending cleanup verification';

  get diagnostics updated_count = row_count;
  if updated_count > 0 then
    return;
  end if;

  update public.reports
    set status = 'rejected', rejected_reason = reason
    where id = report_uuid;
end;
$$;

-- Instant AI clears remain active → verified_cleared (award_points_on_clear
-- from 012 already covers that). Admin approval of a queued cleanup is also
-- active/flagged → verified_cleared, so the existing trigger awards points
-- without changes. Do not replace award_points_on_clear here.

notify pgrst, 'reload schema';
