<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { LayoutDashboard, AlertTriangle, GitBranch, Search, SlidersHorizontal, RefreshCw, RotateCcw, AlertCircle, Pin, ChevronLeft, ChevronRight } from 'lucide-vue-next'

import AdminReportCard        from './AdminReportCard.vue'
import IncidentStatsView      from './IncidentStatsView.vue'
import IncidentClustersView   from './IncidentClustersView.vue'
import IncidentSearchView     from './IncidentSearchView.vue'
import { useAdminReports }    from './composables/useAdminReports.js'

const activeTab = ref('pendientes')
const focusedReportId = ref(null)

const TABS = [
  { id: 'estadisticas', label: 'Estadísticas',  icon: LayoutDashboard },
  { id: 'pendientes',   label: 'Pendientes',    icon: AlertTriangle   },
  { id: 'busqueda',     label: 'Búsqueda',      icon: Search          },
  { id: 'clusters',     label: 'Clusters',      icon: GitBranch       },
]

const {
  groups, total, totalCount, loading, error, filters,
  pageSize, currentPage, totalPages, currentRangeStart, currentRangeEnd,
  canGoPrevious, canGoNext, MAX_PAGE_SIZE,
  fetchReports, resetPaginationAndFetch, setPageSize, goToPreviousPage, goToNextPage,
  updateReport,
  resetFilters,
} = useAdminReports()

onMounted(fetchReports)

watch(currentPage, () => {
  fetchReports()
})

function handlePageSizeInput(event) {
  setPageSize(event.target.value)
  resetPaginationAndFetch()
}

async function handlePatch({ id, update }) {
  const { ok, message } = await updateReport(id, update)
  if (!ok) alert(`Error al actualizar: ${message}`)
}

function applyFilters() {
  resetPaginationAndFetch()
}

function handleReset() {
  resetFilters()
  fetchReports()
}

