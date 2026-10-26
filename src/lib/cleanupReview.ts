import type { Report } from '../types/database'

/** Matches supabase/migrations/021_pending_cleanup_review.sql */
export const PENDING_CLEANUP_NOTE = 'Pending cleanup verification'

/** Hotspot still on the map, after-photo waiting for admin review. */
export function isCleanupUnderReview(report: Report): boolean {
  return (
    (report.status === 'active' || report.status === 'flagged') &&
    report.moderation_note === PENDING_CLEANUP_NOTE &&
    Boolean(report.cleared_image_url)
  )
}
