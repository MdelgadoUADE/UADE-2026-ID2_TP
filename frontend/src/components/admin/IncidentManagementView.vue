<script setup>
import { ref, onMounted } from 'vue'
import { BarChart2, AlertTriangle, Users, SlidersHorizontal, RefreshCw, RotateCcw, AlertCircle } from 'lucide-vue-next'

import AdminReportCard from './AdminReportCard.vue'
import { useAdminReports } from './composables/useAdminReports.js'

const activeTab = ref('pendientes')

const TABS = [
  { id: 'estadisticas', label: 'Estadísticas', icon: BarChart2  },
  { id: 'pendientes',   label: 'Pendientes',   icon: AlertTriangle },
  { id: 'clusters',     label: 'Clusters',     icon: Users, soon: true },
]

const {
  groups, total, loading, error,
  filters,
  fetchReports,
  updateReport,
  resetFilters,
} = useAdminReports()

onMounted(fetchReports)

async function handlePatch({ id, update }) {
  const { ok, message } = await updateReport(id, update)
  if (!ok) alert(`Error al actualizar: ${message}`)
}

function applyFilters() {
  fetchReports()
}

function handleReset() {
  resetFilters()
  fetchReports()
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
          :disabled="tab.soon"
          @click="!tab.soon && (activeTab = tab.id)"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            tab.soon
              ? 'border-transparent text-gray-300 cursor-not-allowed'
              : activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
          <span v-if="tab.soon" class="text-xs font-normal opacity-60">· pronto</span>
        </button>
      </nav>
    </div>

    <!-- ── Tab: Estadísticas ─────────────────────────── -->
    <div v-if="activeTab === 'estadisticas'"
      class="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <BarChart2 class="w-10 h-10 opacity-30" />
      <p class="text-sm">Los gráficos se implementan en el próximo paso.</p>
    </div>

    <!-- ── Tab: Pendientes ───────────────────────────── -->
    <template v-if="activeTab === 'pendientes'">

      <!-- Filtros -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">

        <div class="flex items-center gap-2 mb-3">
          <SlidersHorizontal class="w-4 h-4 text-gray-400" />
          <span class="text-sm font-semibold text-gray-700">Filtros de la cola</span>
          <span class="ml-auto text-xs text-gray-400">
            {{ total }} reporte{{ total !== 1 ? 's' : '' }} encontrado{{ total !== 1 ? 's' : '' }}
          </span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">

          <div>
            <label class="text-xs text-gray-500 block mb-1">Estado</label>
            <select v-model="filters.status"
              class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400">
              <option value="">Todos</option>
              <option value="active">Activo</option>
              <option value="en_verificacion">En verificación</option>
              <option value="asignado">Asignado</option>
              <option value="resolved">Resuelto</option>
              <option value="archived">Archivado</option>
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

        </div>
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
          <AdminReportCard
            :report="group.leader"
            :is-related="false"
            @patch="handlePatch"
          />

          <template v-if="group.is_group && group.related.length">
            <div class="ml-4 border-l-2 border-indigo-200 pl-2 space-y-2">
              <div class="text-xs text-indigo-500 font-medium pl-2 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.1-1.1" />
                </svg>
                {{ group.related.length }} reporte{{ group.related.length !== 1 ? 's' : '' }} relacionado{{ group.related.length !== 1 ? 's' : '' }}
              </div>
              <AdminReportCard
                v-for="rel in group.related"
                :key="rel._id"
                :report="rel"
                :is-related="true"
                @patch="handlePatch"
              />
            </div>
          </template>

        </div>
      </div>

    </template>

    <!-- ── Tab: Clusters ─────────────────────────────── -->
    <div v-if="activeTab === 'clusters'"
      class="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <Users class="w-10 h-10 opacity-30" />
      <p class="text-sm">Clusters — funcionalidad futura.</p>
    </div>

  </div>
</template>
