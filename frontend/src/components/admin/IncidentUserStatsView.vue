<script setup>
import { onMounted, computed, watch } from 'vue'
import { RefreshCw, AlertCircle, Users, UserCheck, AlertTriangle, ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-vue-next'

import { useUserStats } from './composables/useUserStats.js'

const {
  data, loading, error, filters,
  sortBy, sortDir, setSort,
  pageSize, currentPage, totalPages, totalCount,
  currentRangeStart, currentRangeEnd,
  canGoPrevious, canGoNext, MAX_PAGE_SIZE,
  fetchUserStats, resetFilters, resetPaginationAndFetch,
  setPageSize, goToPreviousPage, goToNextPage,
  getKpis, getRankingRows, getSinReportes,
} = useUserStats()

onMounted(fetchUserStats)

// Cambiar filtros (no orden, no paginación) vuelve a página 1 y refetchea
watch(filters, resetPaginationAndFetch, { deep: true })

// Cambiar de página refetchea sin resetear nada más
watch(currentPage, fetchUserStats)

function handlePageSizeInput(event) {
  setPageSize(event.target.value)
  resetPaginationAndFetch()
}

const kpis        = computed(() => getKpis())
const rankingRows  = computed(() => getRankingRows())
const sinReportes   = computed(() => getSinReportes())

const ROL_OPTS = [
  { value: '',      label: 'Todos' },
  { value: 'user',  label: 'Usuario' },
  { value: 'admin', label: 'Administrador' },
]

const COLUMNS = [
  { key: 'username',             label: 'Usuario',        sortable: false },
  { key: 'role',                 label: 'Rol',            sortable: false },
  { key: 'total_reportes',       label: 'Total',          sortable: true },
  { key: 'validos',              label: 'Válidos',        sortable: true },
  { key: 'falsos',               label: 'Falsos',         sortable: true },
  { key: 'tasa_falsos',          label: '% Falsos',       sortable: true },
  { key: 'trust_score_promedio', label: 'Trust prom.',    sortable: true },
]

function tasaFalsosClass(tasa) {
  if (tasa >= 0.3) return 'bg-red-50 text-red-600 border border-red-200'
  if (tasa >= 0.1) return 'bg-orange-50 text-orange-600 border border-orange-200'
  return 'bg-green-50 text-green-600 border border-green-200'
}

function trustClass(score) {
  if (score == null) return 'text-gray-400'
  if (score >= 0.7) return 'text-green-600 font-medium'
  if (score >= 0.4) return 'text-orange-600 font-medium'
  return 'text-red-600 font-medium'
}

function formatPct(tasa) {
  return `${Math.round(tasa * 100)}%`
}
</script>

<template>
  <div class="space-y-5">

    <!-- ── Filtros ─────────────────────────────────── -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">

      <div class="flex flex-wrap items-end gap-4">

        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500">Mínimo de reportes</label>
          <select v-model.number="filters.minReportes"
            class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option :value="1">1 o más</option>
            <option :value="3">3 o más</option>
            <option :value="5">5 o más</option>
            <option :value="10">10 o más</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500">Rol</label>
          <select v-model="filters.rol"
            class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option v-for="opt in ROL_OPTS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <button @click="resetFilters"
          class="text-sm text-gray-500 hover:text-blue-600 transition px-2 py-1.5">
          Limpiar filtros
        </button>

        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500 block">Mostrando</label>
          <div class="flex items-center gap-1.5 text-xs text-gray-400 h-[34px]">
            <input
              :value="pageSize"
              type="number"
              min="1"
              :max="MAX_PAGE_SIZE"
              step="1"
              @change="handlePageSizeInput"
              class="w-12 border-0 border-b border-gray-200 bg-transparent px-0 py-0.5 text-center text-xs text-gray-500 focus:outline-none focus:ring-0 focus:border-blue-400"
            />
            <span>de {{ totalCount }} usuario{{ totalCount !== 1 ? 's' : '' }}</span>
          </div>
        </div>

        <button v-if="loading" disabled
          class="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
          <RefreshCw class="w-3.5 h-3.5 animate-spin" /> Actualizando...
        </button>
      </div>

      <!-- ── Paginación ──────────────────────────────── -->
      <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
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

    <!-- ── Error ───────────────────────────────────── -->
    <div v-if="error"
      class="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
      <AlertCircle class="w-4 h-4 shrink-0" />
      {{ error }}
    </div>

    <!-- ── Loading inicial ─────────────────────────── -->
    <div v-else-if="loading && !data" class="flex items-center justify-center py-16 text-gray-400 gap-2">
      <RefreshCw class="w-4 h-4 animate-spin" />
      <span class="text-sm">Cargando estadísticas de usuarios...</span>
    </div>

    <template v-else-if="data">

      <!-- ── KPI cards ───────────────────────────────── -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

        <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <Users class="w-3.5 h-3.5" /> Usuarios en la plataforma
          </div>
          <p class="text-2xl font-semibold text-gray-800">{{ kpis.usuariosPlataforma }}</p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <UserCheck class="w-3.5 h-3.5" /> Usuarios activos (con reportes)
          </div>
          <p class="text-2xl font-semibold text-blue-600">{{ kpis.usuariosActivos }}</p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <AlertTriangle class="w-3.5 h-3.5" /> Tasa de reportes falsos (global)
          </div>
          <p class="text-2xl font-semibold text-red-600">{{ kpis.tasaFalsosGlobal }}</p>
        </div>

      </div>

      <!-- ── Tabla de ranking de usuarios ────────────── -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-sm font-semibold text-gray-700 mb-1">Ranking de usuarios reportantes</p>
        <p class="text-xs text-gray-400 mb-3">
          Campos: <code class="bg-gray-100 px-1 rounded">user.user_id</code>,
          <code class="bg-gray-100 px-1 rounded">validez</code>,
          <code class="bg-gray-100 px-1 rounded">trust_score</code> · Rol desde tabla
          <code class="bg-gray-100 px-1 rounded">users</code> (Postgres) · No incluye reportes anónimos.
          Click en una columna para ordenar.
        </p>

        <div v-if="loading" class="flex items-center justify-center py-10 text-gray-400 gap-2">
          <RefreshCw class="w-4 h-4 animate-spin" />
          <span class="text-sm">Cargando página...</span>
        </div>

        <div v-else-if="rankingRows.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th
                  v-for="col in COLUMNS" :key="col.key"
                  @click="col.sortable && setSort(col.key)"
                  :class="[
                    'text-left text-xs font-medium text-gray-400 px-3 py-2 select-none',
                    col.sortable ? 'cursor-pointer hover:text-blue-600' : ''
                  ]"
                >
                  <span class="flex items-center gap-1">
                    {{ col.label }}
                    <template v-if="col.sortable">
                      <ArrowUp   v-if="sortBy === col.key && sortDir === 'asc'"  class="w-3 h-3" />
                      <ArrowDown v-else-if="sortBy === col.key && sortDir === 'desc'" class="w-3 h-3" />
                      <ChevronsUpDown v-else class="w-3 h-3 opacity-30" />
                    </template>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rankingRows" :key="row.user_id"
                class="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
                <td class="px-3 py-2.5">
                  <p class="font-medium text-gray-800">{{ row.username }}</p>
                  <p class="text-xs text-gray-400">{{ row.email }}</p>
                </td>
                <td class="px-3 py-2.5">
                  <span v-if="row.role"
                    class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                    {{ row.role }}
                  </span>
                  <span v-else class="text-xs text-gray-300">—</span>
                </td>
                <td class="px-3 py-2.5 text-gray-700">{{ row.total_reportes }}</td>
                <td class="px-3 py-2.5 text-green-600">{{ row.validos }}</td>
                <td class="px-3 py-2.5 text-red-600">{{ row.falsos }}</td>
                <td class="px-3 py-2.5">
                  <span class="text-xs px-2 py-0.5 rounded-full" :class="tasaFalsosClass(row.tasa_falsos)">
                    {{ formatPct(row.tasa_falsos) }}
                  </span>
                </td>
                <td class="px-3 py-2.5" :class="trustClass(row.trust_score_promedio)">
                  {{ row.trust_score_promedio != null ? row.trust_score_promedio.toFixed(2) : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="flex items-center justify-center h-[120px] text-sm text-gray-400">
          Sin usuarios que cumplan el mínimo de reportes seleccionado.
        </div>
      </div>

      <!-- ── Usuarios sin reportes aún ─────────────────── -->
      <div v-if="sinReportes.length" class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-sm font-semibold text-gray-700 mb-1">Usuarios registrados sin reportes aún</p>
        <p class="text-xs text-gray-400 mb-3">
          Cuentas creadas en la plataforma (<code class="bg-gray-100 px-1 rounded">users</code>, Postgres)
          que todavía no generaron ningún reporte.
        </p>
        <div class="flex flex-wrap gap-2">
          <span v-for="u in sinReportes" :key="u.user_id"
            class="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            {{ u.username }} <span class="text-gray-400">· {{ u.role }}</span>
          </span>
        </div>
      </div>

    </template>

  </div>
</template>