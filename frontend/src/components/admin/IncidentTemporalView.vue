<script setup>
import { onMounted, computed, watch } from 'vue'
import { RefreshCw, AlertCircle, TrendingUp, Calendar, Flame } from 'lucide-vue-next'

import LineChart          from './charts/LineChart.vue'
import HeatmapMatrixChart from './charts/HeatmapMatrixChart.vue'
import { useTemporalStats } from './composables/useTemporalStats.js'

const {
  data, loading, error, filters,
  fetchTemporalStats, resetFilters,
  getKpis, getLineData, getHeatmapMatrix, getTopFranja,
} = useTemporalStats()

onMounted(fetchTemporalStats)

// Re-fetch automático al cambiar cualquier filtro
watch(filters, fetchTemporalStats, { deep: true })

const kpis       = computed(() => getKpis())
const lineData    = computed(() => getLineData())
const heatmap      = computed(() => getHeatmapMatrix())
const topFranja     = computed(() => getTopFranja())

const GRANULARIDAD_OPTS = [
  { value: 'dia',    label: 'Por día' },
  { value: 'semana', label: 'Por semana' },
  { value: 'mes',    label: 'Por mes' },
]

const RANGO_OPTS = [
  { value: 7,   label: 'Últimos 7 días' },
  { value: 30,  label: 'Últimos 30 días' },
  { value: 90,  label: 'Últimos 90 días' },
  { value: 0,   label: 'Todo el historial' },
]

const CRITICIDAD_OPTS = [
  { value: '',        label: 'Todas' },
  { value: 'baja',     label: 'Baja' },
  { value: 'media',    label: 'Media' },
  { value: 'alta',     label: 'Alta' },
  { value: 'critica',  label: 'Crítica' },
]
</script>

<template>
  <div class="space-y-5">

    <!-- ── Filtros ─────────────────────────────────── -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-end gap-4">

      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-500">Granularidad</label>
        <select v-model="filters.granularidad"
          class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option v-for="opt in GRANULARIDAD_OPTS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-500">Rango</label>
        <select v-model.number="filters.diasAtras"
          class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option v-for="opt in RANGO_OPTS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-500">Criticidad</label>
        <select v-model="filters.criticidad"
          class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option v-for="opt in CRITICIDAD_OPTS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <button @click="resetFilters"
        class="text-sm text-gray-500 hover:text-blue-600 transition px-2 py-1.5">
        Limpiar filtros
      </button>

      <button v-if="loading" disabled
        class="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
        <RefreshCw class="w-3.5 h-3.5 animate-spin" /> Actualizando...
      </button>
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
      <span class="text-sm">Cargando estadísticas temporales...</span>
    </div>

    <template v-else-if="data">

      <!-- ── KPI cards ───────────────────────────────── -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

        <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar class="w-3.5 h-3.5" /> Total en el período
          </div>
          <p class="text-2xl font-semibold text-gray-800">{{ kpis.total }}</p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <TrendingUp class="w-3.5 h-3.5" /> Promedio diario
          </div>
          <p class="text-2xl font-semibold text-blue-600">{{ kpis.promedioDiario }}</p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <Flame class="w-3.5 h-3.5" /> Franja más crítica
          </div>
          <p v-if="topFranja" class="text-base font-semibold text-orange-600">
            {{ topFranja.dia }} · {{ topFranja.franja }}
            <span class="text-xs font-normal text-gray-400">({{ topFranja.count }} reportes)</span>
          </p>
          <p v-else class="text-sm text-gray-400">Sin datos suficientes</p>
        </div>

      </div>

      <!-- ── Tendencia temporal ──────────────────────── -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-sm font-semibold text-gray-700 mb-1">Tendencia de reportes</p>
        <p class="text-xs text-gray-400 mb-3">
          Campo: <code class="bg-gray-100 px-1 rounded">timestamp</code> · Agrupado por
          <code class="bg-gray-100 px-1 rounded">{{ filters.granularidad }}</code>
        </p>
        <div v-if="lineData.length">
          <LineChart :data="lineData" :height="240" show-values />
        </div>
        <div v-else class="flex items-center justify-center h-[240px] text-sm text-gray-400">
          Sin reportes en el período seleccionado.
        </div>
      </div>

      <!-- ── Matriz día-hora (mapa de calor) ─────────── -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-sm font-semibold text-gray-700 mb-1">Distribución por día y franja horaria</p>
        <p class="text-xs text-gray-400 mb-3">
          Permite identificar patrones para la <strong>Estrategia 3 — Cobertura preventiva focalizada</strong>
          (ej. concentración de incidentes los viernes de madrugada).
        </p>
        <div v-if="heatmap.rows.length && heatmap.maxCount > 0">
          <HeatmapMatrixChart :matrix="heatmap" :height="300" />
        </div>
        <div v-else class="flex items-center justify-center h-[300px] text-sm text-gray-400">
          Sin reportes suficientes para construir el mapa de calor.
        </div>
      </div>

    </template>

  </div>
</template>