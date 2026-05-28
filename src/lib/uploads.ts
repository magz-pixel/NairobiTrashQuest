import { supabase } from './supabase'

export async function uploadCleanupMedia(
  userId: string,
  objectName: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${objectName}.${ext}`

  const { error } = await supabase.storage
    .from('cleanup-media')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw error

  const { data } = supabase.storage.from('cleanup-media').getPublicUrl(path)
  return data.publicUrl
}

