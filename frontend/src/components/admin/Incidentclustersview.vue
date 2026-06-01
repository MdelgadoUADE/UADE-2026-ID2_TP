<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  GitBranch, Search, X, MapPin, Clock, Tag, SlidersHorizontal,
  ChevronDown, ChevronUp, Plus, Trash2, AlertCircle, Loader2,
  Layers, Check, RefreshCw, Hash
} from 'lucide-vue-next'

// ─── Clave de sessionStorage ─────────────────────────────────────────────────
const SESSION_KEY = 'reportit_clusters'

// ─── Estado de clusters (filas estilo Burp Suite) ──────────────────────────
const clusters = ref([])        // [{ anchorReport, relatedReports, params, id, label, color }]
const clusterColors = [
  { bg: 'bg-blue-50',   border: 'border-blue-300',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  { bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', dot: 'bg-violet-500' },
  { bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  { bg: 'bg-rose-50',   border: 'border-rose-300',   text: 'text-rose-700',   dot: 'bg-rose-500'   },
  { bg: 'bg-emerald-50',border: 'border-emerald-300',text: 'text-emerald-700',dot: 'bg-emerald-500'},
  { bg: 'bg-cyan-50',   border: 'border-cyan-300',   text: 'text-cyan-700',   dot: 'bg-cyan-500'   },
]

// ─── Panel de búsqueda de reporte ancla ─────────────────────────────────────
const searchQuery      = ref('')
const searchResults    = ref([])
const searchLoading    = ref(false)
const searchError      = ref(null)
const selectedAnchor   = ref(null)
const showSearchPanel  = ref(true)

// ─── Parámetros de correlación ───────────────────────────────────────────────
const params = ref({
  useTags:       true,
  useLocation:   true,
  useTime:       true,
  locationMeters: 500,
  timeHours:     2,
  minTagMatches: 1,
})

// ─── Loading de correlación ──────────────────────────────────────────────────
const correlating    = ref(false)
const correlateError = ref(null)

// ─── Panel expandido por cluster ────────────────────────────────────────────
const expandedClusters = ref(new Set())
const expandedReports  = ref(new Set())

// ═══════════════════════════════════════════════════════════════════════════
// SESSION STORAGE — persistencia durante la sesión
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Restaura los clusters guardados en sessionStorage al montar el componente.
 * El color se reconstruye por índice para evitar guardar los objetos de clase
 * de Tailwind (que son estáticos y no cambian).
 */
function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (!Array.isArray(saved) || saved.length === 0) return
    // Reconstruir el color a partir del índice guardado para mantener consistencia
    clusters.value = saved.map(c => ({
      ...c,
      color: clusterColors[c.colorIdx % clusterColors.length],
    }))
    // Re-expandir el último cluster (UX: mismo comportamiento que al crearlo)
    if (clusters.value.length > 0) {
      const lastId = clusters.value[clusters.value.length - 1].id
      expandedClusters.value = new Set([lastId])
    }
  } catch {
    // Si el JSON está corrupto simplemente empezamos de cero
    sessionStorage.removeItem(SESSION_KEY)
  }
}

/**
 * Serializa los clusters actuales a sessionStorage.
 * Guardamos colorIdx (número) en vez del objeto color para evitar
 * duplicar las clases de Tailwind y facilitar la reconstrucción.
 */
function saveToSession() {
  try {
    const serializable = clusters.value.map((c, i) => ({
      id:             c.id,
      label:          c.label,
      anchorReport:   c.anchorReport,
      relatedReports: c.relatedReports,
      params:         c.params,
      colorIdx:       i % clusterColors.length,
    }))
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(serializable))
  } catch {
    // sessionStorage lleno u otro error → no interrumpir el flujo
  }
}

/** Limpia los clusters del sessionStorage y del estado (llamado en logout). */
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
  clusters.value = []
  expandedClusters.value = new Set()
  expandedReports.value  = new Set()
}

// Al montar: cargar clusters guardados
onMounted(loadFromSession)

// Cada vez que cambia el array de clusters → persistir
watch(clusters, saveToSession, { deep: true })

// Escuchar el evento global de logout emitido desde App.vue
window.addEventListener('reportit:logout', clearSession)
onBeforeUnmount(() => {
  window.removeEventListener('reportit:logout', clearSession)
})

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH REPORTS
// ═══════════════════════════════════════════════════════════════════════════

