-- 013 - Lock profile self-promotion and move mission XP server-side
--
-- authenticated could UPDATE profiles.is_admin and profiles.total_impact_points
-- directly (RLS only checks auth.uid() = id). Column-level REVOKE closes that.
-- Mission progress + reward XP moves into complete_mission() SECURITY DEFINER
-- so clients no longer write total_impact_points themselves.
-- badge_level is unchanged (still driven by profiles_sync_badge trigger).

-- ---------------------------------------------------------------------------
-- Privilege lockdown
--
-- Postgres: table-level UPDATE grants all columns; REVOKE UPDATE (col) alone
-- does nothing while table UPDATE remains. Revoke table UPDATE, then grant
-- only the safe own-profile columns clients may edit.
-- ---------------------------------------------------------------------------
revoke update on table public.profiles from authenticated;
revoke update on table public.profiles from anon;

-- Authenticated users may still edit their own username (RLS still applies).
grant update (username) on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- complete_mission — server-side bumpMissionProgress equivalent
-- Uses auth.uid() only; never trusts a client-supplied user id or point value.
-- ---------------------------------------------------------------------------
create or replace function public.complete_mission(p_mission_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  mission record;
  existing record;
  next_progress integer;
  just_completed boolean;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_mission_type is null
     or p_mission_type not in ('report', 'verify', 'cleanup_log', 'corroborate') then
    raise exception 'Invalid mission type';
  end if;

  for mission in
    select m.id, m.target_count, m.reward_points
    from public.missions m
    where m.mission_type = p_mission_type
      and m.active = true
  loop
    select um.*
    into existing
    from public.user_missions um
    where um.user_id = uid
      and um.mission_id = mission.id
    for update;

    next_progress := coalesce(existing.progress, 0) + 1;
    just_completed :=
      next_progress >= mission.target_count
      and existing.completed_at is null;

    if existing.id is not null then
      update public.user_missions
      set
        progress = next_progress,
        completed_at = case
          when next_progress >= mission.target_count
            then coalesce(existing.completed_at, now())
          else existing.completed_at
        end
      where id = existing.id;
    else
      insert into public.user_missions (user_id, mission_id, progress, completed_at)
      values (
        uid,
        mission.id,
        next_progress,
        case
          when next_progress >= mission.target_count then now()
          else null
        end
      );
    end if;

    if just_completed then
      update public.profiles
      set total_impact_points = total_impact_points + mission.reward_points
      where id = uid;
    end if;
  end loop;
end;
$$;

revoke all on function public.complete_mission(text) from public;
revoke all on function public.complete_mission(text) from anon;
grant execute on function public.complete_mission(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Verification (manual / after apply — not executed by migrate)
--
-- 1) Expect authenticated UPDATE only on username (not is_admin / points):
--    select
--      has_column_privilege('authenticated','public.profiles','is_admin','UPDATE') as upd_is_admin,
--      has_column_privilege('authenticated','public.profiles','total_impact_points','UPDATE') as upd_points,
--      has_column_privilege('authenticated','public.profiles','username','UPDATE') as upd_username;
--
-- 2) Attempt as authenticated JWT (should fail with permission denied):
--    update public.profiles set total_impact_points = 999999 where id = auth.uid();
--    update public.profiles set is_admin = true where id = auth.uid();
--
-- 3) RPC awards points (authenticated, first completion of a mission type):
--    select public.complete_mission('report');
-- ---------------------------------------------------------------------------
