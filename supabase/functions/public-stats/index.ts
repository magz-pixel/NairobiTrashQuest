import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: reports, error } = await supabase
      .from('reports')
      .select('id, latitude, longitude, severity_score, status, area_name, created_at, waste_type')
      .in('status', ['active', 'verified_cleared', 'flagged'])

    if (error) throw error

    const active = reports?.filter((r) => r.status === 'active').length ?? 0
    const resolved = reports?.filter((r) => r.status === 'verified_cleared').length ?? 0
    const total = reports?.length ?? 0
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0

    const areaCounts = new Map<string, number>()
    for (const r of reports ?? []) {
      if (r.status !== 'active') continue
      const area = r.area_name ?? 'Unknown'
      areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1)
    }
    const worstAreas = [...areaCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([area, count]) => ({ area, count }))

    const geojson = {
      type: 'FeatureCollection',
      license: 'CC-BY-4.0',
      features: (reports ?? []).map((r) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
        properties: {
          id: r.id,
          severity: r.severity_score,
          status: r.status,
          area: r.area_name,
          waste_type: r.waste_type,
          created_at: r.created_at,
        },
      })),
    }

    return new Response(
      JSON.stringify({
        active,
        resolved,
        total,
        resolutionRate,
        worstAreas,
        geojson,
        updated_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Stats failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
