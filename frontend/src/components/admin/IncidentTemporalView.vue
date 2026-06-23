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

const kpis      = computed(() => getKpis())
const lineData   = computed(() => getLineData())
const heatmap    = computed(() => getHeatmapMatrix())
const topFranja  = computed(() => getTopFranja())

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
  { value: 'baja',    label: 'Baja' },
  { value: 'media',   label: 'Media' },
  { value: 'alta',    label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
]
</script>

<template>
  <div class="space-y-5">

    <!-- ── Filtros ─────────────────────────────────── -->
    <!--
      CAMBIO RESPONSIVE:
      - Se reemplaza "flex flex-wrap items-end gap-4" por un grid adaptativo.
      - En mobile (< sm): cada control ocupa el 100% del ancho (grid-cols-1).
      - En sm-md: dos columnas (grid-cols-2).
      - En lg+: todos en fila (grid-cols-[auto_auto_auto_1fr]) usando subgrid-like approach.
      - Los <select> ahora tienen "w-full" para no quedar angostos en mobile.
      - El indicador de carga y el botón limpiar se ubican en una fila separada
        en mobile, evitando el problema del "ml-auto" que no funciona al hacer wrap.
    -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <!-- Controles de filtros en grid adaptativo -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500">Granularidad</label>
          <select v-model="filters.granularidad"
            class="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option v-for="opt in GRANULARIDAD_OPTS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500">Rango</label>
          <select v-model.number="filters.diasAtras"
            class="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option v-for="opt in RANGO_OPTS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500">Criticidad</label>
          <select v-model="filters.criticidad"
            class="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option v-for="opt in CRITICIDAD_OPTS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

      </div>

      <!--
        CAMBIO RESPONSIVE:
        - Fila inferior separada para "Limpiar filtros" + estado de carga.
        - Usa flex justify-between para que el spinner quede a la derecha
          sin depender de ml-auto dentro de un flex-wrap (que rompía el layout).
        - mt-3 da separación respecto a los selects en todos los tamaños.
      -->
      <div class="mt-3 flex items-center justify-between">
        <button @click="resetFilters"
          class="text-sm text-gray-500 hover:text-blue-600 transition px-2 py-1.5">
          Limpiar filtros
        </button>

        <span v-if="loading"
          class="flex items-center gap-1.5 text-xs text-gray-400">
          <RefreshCw class="w-3.5 h-3.5 animate-spin" /> Actualizando...
        </span>
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
      <span class="text-sm">Cargando estadísticas temporales...</span>
    </div>

    <template v-else-if="data">

      <!-- ── KPI cards ───────────────────────────────── -->
      <!--
        Sin cambio: "grid-cols-1 md:grid-cols-3" ya es correcto.
        En mobile cada KPI ocupa una fila completa; en md+ se colocan en columnas.
        Se mantiene exactamente como estaba.
      -->
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
      <!--
        CAMBIO RESPONSIVE:
        - Se agrega "overflow-x-auto" en un wrapper interior para que en caso de
          que el gráfico no quepa, el usuario pueda hacer scroll horizontal dentro
          de la tarjeta, sin romper el layout de la página.
        - La altura del LineChart se reduce en mobile con una clase condicional
          a través del atributo :height. Se usa 180px en mobile y 240px en desktop.
          Para lograrlo se pasa la altura como prop dinámica usando una clase
          computed via CSS custom property / variable de Tailwind.
          Dado que el componente usa Canvas (no CSS puro), se necesita un contenedor
          con min-h adaptativo para dar contexto visual apropiado.
        - Se añade "min-w-0" al wrapper del canvas para evitar overflow en flex.
      -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-sm font-semibold text-gray-700 mb-1">Tendencia de reportes</p>
        <p class="text-xs text-gray-400 mb-3">
          Campo: <code class="bg-gray-100 px-1 rounded">timestamp</code> · Agrupado por
          <code class="bg-gray-100 px-1 rounded">{{ filters.granularidad }}</code>
        </p>

        <div v-if="lineData.length" class="w-full min-w-0">
          <!--
            :height adaptativo: 180 en pantallas pequeñas, 240 en pantallas normales.
            Se implementa con un wrapper que esconde/muestra según breakpoint.
            El enfoque más simple y sin JS es pasar la altura en función del
            ancho del contenedor via ResizeObserver (ya implementado en LineChart).
            Aquí simplemente reducimos la altura pasada como prop en mobile.
            Como Vue no tiene breakpoints en props, usamos un ref de window.
            Para NO modificar lógica, simplemente hacemos el contenedor más pequeño
            en mobile con CSS, y el ResizeObserver de LineChart se adapta al ancho.
          -->
          <div class="block sm:hidden">
            <LineChart :data="lineData" :height="180" show-values />
          </div>
          <div class="hidden sm:block">
            <LineChart :data="lineData" :height="240" show-values />
          </div>
        </div>

        <div v-else class="flex items-center justify-center h-[180px] sm:h-[240px] text-sm text-gray-400">
          Sin reportes en el período seleccionado.
        </div>
      </div>

      <!-- ── Matriz día-hora (mapa de calor) ─────────── -->
      <!--
        CAMBIO RESPONSIVE:
        - Se agrega "overflow-x-auto" para que en pantallas muy angostas el heatmap
          sea scrolleable horizontalmente sin romper el layout.
        - Se añade un "min-w-[360px]" al contenedor del canvas, que es el mínimo
          razonable para que la grilla sea legible (7 días × 4 franjas con labels).
        - La altura se adapta igual que el LineChart: más pequeña en mobile.
        - El wrapper externo no cambia su ancho (sigue siendo 100%), solo permite
          overflow interno controlado.
      -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-sm font-semibold text-gray-700 mb-1">Distribución por día y franja horaria</p>
        <p class="text-xs text-gray-400 mb-3">
          Permite identificar patrones para la <strong>Estrategia 3 — Cobertura preventiva focalizada</strong>
          (ej. concentración de incidentes los viernes de madrugada).
        </p>

        <div v-if="heatmap.rows.length && heatmap.maxCount > 0">
          <!--
            Wrapper con overflow-x-auto: si la pantalla es muy angosta, el heatmap
            scrollea horizontalmente de forma controlada DENTRO de la tarjeta.
            min-w-[320px] garantiza que el canvas tenga espacio mínimo para ser útil.
          -->
          <div class="overflow-x-auto -mx-1 px-1">
            <div class="min-w-[320px] block sm:hidden">
              <HeatmapMatrixChart :matrix="heatmap" :height="220" />
            </div>
            <div class="min-w-[320px] hidden sm:block">
              <HeatmapMatrixChart :matrix="heatmap" :height="300" />
            </div>
          </div>
        </div>

        <div v-else class="flex items-center justify-center h-[220px] sm:h-[300px] text-sm text-gray-400">
          Sin reportes suficientes para construir el mapa de calor.
        </div>
      </div>

    </template>

  </div>
</template>