async function searchReports() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  searchLoading.value = true
  searchError.value   = null
  try {
    const res  = await fetch('http://localhost:3000/reports')
    const data = await res.json()
    const q    = searchQuery.value.toLowerCase()
    searchResults.value = data.filter(r => {
      const username = (r.user?.username || '').toLowerCase()
      const notes    = (r.notes || '').toLowerCase()
      const tags     = JSON.stringify(r.tags || {}).toLowerCase()
      const address  = (r.report_location?.address || '').toLowerCase()
      const id       = String(r._id || '').toLowerCase()
      return username.includes(q) || notes.includes(q) || tags.includes(q) || address.includes(q) || id.includes(q)
    }).slice(0, 10)
  } catch (e) {
    searchError.value = 'Error buscando reportes'
  } finally {
    searchLoading.value = false
  }
}

function selectAnchor(report) {
  selectedAnchor.value = report
  showSearchPanel.value = false
  searchQuery.value    = ''
  searchResults.value  = []
}

function clearAnchor() {
  selectedAnchor.value  = null
  showSearchPanel.value = true
  correlateError.value  = null
}

// ═══════════════════════════════════════════════════════════════════════════
// CORRELATE — client-side using existing /reports endpoint
// ═══════════════════════════════════════════════════════════════════════════

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R   = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a   = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function countTagMatches(tagsA, tagsB) {
  if (!tagsA || !tagsB) return 0
  const keysA = Object.keys(tagsA)
  const keysB = Object.keys(tagsB)
  const shared = keysA.filter(k => keysB.includes(k))
  let matches = 0
  for (const k of shared) {
    const va = String(tagsA[k]).toLowerCase()
    const vb = String(tagsB[k]).toLowerCase()
    if (va === vb) matches++
    else if (typeof tagsA[k] === 'object' && typeof tagsB[k] === 'object') {
      const subKeysA = Object.keys(tagsA[k])
      for (const sk of subKeysA) {
        if (tagsB[k][sk] !== undefined && String(tagsA[k][sk]).toLowerCase() === String(tagsB[k][sk]).toLowerCase()) matches++
      }
    }
  }
  return matches
}

async function createCluster() {
  if (!selectedAnchor.value) return
  correlating.value  = true
  correlateError.value = null

  try {
    const res  = await fetch('http://localhost:3000/reports')
    const all  = await res.json()

    const anchor  = selectedAnchor.value
    const [aLng, aLat] = anchor.report_location.coordinates
    const aTime   = new Date(anchor.timestamp).getTime()

    const related = all.filter(r => {
      if (String(r._id) === String(anchor._id)) return false

      const matchChecks = []

      // ── Tags ──
      if (params.value.useTags) {
        const tagMatches = countTagMatches(anchor.tags, r.tags)
        matchChecks.push(tagMatches >= params.value.minTagMatches)
      }

      // ── Location ──
      if (params.value.useLocation) {
        const [rLng, rLat] = r.report_location.coordinates
        const dist = haversineMeters(aLat, aLng, rLat, rLng)
        matchChecks.push(dist <= params.value.locationMeters)
      }

      // ── Time ──
      if (params.value.useTime) {
        const rTime  = new Date(r.timestamp).getTime()
        const diffH  = Math.abs(aTime - rTime) / (1000 * 60 * 60)
        matchChecks.push(diffH <= params.value.timeHours)
      }

      return matchChecks.length > 0 && matchChecks.every(Boolean)
    })

    const colorIdx   = clusters.value.length % clusterColors.length
    const clusterNum = clusters.value.length + 1

    clusters.value.push({
      id:             Date.now(),
      label:          `Cluster #${clusterNum}`,
      anchorReport:   anchor,
      relatedReports: related,
      params:         JSON.parse(JSON.stringify(params.value)),
      color:          clusterColors[colorIdx],
    })

    // Auto-expand new cluster
    expandedClusters.value = new Set([...expandedClusters.value, clusters.value[clusters.value.length - 1].id])

    // Reset for next
    clearAnchor()

  } catch (e) {
    correlateError.value = 'Error obteniendo reportes para correlación'
  } finally {
    correlating.value = false
  }
}

