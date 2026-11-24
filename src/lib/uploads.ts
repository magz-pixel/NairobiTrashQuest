import { supabase } from './supabase'

/** Cap longest edge before AI analysis + storage upload (patchy-mobile friendly). */
export const REPORT_IMAGE_MAX_EDGE_PX = 1280
export const REPORT_IMAGE_JPEG_QUALITY = 0.72

/** Small copy for list cards (map list, feed, galleries): ~20–40 KB instead of ~150 KB. */
export const THUMB_MAX_EDGE_PX = 400
export const THUMB_JPEG_QUALITY = 0.68

/**
 * Photo paths are random UUIDs and never overwritten, so browsers and the CDN may keep them
 * for a year. Without this Supabase serves "no-cache" and phones re-download every photo on every
 * view, which is what used up the free plan's cached-egress quota.
 */
export const IMMUTABLE_CACHE = '31536000'

/** URL of the thumbnail stored next to a photo by uploadPhoto() ("abc.jpg" → "abc-thumb.jpg"). */
export function thumbUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (!/\/storage\/v1\/object\/public\//.test(url) || /-thumb\.jpg$/.test(url)) return url
  return url.replace(/\.[a-z0-9]+(\?.*)?$/i, '-thumb.jpg')
}

/**
 * Upload a photo: shrink it, upload a list thumbnail next to it (best effort), and mark both
 * cacheable. Every image upload in the app should go through here. Returns the main photo's URL.
 */
export async function uploadPhoto(bucket: string, folder: string, file: File): Promise<{ url: string; error: Error | null }> {
  const isImage = file.type.startsWith('image/')
  const main = isImage ? await compressImageFile(file) : file
  const ext = isImage ? 'jpg' : (file.name.split('.').pop() ?? 'bin')
  const id = crypto.randomUUID()
  const path = `${folder ? `${folder}/` : ''}${id}.${ext}`
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, main, { upsert: false, contentType: main.type || 'image/jpeg', cacheControl: IMMUTABLE_CACHE })
  if (error) return { url: '', error }
  if (isImage) {
    try {
      const thumb = await compressImageFile(file, { maxEdge: THUMB_MAX_EDGE_PX, quality: THUMB_JPEG_QUALITY })
      await supabase.storage
        .from(bucket)
        .upload(`${folder ? `${folder}/` : ''}${id}-thumb.jpg`, thumb, { upsert: false, contentType: 'image/jpeg', cacheControl: IMMUTABLE_CACHE })
    } catch {
      /* thumbnail is optional: lists fall back to the full photo */
    }
  }
  return { url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl, error: null }
}

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
  _userId: string,
  _objectName: string,
  file: File,
): Promise<string> {
  const { url, error } = await uploadPhoto('cleanup-media', '', file)
  if (error) throw error
  return url
}
