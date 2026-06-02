import { ref } from 'vue'

const BASE = 'http://localhost:3000/reports/admin/geo-stats'

export function useGeoStats() {
  const data    = ref(null)   // { heatPoints, porZona, totales, filtros }
  const loading = ref(false)
  const error   = ref(null)

  // ── Filtros reactivos (los controla el componente) ────────────────────────
  const filters = ref({
    criticidad:  '',   // '' | 'baja' | 'media' | 'alta' | 'critica'
    horasAtras:  0,    // 0 = sin límite (default para ver todos los mocks)
    minReportes: 1,    // mínimo de reportes para que una zona aparezca en el bar chart
    validez:     '',   // '' | 'valido' | 'dudoso' | 'falso' | 'pendiente'
  })

  async function fetchGeoStats() {
    loading.value = true
    error.value   = null

    try {
      const params = new URLSearchParams()
      // Usar != null para que 0 se envíe correctamente (horasAtras=0 → sin límite)
      if (filters.value.criticidad  != null && filters.value.criticidad  !== '') params.set('criticidad',  filters.value.criticidad)
      if (filters.value.validez     != null && filters.value.validez     !== '') params.set('validez',     filters.value.validez)
      if (filters.value.horasAtras  != null) params.set('horasAtras',  filters.value.horasAtras)
      if (filters.value.minReportes != null) params.set('minReportes', filters.value.minReportes)

      const res  = await fetch(`${BASE}?${params}`)
      const body = await res.json()

      if (!body.success) throw new Error(body.message)
      data.value = body
    } catch (err) {
      console.error(err)
      error.value = err.message ?? 'Error al obtener datos geográficos'
    } finally {
      loading.value = false
    }
  }

  // ── Helpers de presentación ────────────────────────────────────────────────

  function getKpis() {
    if (!data.value) return { total: 0, criticos: 0, pctCriticos: '—', zonaTop: '—', zonaTopCount: 0 }
    const { totales, porZona } = data.value
    const total    = totales?.total    ?? 0
    const criticos = totales?.criticos ?? 0
    const pct      = total > 0 ? ((criticos / total) * 100).toFixed(0) : '0'
    const top      = porZona?.[0]
    return {
      total,
      criticos,
      pctCriticos:  `${pct}%`,
      zonaTop:      top?._id ?? '—',
      zonaTopCount: top?.count ?? 0,
    }
  }

  const CRIT_COLORS = {
    critica: '#EF4444',
    alta:    '#F97316',
    media:   '#F59E0B',
    baja:    '#10B981',
    null:    '#9CA3AF',
  }

  function getBarData() {
    const zonas = data.value?.porZona?.slice(0, 5) ?? []
    return zonas.map(z => {
      const freq = {}
      for (const c of z.criticidades ?? []) {
        const key = c ?? 'null'
        freq[key] = (freq[key] ?? 0) + 1
      }
      const dominant = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'null'
      const label = z._id?.length > 28 ? z._id.slice(0, 26) + '…' : (z._id ?? 'Sin zona')
      return {
        label,
        count:     z.count,
        color:     CRIT_COLORS[dominant] ?? '#6B7280',
        fullLabel: z._id ?? 'Sin zona',
      }
    })
  }

  function getHeatPoints() {
    return data.value?.heatPoints ?? []
  }

  function resetFilters() {
    filters.value = { criticidad: '', horasAtras: 0, minReportes: 1, validez: '' }
  }

  return {
    data, loading, error, filters,
    fetchGeoStats, resetFilters,
    getKpis, getBarData, getHeatPoints,
  }
}