import { ref } from 'vue'
import { API_URL } from '../../../api.js'

const BASE = `${API_URL}/reports/admin/stats`

export function useAdminStats() {

  const stats   = ref(null)
  const loading = ref(false)
  const error   = ref(null)

  async function fetchStats() {
    loading.value = true
    error.value   = null

    try {
      const res  = await fetch(BASE)
      const data = await res.json()

      if (!data.success) throw new Error(data.message)

      stats.value = data.stats
    } catch (err) {
      console.error(err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // ── Helpers para que el componente no haga lógica ────

  // KPIs
  function getKpis() {
    const t = stats.value?.totales?.[0]
    if (!t) return { total: 0, pendientes: 0, resueltos: 0, trust: '—' }
    return {
      total:      t.total,
      pendientes: t.pendientes,
      resueltos:  t.resueltos,
      trust:      t.trust_promedio != null ? t.trust_promedio.toFixed(2) : '—',
    }
  }

  // Embudo de estados — orden operativo fijo
  const STATUS_ORDER  = ['active', 'en_verificacion', 'asignado', 'resolved', 'archived']
  const STATUS_LABELS = {
    active:          'Activo',
    en_verificacion: 'En verificación',
    asignado:        'Asignado',
    resolved:        'Resuelto',
    archived:        'Archivado',
  }
  const STATUS_COLORS = {
    active:          '#3B82F6',
    en_verificacion: '#F59E0B',
    asignado:        '#8B5CF6',
    resolved:        '#10B981',
    archived:        '#9CA3AF',
  }

  function getFunnelData() {
    const raw = stats.value?.por_status ?? []
    const map = Object.fromEntries(raw.map(r => [r._id, r.count]))
    return STATUS_ORDER.map(s => ({
      key:   s,
      label: STATUS_LABELS[s],
      color: STATUS_COLORS[s],
      count: map[s] ?? 0,
    }))
  }

  // Criticidad
  const CRITICIDAD_ORDER  = ['critica', 'alta', 'media', 'baja', 'sin_clasificar']
  const CRITICIDAD_LABELS = {
    critica:        'Crítica',
    alta:           'Alta',
    media:          'Media',
    baja:           'Baja',
    sin_clasificar: 'Sin clasificar',
  }
  const CRITICIDAD_COLORS = {
    critica:        '#EF4444',
    alta:           '#F97316',
    media:          '#F59E0B',
    baja:           '#10B981',
    sin_clasificar: '#D1D5DB',
  }

  function getCriticidadData() {
    const raw = stats.value?.por_criticidad ?? []
    const map = Object.fromEntries(raw.map(r => [r._id, r.count]))
    return CRITICIDAD_ORDER
      .map(k => ({ key: k, label: CRITICIDAD_LABELS[k], color: CRITICIDAD_COLORS[k], count: map[k] ?? 0 }))
      .filter(d => d.count > 0)
  }

  // Validez — para donut
  const VALIDEZ_COLORS = {
    pendiente: '#9CA3AF',
    valido:    '#10B981',
    falso:     '#EF4444',
    dudoso:    '#F59E0B',
  }
  const VALIDEZ_LABELS = {
    pendiente: 'Pendiente',
    valido:    'Válido',
    falso:     'Falso',
    dudoso:    'Dudoso',
  }

  function getValidezData() {
    const raw = stats.value?.por_validez ?? []
    return raw.map(r => ({
      key:   r._id,
      label: VALIDEZ_LABELS[r._id] ?? r._id,
      color: VALIDEZ_COLORS[r._id] ?? '#D1D5DB',
      count: r.count,
    }))
  }

  // Anónimo vs autenticado
  function getAnonData() {
    const raw = stats.value?.anonimos ?? []
    const map = Object.fromEntries(raw.map(r => [String(r._id), r.count]))
    return [
      { label: 'Autenticado', color: '#3B82F6', count: map['false'] ?? 0 },
      { label: 'Anónimo',     color: '#9CA3AF', count: map['true']  ?? 0 },
    ]
  }

  // Trust score — histograma
  const TRUST_LABELS = ['0.0–0.2', '0.2–0.4', '0.4–0.6', '0.6–0.8', '0.8–1.0']
  const TRUST_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#059669']

  function getTrustData() {
    const raw = stats.value?.trust_score_ranges ?? []
    // $bucket devuelve _id = el boundary inferior
    const boundaryMap = { 0: 0, 0.2: 1, 0.4: 2, 0.6: 3, 0.8: 4 }
    const counts = [0, 0, 0, 0, 0]
    for (const r of raw) {
      const idx = boundaryMap[r._id]
      if (idx !== undefined) counts[idx] = r.count
    }
    return TRUST_LABELS.map((label, i) => ({
      label,
      color: TRUST_COLORS[i],
      count: counts[i],
    }))
  }

  return {
    stats, loading, error,
    fetchStats,
    getKpis,
    getFunnelData,
    getCriticidadData,
    getValidezData,
    getAnonData,
    getTrustData,
  }
}
