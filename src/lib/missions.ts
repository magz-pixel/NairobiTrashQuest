import { supabase } from './supabase'

export async function bumpMissionProgress(
  userId: string,
  missionType: 'report' | 'verify' | 'cleanup_log' | 'corroborate',
) {
  const { data: missions } = await supabase
    .from('missions')
    .select('id, target_count, reward_points')
    .eq('mission_type', missionType)
    .eq('active', true)

  if (!missions?.length) return

  for (const mission of missions) {
    const { data: existing } = await supabase
      .from('user_missions')
      .select('*')
      .eq('user_id', userId)
      .eq('mission_id', mission.id)
      .maybeSingle()

    const nextProgress = (existing?.progress ?? 0) + 1
    const justCompleted = nextProgress >= mission.target_count && !existing?.completed_at

    if (existing) {
      await supabase
        .from('user_missions')
        .update({
          progress: nextProgress,
          completed_at:
            nextProgress >= mission.target_count
              ? existing.completed_at ?? new Date().toISOString()
              : existing.completed_at,
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('user_missions').insert({
        user_id: userId,
        mission_id: mission.id,
        progress: nextProgress,
        completed_at: nextProgress >= mission.target_count ? new Date().toISOString() : null,
      })
    }

    if (justCompleted) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_impact_points')
        .eq('id', userId)
        .single()
      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_impact_points:
              (profile.total_impact_points as number) + (mission.reward_points as number),
          })
          .eq('id', userId)
      }
    }
  }
}
