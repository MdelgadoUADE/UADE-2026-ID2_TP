import { ref } from 'vue'

const BASE = 'http://localhost:3000/reports/admin/temporal-stats'

export function useTemporalStats() {
  const data    = ref(null)   // { tendencia, matriz_dia_hora, totales, filtros }
  const loading = ref(false)
  const error   = ref(null)

  // ── Filtros reactivos (los controla el componente) ────────────────────────
  const filters = ref({
    granularidad: 'dia',  // 'dia' | 'semana' | 'mes'
    diasAtras:    30,     // 0 = sin límite
    criticidad:   '',     // '' | 'baja' | 'media' | 'alta' | 'critica'
    validez:      '',     // '' | 'valido' | 'dudoso' | 'falso' | 'pendiente'
  })

  async function fetchTemporalStats() {
    loading.value = true
    error.value   = null

    try {
      const params = new URLSearchParams()
      params.set('granularidad', filters.value.granularidad)
      if (filters.value.diasAtras != null) params.set('diasAtras', filters.value.diasAtras)
      if (filters.value.criticidad)        params.set('criticidad', filters.value.criticidad)
      if (filters.value.validez)           params.set('validez', filters.value.validez)

      const res  = await fetch(`${BASE}?${params}`)
      const body = await res.json()

      if (!body.success) throw new Error(body.message)
      data.value = body
    } catch (err) {
      console.error(err)
      error.value = err.message ?? 'Error al obtener estadísticas temporales'
    } finally {
      loading.value = false
    }
  }

  function resetFilters() {
    filters.value = { granularidad: 'dia', diasAtras: 30, criticidad: '', validez: '' }
  }

  // ── Helpers de presentación ────────────────────────────────────────────────

  function getKpis() {
    if (!data.value) return { total: 0, promedioDiario: '—', tendenciaPuntos: 0 }
    const { totales, tendencia } = data.value
    return {
      total:           totales?.total ?? 0,
      promedioDiario:  totales?.promedio_diario != null ? totales.promedio_diario : '—',
      tendenciaPuntos: tendencia?.length ?? 0,
    }
  }

  // Línea de tendencia → [{ label, value }]
  function getLineData() {
    const raw = data.value?.tendencia ?? []
    return raw.map(r => ({
      label: formatBucketLabel(r._id, data.value?.filtros?.granularidad),
      value: r.count,
    }))
  }

  function formatBucketLabel(id, granularidad) {
    if (!id) return ''
    if (granularidad === 'semana') {
      // 'YYYY-Www' -> 'Www'
      const [, w] = id.split('-W')
      return `Sem ${w}`
    }
    if (granularidad === 'mes') {
      // 'YYYY-MM' -> 'MM/YY'
      const [y, m] = id.split('-')
      return `${m}/${y.slice(2)}`
    }
    // 'YYYY-MM-DD' -> 'DD/MM'
    const [, m, d] = id.split('-')
    return `${d}/${m}`
  }

  // Matriz día-hora → grilla completa 7 días x 4 franjas, con huecos en 0
  const DIAS_ORDEN = [
    { id: 2, label: 'Lun' }, { id: 3, label: 'Mar' }, { id: 4, label: 'Mié' },
    { id: 5, label: 'Jue' }, { id: 6, label: 'Vie' }, { id: 7, label: 'Sáb' },
    { id: 1, label: 'Dom' }, // Mongo: 1=Domingo ... 7=Sábado
  ]
  const FRANJAS = [
    { id: 'madrugada', label: 'Madrugada', sub: '00–06h' },
    { id: 'manana',    label: 'Mañana',    sub: '06–12h' },
    { id: 'tarde',     label: 'Tarde',     sub: '12–19h' },
    { id: 'noche',     label: 'Noche',     sub: '19–24h' },
  ]

  function getHeatmapMatrix() {
    const raw = data.value?.matriz_dia_hora ?? []
    const map = new Map(raw.map(r => [`${r._id.dia}-${r._id.franja}`, r.count]))

    const maxCount = raw.reduce((max, r) => Math.max(max, r.count), 0)

    const rows = DIAS_ORDEN.map(dia => ({
      diaLabel: dia.label,
      cells: FRANJAS.map(franja => ({
        dia: dia.label,
        franja: franja.label,
        franjaSub: franja.sub,
        count: map.get(`${dia.id}-${franja.id}`) ?? 0,
      })),
    }))

    return { rows, franjas: FRANJAS, maxCount }
  }

  // Top franja crítica (para destacar en texto, ej. "Viernes de madrugada")
  function getTopFranja() {
    const raw = data.value?.matriz_dia_hora ?? []
    if (!raw.length) return null

    const top = raw.reduce((a, b) => (b.count > a.count ? b : a))
    const diaLabel = DIAS_ORDEN.find(d => d.id === top._id.dia)?.label ?? '—'
    const franjaLabel = FRANJAS.find(f => f.id === top._id.franja)?.label ?? '—'

    return { dia: diaLabel, franja: franjaLabel, count: top.count }
  }

  return {
    data, loading, error, filters,
    fetchTemporalStats, resetFilters,
    getKpis, getLineData, getHeatmapMatrix, getTopFranja,
  }
}