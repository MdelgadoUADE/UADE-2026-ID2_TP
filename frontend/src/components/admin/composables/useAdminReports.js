import { ref, reactive } from 'vue'

const BASE = 'http://localhost:3000/reports'

export function useAdminReports() {

  const groups    = ref([])   // [{ leader, related, is_group }]
  const total     = ref(0)
  const loading   = ref(false)
  const error     = ref(null)

  // Filtros reactivos — por defecto: más reciente primero
  const filters = reactive({
    status:       '',
    is_anonymous: '',
    tag_key:      '',
    tag_value:    '',
    criticidad:   '',
    validez:      '',
    sort:         'reciente',
  })

  // ─── Fetch ────────────────────────────────────────────
  async function fetchReports() {
    loading.value = true
    error.value   = null

    try {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([k, v]) => {
        if (v !== '') params.append(k, v)
      })

      const res  = await fetch(`${BASE}/admin?${params}`)
      const data = await res.json()

      if (!data.success) throw new Error(data.message)

      groups.value = data.groups
      total.value  = data.total

    } catch (err) {
      console.error(err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // ─── Patch status / criticidad / validez ──────────────
  async function updateReport(id, patch) {
    try {
      const res  = await fetch(`${BASE}/${id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(patch),
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.message)

      // Actualizar localmente para no refetch todo
      _applyPatch(id, patch)

      return { ok: true }
    } catch (err) {
      console.error(err)
      return { ok: false, message: err.message }
    }
  }

  // ─── Helpers ──────────────────────────────────────────
  function _applyPatch(id, patch) {
    for (const group of groups.value) {
      if (String(group.leader._id) === String(id)) {
        Object.assign(group.leader, patch)
        return
      }
      const rel = group.related.find(r => String(r._id) === String(id))
      if (rel) { Object.assign(rel, patch); return }
    }
  }

  function resetFilters() {
    Object.assign(filters, {
      status: '', is_anonymous: '', tag_key: '',
      tag_value: '', criticidad: '', validez: '', sort: 'reciente',
    })
  }

  // ─── Return ───────────────────────────────────────────
  return {
    groups, total, loading, error,
    filters,
    fetchReports,
    updateReport,
    resetFilters,
  }
}