function removeCluster(id) {
  clusters.value = clusters.value.filter(c => c.id !== id)
  expandedClusters.value.delete(id)
}

function toggleCluster(id) {
  if (expandedClusters.value.has(id)) {
    expandedClusters.value = new Set([...expandedClusters.value].filter(x => x !== id))
  } else {
    expandedClusters.value = new Set([...expandedClusters.value, id])
  }
}

function toggleReport(id) {
  if (expandedReports.value.has(id)) {
    expandedReports.value = new Set([...expandedReports.value].filter(x => x !== id))
  } else {
    expandedReports.value = new Set([...expandedReports.value, id])
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatDate(d) {
  return new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

function tagEntries(tags) {
  if (!tags) return []
  return Object.entries(tags).flatMap(([k, v]) => {
    if (typeof v === 'object' && v !== null) {
      return Object.entries(v).map(([sk, sv]) => [`${k}.${sk}`, sv])
    }
    return [[k, v]]
  })
}

function statusColor(s) {
  const m = { active: 'bg-red-100 text-red-700', resolved: 'bg-green-100 text-green-700',
              archived: 'bg-gray-100 text-gray-600', en_verificacion: 'bg-yellow-100 text-yellow-700',
              asignado: 'bg-blue-100 text-blue-700' }
  return m[s] || 'bg-gray-100 text-gray-600'
}


const enabledCount = computed(() =>
  [params.value.useTags, params.value.useLocation, params.value.useTime].filter(Boolean).length
)
</script>
<template>
  <div class="space-y-5">

    <!-- ══════════════════════════════════════════════════
         PANEL SUPERIOR: Buscar reporte ancla + parámetros
    ═══════════════════════════════════════════════════ -->
    <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

      <!-- Header del panel -->
      <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600">
          <GitBranch class="w-4 h-4 text-white" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-gray-800">Nuevo cluster de correlación</p>
          <p class="text-xs text-gray-500">Seleccioná un reporte ancla y configurá los parámetros</p>
        </div>
        <span v-if="clusters.length > 0"
          class="text-xs font-medium bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
          {{ clusters.length }} cluster{{ clusters.length !== 1 ? 's' : '' }} activo{{ clusters.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div class="p-5 space-y-5">

        <!-- ── Búsqueda de reporte ancla ── -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Reporte ancla
          </label>

          <!-- Reporte seleccionado -->
          <div v-if="selectedAnchor"
            class="flex items-start gap-3 border border-indigo-200 bg-indigo-50 rounded-xl p-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-semibold text-indigo-800">{{ selectedAnchor.user?.username || 'Anónimo' }}</span>
                <!-- ID badge -->
                <span class="flex items-center gap-0.5 text-xs font-mono text-indigo-500 bg-indigo-100 border border-indigo-200 rounded px-1.5 py-0.5">
                  <Hash class="w-2.5 h-2.5" />{{ String(selectedAnchor._id) }}
                </span>
                <span :class="['text-xs px-1.5 py-0.5 rounded-full font-medium', statusColor(selectedAnchor.status)]">
                  {{ selectedAnchor.status }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-0.5 truncate">{{ selectedAnchor.report_location?.address || '—' }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(selectedAnchor.timestamp) }}</p>
              <div v-if="Object.keys(selectedAnchor.tags || {}).length" class="flex flex-wrap gap-1 mt-1.5">
                <span v-for="[k] in tagEntries(selectedAnchor.tags).slice(0,4)" :key="k"
                  class="text-xs bg-indigo-100 text-indigo-700 rounded px-1.5 py-0.5">{{ k }}</span>
                <span v-if="tagEntries(selectedAnchor.tags).length > 4"
                  class="text-xs text-indigo-400">+{{ tagEntries(selectedAnchor.tags).length - 4 }}</span>
              </div>
            </div>
            <button @click="clearAnchor"
              class="text-gray-400 hover:text-red-500 transition-colors shrink-0 mt-0.5">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Buscador -->
          <template v-else>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="searchQuery"
                @input="searchReports"
                type="text"
                placeholder="Buscar por usuario, dirección, tag, notas, ID..."
                class="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              />
              <button v-if="searchQuery" @click="searchQuery = ''; searchResults = []"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Resultados de búsqueda -->
            <div v-if="searchLoading" class="mt-2 flex items-center gap-2 text-xs text-gray-400 px-1">
              <Loader2 class="w-3.5 h-3.5 animate-spin" /> Buscando...
            </div>
            <div v-else-if="searchError" class="mt-2 text-xs text-red-500 px-1">{{ searchError }}</div>
            <div v-else-if="searchResults.length" class="mt-2 border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              <button
                v-for="r in searchResults"
                :key="r._id"
                @click="selectAnchor(r)"
                class="w-full text-left flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors group"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-medium text-gray-800 group-hover:text-indigo-700 transition-colors">
                      {{ r.user?.username || 'Anónimo' }}
                    </span>
                    <!-- ID en resultados de búsqueda -->
                    <span class="flex items-center gap-0.5 text-xs font-mono text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                      <Hash class="w-2.5 h-2.5" />{{ String(r._id) }}
                    </span>
                    <span :class="['text-xs px-1.5 py-0.5 rounded-full font-medium', statusColor(r.status)]">
                      {{ r.status }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-400 truncate mt-0.5">{{ r.report_location?.address || '—' }}</p>
                  <p class="text-xs text-gray-300 mt-0.5">{{ formatDate(r.timestamp) }}</p>
                </div>
                <ChevronDown class="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 rotate-[-90deg] shrink-0 mt-1" />
              </button>
            </div>
            <div v-else-if="searchQuery && !searchLoading" class="mt-2 text-xs text-gray-400 px-1">
              Sin resultados para "{{ searchQuery }}"
            </div>
          </template>
        </div>

        <!-- ── Parámetros de correlación ── -->
        <div>
          <div class="flex items-center gap-2 mb-3">
            <SlidersHorizontal class="w-3.5 h-3.5 text-gray-400" />
            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Parámetros de correlación
            </label>
            <span class="ml-auto text-xs text-indigo-600 font-medium">{{ enabledCount }} activo{{ enabledCount !== 1 ? 's' : '' }}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

            <!-- Tags -->
            <div :class="['border rounded-xl p-3 transition-colors', params.useTags ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200 bg-gray-50']">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-1.5">
                  <Tag class="w-3.5 h-3.5" :class="params.useTags ? 'text-indigo-600' : 'text-gray-400'" />
                  <span class="text-xs font-semibold" :class="params.useTags ? 'text-indigo-700' : 'text-gray-500'">Tags</span>
                </div>
                <button @click="params.useTags = !params.useTags"
                  :class="['w-8 h-4.5 rounded-full transition-colors relative flex items-center',
                    params.useTags ? 'bg-indigo-600' : 'bg-gray-300']"
                  style="height:18px; width:32px;">
                  <span :class="['absolute w-3.5 h-3.5 bg-white rounded-full shadow transition-transform',
                    params.useTags ? 'translate-x-4' : 'translate-x-0.5']" />
                </button>
              </div>
              <div v-if="params.useTags" class="space-y-1">
                <label class="text-xs text-gray-500">Mínimo de tags coincidentes</label>
                <input v-model.number="params.minTagMatches" type="number" min="1" max="20"
                  class="w-full text-xs border border-indigo-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
              </div>
              <p v-else class="text-xs text-gray-400 italic">Desactivado</p>
            </div>

            <!-- Ubicación -->
            <div :class="['border rounded-xl p-3 transition-colors', params.useLocation ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50']">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-1.5">
                  <MapPin class="w-3.5 h-3.5" :class="params.useLocation ? 'text-emerald-600' : 'text-gray-400'" />
                  <span class="text-xs font-semibold" :class="params.useLocation ? 'text-emerald-700' : 'text-gray-500'">Ubicación</span>
                </div>
                <button @click="params.useLocation = !params.useLocation"
                  :class="['relative flex items-center rounded-full transition-colors',
                    params.useLocation ? 'bg-emerald-600' : 'bg-gray-300']"
                  style="height:18px; width:32px;">
                  <span :class="['absolute w-3.5 h-3.5 bg-white rounded-full shadow transition-transform',
                    params.useLocation ? 'translate-x-4' : 'translate-x-0.5']" />
                </button>
              </div>
              <div v-if="params.useLocation" class="space-y-1">
                <label class="text-xs text-gray-500">Radio máximo (metros)</label>
                <input v-model.number="params.locationMeters" type="number" min="50" max="50000" step="50"
                  class="w-full text-xs border border-emerald-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white" />
              </div>
              <p v-else class="text-xs text-gray-400 italic">Desactivado</p>
            </div>

            <!-- Tiempo -->
            <div :class="['border rounded-xl p-3 transition-colors', params.useTime ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200 bg-gray-50']">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-1.5">
                  <Clock class="w-3.5 h-3.5" :class="params.useTime ? 'text-amber-600' : 'text-gray-400'" />
                  <span class="text-xs font-semibold" :class="params.useTime ? 'text-amber-700' : 'text-gray-500'">Tiempo</span>
                </div>
                <button @click="params.useTime = !params.useTime"
                  :class="['relative flex items-center rounded-full transition-colors',
                    params.useTime ? 'bg-amber-500' : 'bg-gray-300']"
                  style="height:18px; width:32px;">
                  <span :class="['absolute w-3.5 h-3.5 bg-white rounded-full shadow transition-transform',
                    params.useTime ? 'translate-x-4' : 'translate-x-0.5']" />
                </button>
              </div>
              <div v-if="params.useTime" class="space-y-1">
                <label class="text-xs text-gray-500">Ventana máxima (horas)</label>
                <input v-model.number="params.timeHours" type="number" min="0.5" max="720" step="0.5"
                  class="w-full text-xs border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white" />
              </div>
              <p v-else class="text-xs text-gray-400 italic">Desactivado</p>
            </div>

          </div>
        </div>

        <!-- ── Error de correlación ── -->
        <div v-if="correlateError"
          class="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle class="w-4 h-4 shrink-0" /> {{ correlateError }}
        </div>

        <!-- ── Botón crear cluster ── -->
        <div class="flex justify-end">
          <button
            @click="createCluster"
            :disabled="!selectedAnchor || correlating || enabledCount === 0"
            :class="[
              'flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all',
              selectedAnchor && !correlating && enabledCount > 0
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            ]"
          >
            <Loader2 v-if="correlating" class="w-4 h-4 animate-spin" />
            <Plus v-else class="w-4 h-4" />
            {{ correlating ? 'Correlacionando...' : 'Crear cluster' }}
          </button>
        </div>

      </div>
    </div>

    <!-- ══════════════════════════════════════════════════
         CLUSTERS (filas estilo Burp Suite)
    ═══════════════════════════════════════════════════ -->

    <div v-if="!clusters.length"
      class="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 border border-dashed border-gray-200 rounded-2xl">
      <Layers class="w-10 h-10 opacity-25" />
      <p class="text-sm font-medium">Aún no hay clusters creados</p>
      <p class="text-xs text-gray-400">Buscá un reporte ancla y configurá los parámetros para comenzar</p>
    </div>

    <!-- Lista de clusters -->
    <div v-else class="space-y-3">
      <div
        v-for="cluster in clusters"
        :key="cluster.id"
        :class="['border rounded-2xl overflow-hidden shadow-sm transition-all', cluster.color.border]"
      >

        <!-- ── Header del cluster (siempre visible, clickeable) ── -->
        <button
          @click="toggleCluster(cluster.id)"
          :class="['w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:brightness-[0.97]', cluster.color.bg]"
        >
          <span :class="['w-2.5 h-2.5 rounded-full shrink-0', cluster.color.dot]" />

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span :class="['text-sm font-bold', cluster.color.text]">{{ cluster.label }}</span>
              <span class="text-xs text-gray-500 font-normal">
                Ancla: <span class="font-medium text-gray-700">{{ cluster.anchorReport.user?.username || 'Anónimo' }}</span>
              </span>
              <span class="flex items-center gap-1 text-xs font-mono text-gray-500">
                ReporteID: <span class="font-medium text-gray-700">{{ String(cluster.anchorReport._id) }}</span>
              </span>
            </div>
            <div class="flex items-center gap-2 mt-0.5 flex-wrap">
              <span v-if="cluster.params.useTags"
                class="text-xs bg-white/70 border border-current/20 rounded px-1.5 py-0.5 text-gray-600">
                Tags ≥{{ cluster.params.minTagMatches }}
              </span>
              <span v-if="cluster.params.useLocation"
                class="text-xs bg-white/70 border border-current/20 rounded px-1.5 py-0.5 text-gray-600">
                ≤{{ cluster.params.locationMeters }}m
              </span>
              <span v-if="cluster.params.useTime"
                class="text-xs bg-white/70 border border-current/20 rounded px-1.5 py-0.5 text-gray-600">
                ≤{{ cluster.params.timeHours }}h
              </span>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full',
              cluster.relatedReports.length > 0 ? 'bg-white text-gray-700 shadow-sm' : 'bg-white/60 text-gray-400']">
              {{ cluster.relatedReports.length }} relacionado{{ cluster.relatedReports.length !== 1 ? 's' : '' }}
            </span>
            <button
              @click.stop="removeCluster(cluster.id)"
              class="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-white/50"
              title="Eliminar cluster"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
            <ChevronDown
              :class="['w-4 h-4 transition-transform text-gray-500',
                expandedClusters.has(cluster.id) ? 'rotate-180' : '']"
            />
          </div>
        </button>

        <!-- ── Contenido expandido del cluster ── -->
        <div v-if="expandedClusters.has(cluster.id)" class="border-t border-current/10">

          <!-- === FILA: Reporte Ancla === -->
          <div class="bg-white">
            <button
              @click="toggleReport('anchor-' + cluster.id)"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <span class="text-xs font-mono text-gray-400 w-5 shrink-0 text-right">#</span>
              <span class="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5 shrink-0">
                <Check class="w-2.5 h-2.5" /> Ancla
              </span>
              <!-- Username + ID -->
              <span class="text-sm font-semibold text-gray-800 shrink-0 truncate">
                {{ cluster.anchorReport.user?.username || 'Anónimo' }}
              </span>
              <span class="flex items-center gap-0.5 text-xs font-mono text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 shrink-0">
                <Hash class="w-2.5 h-2.5" />{{ String(cluster.anchorReport._id) }}
              </span>
              <!-- Status badge -->
              <span :class="['text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0', statusColor(cluster.anchorReport.status)]">
                {{ cluster.anchorReport.status }}
              </span>
              <!-- Address -->
              <span class="text-xs text-gray-500 flex-1 truncate hidden md:block">
                {{ cluster.anchorReport.report_location?.address || '—' }}
              </span>
              <!-- Timestamp -->
              <span class="text-xs text-gray-400 shrink-0 hidden lg:block">
                {{ formatDate(cluster.anchorReport.timestamp) }}
              </span>
              <!-- Tags count -->
              <span class="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 shrink-0">
                {{ tagEntries(cluster.anchorReport.tags).length }} tags
              </span>
              <ChevronDown :class="['w-3.5 h-3.5 text-gray-400 transition-transform shrink-0',
                expandedReports.has('anchor-' + cluster.id) ? 'rotate-180' : '']" />
            </button>

            <!-- Detalle expandido del ancla -->
            <div v-if="expandedReports.has('anchor-' + cluster.id)"
              class="px-6 py-4 bg-indigo-50/30 border-b border-indigo-100 text-xs space-y-3">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p class="font-semibold text-gray-500 mb-1">Ubicación</p>
                  <p class="text-gray-700">{{ cluster.anchorReport.report_location?.address || '—' }}</p>
                  <p class="text-gray-400 font-mono mt-0.5">
                    [{{ cluster.anchorReport.report_location.coordinates[1].toFixed(5) }},
                    {{ cluster.anchorReport.report_location.coordinates[0].toFixed(5) }}]
                  </p>
                </div>
                <div>
                  <p class="font-semibold text-gray-500 mb-1">Notas</p>
                  <p class="text-gray-700 italic">{{ cluster.anchorReport.notes || '—' }}</p>
                </div>
              </div>
              <div v-if="tagEntries(cluster.anchorReport.tags).length">
                <p class="font-semibold text-gray-500 mb-1.5">Tags</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="[k, v] in tagEntries(cluster.anchorReport.tags)" :key="k"
                    class="bg-indigo-100 text-indigo-700 rounded-md px-2 py-0.5">
                    <span class="font-medium">{{ k }}</span>
                    <span v-if="v !== null" class="text-indigo-500"> → {{ v }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- === FILAS: Reportes relacionados (estilo tabla Burp) === -->
          <div v-if="cluster.relatedReports.length === 0"
            class="flex items-center gap-2 px-6 py-4 text-xs text-gray-400 italic bg-white border-t border-gray-100">
            <AlertCircle class="w-3.5 h-3.5" />
            Ningún reporte cumple los criterios de correlación definidos para este cluster.
          </div>

          <div v-else>
            <div
              v-for="(report, idx) in cluster.relatedReports"
              :key="report._id"
              :class="['border-t', idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50']"
            >
              <!-- Fila compacta (estilo Burp) -->
              <button
                @click="toggleReport(report._id + '-' + cluster.id)"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50/50 transition-colors group"
              >
                <!-- Número de fila -->
                <span class="text-xs font-mono text-gray-300 w-5 shrink-0 text-right">{{ idx + 1 }}</span>
                <!-- Username + ID -->
                <span class="text-sm font-medium text-gray-700 group-hover:text-gray-900 shrink-0 truncate">
                  {{ report.user?.username || 'Anónimo' }}
                </span>
                <span class="flex items-center gap-0.5 text-xs font-mono text-gray-400 bg-gray-100 group-hover:bg-gray-200 rounded px-1.5 py-0.5 shrink-0 transition-colors">
                  <Hash class="w-2.5 h-2.5" />{{ String(report._id) }}
                </span>
                <!-- Status -->
                <span :class="['text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0', statusColor(report.status)]">
                  {{ report.status }}
                </span>
                <!-- Address -->
                <span class="text-xs text-gray-500 flex-1 truncate hidden md:block">
                  {{ report.report_location?.address || '—' }}
                </span>
                <!-- Timestamp -->
                <span class="text-xs text-gray-400 shrink-0 hidden lg:block">
                  {{ formatDate(report.timestamp) }}
                </span>
                <!-- Tags count -->
                <span class="text-xs bg-gray-100 text-gray-500 group-hover:bg-gray-200 rounded px-1.5 py-0.5 shrink-0 transition-colors">
                  {{ tagEntries(report.tags).length }} tags
                </span>
                <!-- Trust score -->
                <span class="text-xs font-mono text-gray-400 shrink-0 w-10 text-right hidden lg:block">
                  {{ report.trust_score?.toFixed(2) ?? '—' }}
                </span>
                <ChevronDown :class="['w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-transform shrink-0',
                  expandedReports.has(report._id + '-' + cluster.id) ? 'rotate-180' : '']" />
              </button>

              <!-- Detalle expandido del reporte relacionado -->
              <div v-if="expandedReports.has(report._id + '-' + cluster.id)"
                class="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs space-y-3">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p class="font-semibold text-gray-500 mb-1">Ubicación</p>
                    <p class="text-gray-700">{{ report.report_location?.address || '—' }}</p>
                    <p class="text-gray-400 font-mono mt-0.5">
                      [{{ report.report_location.coordinates[1].toFixed(5) }},
                      {{ report.report_location.coordinates[0].toFixed(5) }}]
                    </p>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-500 mb-1">Notas</p>
                    <p class="text-gray-700 italic">{{ report.notes || '—' }}</p>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-500 mb-1">Trust score</p>
                    <p class="text-gray-700 font-mono">{{ report.trust_score?.toFixed(4) ?? '—' }}</p>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-500 mb-1">Origen</p>
                    <p class="text-gray-700">{{ report.is_anonymous ? 'Anónimo' : report.user?.email || '—' }}</p>
                  </div>
                </div>
                <div v-if="tagEntries(report.tags).length">
                  <p class="font-semibold text-gray-500 mb-1.5">Tags</p>
                  <div class="flex flex-wrap gap-1.5">
                    <span v-for="[k, v] in tagEntries(report.tags)" :key="k"
                      :class="[
                        'rounded-md px-2 py-0.5',
                        tagEntries(cluster.anchorReport.tags).some(([ak]) => ak === k)
                          ? 'bg-yellow-100 text-yellow-800 font-semibold'
                          : 'bg-gray-100 text-gray-600'
                      ]">
                      <span class="font-medium">{{ k }}</span>
                      <span v-if="v !== null" class="opacity-75"> → {{ v }}</span>
                    </span>
                  </div>
                  <p class="text-gray-400 mt-1.5 italic">
                    Tags resaltados en amarillo coinciden con el reporte ancla.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>