async function goToReport(reportId) {
  focusedReportId.value = String(reportId)
  resetFilters()
  await fetchReports()
  activeTab.value = 'pendientes'
  await nextTick()
  const el = document.getElementById('report-' + String(reportId))
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<template>
  <div class="space-y-4">

    <!-- ── Pestañas ──────────────────────────────────── -->
    <div class="border-b border-gray-200">
      <nav class="flex gap-1">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- ── Tab: Estadísticas ─────────────────────────── -->
    <IncidentStatsView v-if="activeTab === 'estadisticas'" />

    <!-- ── Tab: Pendientes ───────────────────────────── -->
    <template v-if="activeTab === 'pendientes'">

      <!-- Filtros -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">

        <div class="flex items-center gap-2 mb-3">
          <SlidersHorizontal class="w-4 h-4 text-gray-400" />
          <span class="text-sm font-semibold text-gray-700">Filtros de la cola</span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">

          <div>
            <label class="text-xs text-gray-500 block mb-1">Estado</label>
            + <select v-model="filters.status"
              class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400">
              <option value="active">Activo</option>
              <option value="en_verificacion">En verificación</option>
              <option value="asignado">Asignado</option>
              <option value="resolved">Resuelto</option>
              <option value="archived">Archivado</option>
              <option value="">Todos</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-gray-500 block mb-1">Origen</label>
            <select v-model="filters.is_anonymous"
              class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400">
              <option value="">Todos</option>
              <option value="false">Solo autenticados</option>
              <option value="true">Solo anónimos</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-gray-500 block mb-1">Criticidad</label>
            <select v-model="filters.criticidad"
              class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400">
              <option value="">Todas</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-gray-500 block mb-1">Validez</label>
            <select v-model="filters.validez"
              class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400">
              <option value="">Todas</option>
              <option value="pendiente">Pendiente</option>
              <option value="valido">Válido</option>
              <option value="dudoso">Dudoso</option>
              <option value="falso">Falso</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-gray-500 block mb-1">Tag (clave)</label>
            <input v-model="filters.tag_key" type="text" placeholder="Ej: color_vehiculo"
              class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>

          <div>
            <label class="text-xs text-gray-500 block mb-1">Tag (valor)</label>
            <input v-model="filters.tag_value" type="text" placeholder="Ej: Negro"
              class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>

          <div>
            <label class="text-xs text-gray-500 block mb-1">Orden</label>
            <select v-model="filters.sort"
              class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400">
              <option value="reciente">Más reciente primero</option>
              <option value="antiguo">Más antiguo primero</option>
            </select>
          </div>

          <div class="flex items-end gap-2">
            <button @click="applyFilters"
              class="flex-1 flex items-center justify-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 transition">
              <RefreshCw class="w-3.5 h-3.5" /> Aplicar
            </button>
            <button @click="handleReset"
              class="flex items-center justify-center gap-1 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg px-3 py-2 transition">
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <label class="text-xs text-gray-500 block mb-1">Mostrando</label>
            <div class="flex items-center gap-1.5 text-xs text-gray-400 h-[42px]">
              <input
                :value="pageSize"
                type="number"
                min="1"
                :max="MAX_PAGE_SIZE"
                step="1"
                @change="handlePageSizeInput"
                class="w-12 border-0 border-b border-gray-200 bg-transparent px-0 py-0.5 text-center text-xs text-gray-500 focus:outline-none focus:ring-0 focus:border-blue-400"
              />
              <span>de {{ total }} reporte{{ total !== 1 ? 's' : '' }}</span>
            </div>
          </div>

        </div>

        <div class="mt-3 flex items-center justify-between gap-2">
          <span class="text-xs text-gray-500">
            {{ currentRangeStart }}-{{ currentRangeEnd }} / {{ totalCount }}
          </span>

          <div class="flex items-center gap-1">
            <button
              :disabled="!canGoPrevious"
              @click="goToPreviousPage"
              class="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-blue-300 hover:text-blue-600"
            >
              <ChevronLeft class="w-3.5 h-3.5" />
              Anterior
            </button>

            <span class="px-2 text-xs text-gray-500">
              {{ currentPage }} / {{ totalPages }}
            </span>

            <button
              :disabled="!canGoNext"
              @click="goToNextPage"
              class="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-blue-300 hover:text-blue-600"
            >
              Siguiente
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Banner reporte enfocado -->
      <div v-if="focusedReportId"
        class="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
        <Pin class="w-4 h-4 text-emerald-600 shrink-0" />
        <div class="flex-1 min-w-0">
          <span class="font-semibold text-emerald-800">Mostrando reporte gestionado</span>
          <span class="text-emerald-600 font-mono ml-2 text-xs break-all">{{ focusedReportId }}</span>
        </div>
        <button @click="focusedReportId = null"
          class="text-emerald-600 hover:text-emerald-800 transition-colors shrink-0">
          <AlertCircle class="w-4 h-4" />
        </button>
      </div>

      <!-- Cola -->
      <div v-if="loading" class="flex items-center justify-center py-12 text-gray-400 gap-2">
        <RefreshCw class="w-4 h-4 animate-spin" />
        <span class="text-sm">Cargando reportes...</span>
      </div>

      <div v-else-if="error"
        class="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
        <AlertCircle class="w-4 h-4 shrink-0" />
        {{ error }}
      </div>

      <div v-else-if="!groups.length"
        class="text-center py-12 text-gray-400 text-sm">
        No hay reportes que coincidan con los filtros seleccionados.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="group in groups"
          :key="group.leader._id"
          class="space-y-2"
        >
          <div :id="'report-' + String(group.leader._id)">
            <AdminReportCard
              :report="group.leader"
              :is-related="false"
              :highlighted="focusedReportId === String(group.leader._id)"
              @patch="handlePatch"
            />
          </div>

          <template v-if="group.is_group && group.related.length">
            <div class="ml-4 border-l-2 border-indigo-200 pl-2 space-y-2">
              <div class="text-xs text-indigo-500 font-medium pl-2 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.1-1.1" />
                </svg>
                {{ group.related.length }} reporte{{ group.related.length !== 1 ? 's' : '' }} relacionado{{ group.related.length !== 1 ? 's' : '' }}
              </div>
              <div
                v-for="rel in group.related"
                :key="rel._id"
                :id="'report-' + String(rel._id)"
              >
                <AdminReportCard
                  :report="rel"
                  :is-related="true"
                  :highlighted="focusedReportId === String(rel._id)"
                  @patch="handlePatch"
                />
              </div>
            </div>
          </template>

        </div>
      </div>

    </template>

    <!-- ── Tab: Búsqueda ─────────────────────────────── -->
    <IncidentSearchView v-if="activeTab === 'busqueda'" @manage-report="goToReport" />

    <!-- ── Tab: Clusters ─────────────────────────────── -->
    <IncidentClustersView v-if="activeTab === 'clusters'" />

  </div>
</template>