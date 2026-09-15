import { supabase } from './supabase'

/** Cap longest edge before AI analysis + storage upload (patchy-mobile friendly). */
export const REPORT_IMAGE_MAX_EDGE_PX = 1600
export const REPORT_IMAGE_JPEG_QUALITY = 0.8

/**
 * Canvas downscale + JPEG encode. Same File is used for analyze + upload.
 * Returns the original file if decode/draw fails (better than blocking submit).
 */
export async function compressImageFile(
  file: File,
  options?: { maxEdge?: number; quality?: number },
): Promise<File> {
  const maxEdge = options?.maxEdge ?? REPORT_IMAGE_MAX_EDGE_PX
  const quality = options?.quality ?? REPORT_IMAGE_JPEG_QUALITY

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', quality)
    })
    if (!blob) return file

    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'report'
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch {
    return file
  }
}

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
