import { ref, computed } from 'vue'

const BASE = 'http://localhost:3000/reports/admin/user-stats'
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 200

export function useUserStats() {
  const data    = ref(null)   // { ranking, sin_reportes, totales, filtros } — solo la página actual
  const loading = ref(false)
  const error   = ref(null)

  // ── Filtros reactivos ──────────────────────────────────────────────────
  const filters = ref({
    minReportes: 1,   // mínimo de reportes para aparecer en el ranking
    rol:         '',  // '' | 'user' | 'admin' | ...
  })

  // ── Orden de tabla (el admin clickea el header) — se manda al backend ──
  const sortBy  = ref('total_reportes') // 'total_reportes' | 'tasa_falsos' | 'trust_score_promedio' | 'validos' | 'falsos'
  const sortDir = ref('desc')           // 'asc' | 'desc'

  // ── Paginación ──────────────────────────────────────────────────────────
  const pageSize    = ref(DEFAULT_PAGE_SIZE)
  const currentPage = ref(1)
  const totalCount  = ref(0) // total de usuarios que matchean los filtros (no la página)

  function normalizePageSize(value) {
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed)) return DEFAULT_PAGE_SIZE
    return Math.min(Math.max(parsed, 1), MAX_PAGE_SIZE)
  }

  const totalPages = computed(() => {
    if (!totalCount.value) return 1
    return Math.max(1, Math.ceil(totalCount.value / pageSize.value))
  })

  const currentRangeStart = computed(() => {
    if (!totalCount.value) return 0
    return (currentPage.value - 1) * pageSize.value + 1
  })

  const currentRangeEnd = computed(() => {
    if (!totalCount.value) return 0
    return Math.min(currentPage.value * pageSize.value, totalCount.value)
  })

  const canGoPrevious = computed(() => currentPage.value > 1)
  const canGoNext     = computed(() => currentPage.value < totalPages.value)

  async function fetchUserStats() {
    loading.value = true
    error.value   = null

    try {
      const params = new URLSearchParams()
      if (filters.value.minReportes != null) params.set('minReportes', filters.value.minReportes)
      if (filters.value.rol)                  params.set('rol', filters.value.rol)
      params.set('sort', sortBy.value)
      params.set('dir', sortDir.value)
      params.set('limit', String(pageSize.value))
      params.set('skip', String((currentPage.value - 1) * pageSize.value))

      const res  = await fetch(`${BASE}?${params}`)
      const body = await res.json()

      if (!body.success) throw new Error(body.message)

      data.value = body
      totalCount.value = body.total ?? 0
    } catch (err) {
      console.error(err)
      error.value = err.message ?? 'Error al obtener estadísticas de usuarios'
    } finally {
      loading.value = false
    }
  }

  function resetFilters() {
    filters.value = { minReportes: 1, rol: '' }
    resetPaginationAndFetch()
  }

  function setSort(field) {
    if (sortBy.value === field) {
      sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
    } else {
      sortBy.value  = field
      sortDir.value = 'desc'
    }
    resetPaginationAndFetch()
  }

  function setPageSize(value) {
    pageSize.value = normalizePageSize(value)
  }

  // Vuelve a página 1. Si ya estaba en 1, el watch(currentPage) del componente
  // no se dispara (no hay cambio de valor) — por eso forzamos el fetch acá
  // también en ese caso puntual. Si currentPage SÍ cambia, dejamos que el
  // watch del componente dispare el fetch, para no duplicar requests.
  function resetPaginationAndFetch() {
    const wasAlreadyFirstPage = currentPage.value === 1
    currentPage.value = 1
    if (wasAlreadyFirstPage) fetchUserStats()
  }

  function goToPreviousPage() {
    if (!canGoPrevious.value) return
    currentPage.value -= 1
  }

  function goToNextPage() {
    if (!canGoNext.value) return
    currentPage.value += 1
  }

  // ── Helpers de presentación ────────────────────────────────────────────

  function getKpis() {
    if (!data.value) return { usuariosPlataforma: 0, usuariosActivos: 0, tasaFalsosGlobal: '—' }
    const t = data.value.totales
    return {
      usuariosPlataforma: t?.usuarios_plataforma ?? 0,
      usuariosActivos:    t?.usuarios_activos ?? 0,
      tasaFalsosGlobal:   t != null ? `${Math.round((t.tasa_falsos_global ?? 0) * 100)}%` : '—',
    }
  }

  // La página ya viene ordenada y paginada desde el backend
  function getRankingRows() {
    return data.value?.ranking ?? []
  }

  function getSinReportes() {
    return data.value?.sin_reportes ?? []
  }

  return {
    data, loading, error, filters,
    sortBy, sortDir, setSort,
    pageSize, currentPage, totalPages, totalCount,
    currentRangeStart, currentRangeEnd,
    canGoPrevious, canGoNext, MAX_PAGE_SIZE,
    fetchUserStats, resetFilters, resetPaginationAndFetch,
    setPageSize, goToPreviousPage, goToNextPage,
    getKpis, getRankingRows, getSinReportes,
  }
}