import type { Report } from '../types/database'
import { assignWard } from './wards'

const WASTE_TYPES = ['Mixed waste', 'Plastic', 'Organic', 'Construction debris', 'E-waste']

export function demoReportDefaults(
  partial: Omit<
    Report,
    | 'waste_type'
    | 'seen_count'
    | 'flag_count'
    | 'approved_at'
    | 'rejected_reason'
    | 'ward_id'
    | 'area_name'
    | 'is_anonymous'
  > &
    Partial<
      Pick<
        Report,
        'waste_type' | 'seen_count' | 'area_name' | 'ward_id' | 'flag_count' | 'approved_at'
      >
    >,
): Report {
  const ward =
    partial.ward_id && partial.area_name
      ? { wardId: partial.ward_id, areaName: partial.area_name }
      : assignWard(partial.latitude, partial.longitude)
  return {
    waste_type: partial.waste_type ?? WASTE_TYPES[Math.floor(Math.random() * WASTE_TYPES.length)],
    seen_count: partial.seen_count ?? Math.floor(Math.random() * 8) + 1,
    flag_count: partial.flag_count ?? 0,
    approved_at: partial.approved_at ?? partial.created_at,
    rejected_reason: null,
    ward_id: partial.ward_id ?? ward?.wardId ?? null,
    area_name: partial.area_name ?? ward?.areaName ?? 'Nairobi',
    is_anonymous: false,
    ...partial,
  }
}
