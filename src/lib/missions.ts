import { supabase } from './supabase'

export async function bumpMissionProgress(
  _userId: string,
  missionType: 'report' | 'verify' | 'cleanup_log' | 'corroborate',
) {
  const { error } = await supabase.rpc('complete_mission', {
    p_mission_type: missionType,
  })
  if (error) throw error
}
