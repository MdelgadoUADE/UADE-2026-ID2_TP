import { API_URL } from '../../../api.js'

const CACHE_KEY = 'admin-pending-reports-cache-v1'
const DEFAULT_PAGE_SIZE = 100
const MAX_PAGE_SIZE = 500
const BASE = `${API_URL}/reports`

export function useAdminReports() {
  const groups = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const totalCount = ref(0)
  const pageSize = ref(DEFAULT_PAGE_SIZE)
  const currentPage = ref(1)

  const filters = reactive({
    status: 'active',
    is_anonymous: '',
    tag_key: '',
    tag_value: '',
    criticidad: '',
    validez: '',
    trust_score_min: '',
    trust_score_max: '',
    sort: 'reciente',
  })

  function normalizePageSize(value) {
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed)) return DEFAULT_PAGE_SIZE
    return Math.min(Math.max(parsed, 1), MAX_PAGE_SIZE)
  }

  function getCacheStore() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  function saveCacheStore(store) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(store))
    } catch (err) {
      console.warn('No se pudo persistir la cache de pendientes', err)
    }
  }

  function getCacheScopeKey() {
    return JSON.stringify({
      ...filters,
      limit: pageSize.value,
    })
  }

  function getCachedPage(scopeKey, page) {
    const store = getCacheStore()
    return store[scopeKey]?.pages?.[page] ?? null
  }

  function setCachedPage(scopeKey, page, payload) {
    const store = getCacheStore()
    const scope = store[scopeKey] ?? { total: 0, pages: {}, updatedAt: null }
    scope.total = payload.total
    scope.pages[page] = payload.groups
    scope.updatedAt = Date.now()
    store[scopeKey] = scope
    saveCacheStore(store)
  }

  function syncFromCache(scopeKey, page) {
    const store = getCacheStore()
    const scope = store[scopeKey]

    if (!scope) return false

    total.value = scope.total ?? 0
    totalCount.value = scope.total ?? 0

    if (scope.pages?.[page]) {
      groups.value = scope.pages[page]
      return true
    }

    return false
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
  const canGoNext = computed(() => currentPage.value < totalPages.value)

  async function fetchReports({ force = false } = {}) {
    loading.value = true
    error.value = null

    const scopeKey = getCacheScopeKey()
    const cachedPage = !force ? getCachedPage(scopeKey, currentPage.value) : null

    if (cachedPage) {
      syncFromCache(scopeKey, currentPage.value)
      loading.value = false
      return
    }

    try {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([k, v]) => {
        if (v !== '') params.append(k, v)
      })

      params.append('limit', String(pageSize.value))
      params.append('skip', String((currentPage.value - 1) * pageSize.value))

      const res = await fetch(`${BASE}/admin?${params}`)
      const data = await res.json()

      if (!data.success) throw new Error(data.message)

      groups.value = data.groups
      total.value = data.total
      totalCount.value = data.total

      setCachedPage(scopeKey, currentPage.value, {
        total: data.total,
        groups: data.groups,
      })
    } catch (err) {
      console.error(err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  function resetPaginationAndFetch() {
    currentPage.value = 1
    const scopeKey = getCacheScopeKey()
    if (syncFromCache(scopeKey, currentPage.value)) return
    fetchReports()
  }

  function forceRefresh() {
    currentPage.value = 1
    fetchReports({ force: true })
  }

  function setPageSize(value) {
    pageSize.value = normalizePageSize(value)
  }

  function goToPreviousPage() {
    if (!canGoPrevious.value) return
    currentPage.value -= 1
  }

  function goToNextPage() {
    if (!canGoNext.value) return
    currentPage.value += 1
  }

  async function updateReport(id, patch) {
    try {
      const res = await fetch(`${BASE}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.message)

      _applyPatch(id, patch)

      const scopeKey = getCacheScopeKey()
      setCachedPage(scopeKey, currentPage.value, {
        total: totalCount.value,
        groups: groups.value,
      })

      return { ok: true }
    } catch (err) {
      console.error(err)
      return { ok: false, message: err.message }
    }
  }

  function _applyPatch(id, patch) {
    for (const group of groups.value) {
      if (String(group.leader._id) === String(id)) {
        Object.assign(group.leader, patch)
        return
      }
      const rel = group.related.find(r => String(r._id) === String(id))
      if (rel) {
        Object.assign(rel, patch)
        return
      }
    }
  }

  function resetFilters() {
    Object.assign(filters, {
      status: 'active',
      is_anonymous: '',
      tag_key: '',
      tag_value: '',
      criticidad: '',
      validez: '',
      trust_score_min: '',
      trust_score_max: '',
      sort: 'reciente',
    })
    pageSize.value = DEFAULT_PAGE_SIZE
    currentPage.value = 1
  }

  return {
    groups,
    total,
    totalCount,
    loading,
    error,
    filters,
    pageSize,
    currentPage,
    totalPages,
    currentRangeStart,
    currentRangeEnd,
    canGoPrevious,
    canGoNext,
    MAX_PAGE_SIZE,
    fetchReports,
    resetPaginationAndFetch,
    forceRefresh,
    setPageSize,
    goToPreviousPage,
    goToNextPage,
    updateReport,
    resetFilters,
  }
}
