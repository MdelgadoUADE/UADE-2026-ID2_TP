<script setup>
import { onMounted, computed } from 'vue'
import { RefreshCw, AlertCircle, FileText, Clock, CheckCircle, ShieldAlert } from 'lucide-vue-next'

import BarChart    from './charts/BarChart.vue'
import DonutChart  from './charts/DonutChart.vue'
import FunnelChart from './charts/FunnelChart.vue'
import { useAdminStats } from './composables/useAdminStats.js'

const { stats, loading, error, fetchStats,
        getKpis, getFunnelData, getCriticidadData,
        getValidezData, getAnonData, getTrustData } = useAdminStats()

onMounted(fetchStats)

const kpis           = computed(() => getKpis())
const funnelData     = computed(() => getFunnelData())
const criticidadData = computed(() => getCriticidadData())
const validezData    = computed(() => getValidezData())
const anonData       = computed(() => getAnonData())
const trustData      = computed(() => getTrustData())
</script>

<template>
  <div class="space-y-5">

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16 text-gray-400 gap-2">
      <RefreshCw class="w-4 h-4 animate-spin" />
      <span class="text-sm">Cargando estadísticas...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error"
      class="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
      <AlertCircle class="w-4 h-4 shrink-0" />
      {{ error }}
    </div>

    <template v-else-if="stats">

      <!-- ── KPI cards ───────────────────────────────── -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">

        <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <FileText class="w-3.5 h-3.5" /> Total reportes
          </div>
          <p class="text-2xl font-semibold text-gray-800">{{ kpis.total }}</p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock class="w-3.5 h-3.5" /> Activos / en verificación
          </div>
          <p class="text-2xl font-semibold text-yellow-600">{{ kpis.pendientes }}</p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <CheckCircle class="w-3.5 h-3.5" /> Resueltos
          </div>
          <p class="text-2xl font-semibold text-green-600">{{ kpis.resueltos }}</p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <ShieldAlert class="w-3.5 h-3.5" /> Trust score promedio
          </div>
          <p class="text-2xl font-semibold text-blue-600">{{ kpis.trust }}</p>
        </div>

      </div>

      <!-- ── Fila 1: Embudo + Criticidad ────────────── -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-sm font-semibold text-gray-700 mb-1">Embudo de estados</p>
          <p class="text-xs text-gray-400 mb-3">Campo: <code class="bg-gray-100 px-1 rounded">status</code></p>
          <FunnelChart :data="funnelData" :height="210" />
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-sm font-semibold text-gray-700 mb-1">Distribución por criticidad</p>
          <p class="text-xs text-gray-400 mb-3">Campo: <code class="bg-gray-100 px-1 rounded">criticidad</code> · Clasificado en Pendientes</p>
          <div v-if="criticidadData.length">
            <BarChart :data="criticidadData" :height="210" />
          </div>
          <div v-else class="flex flex-col items-center justify-center h-[210px] text-sm text-gray-400 text-center gap-1">
            <span>Sin reportes clasificados aún.</span>
            <span class="text-xs">Usá la pestaña Pendientes para clasificarlos.</span>
          </div>
        </div>

      </div>

      <!-- ── Fila 2: Validez + Anónimo + Trust ──────── -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-sm font-semibold text-gray-700 mb-1">Validez de reportes</p>
          <p class="text-xs text-gray-400 mb-3">Campo: <code class="bg-gray-100 px-1 rounded">validez</code></p>
          <div class="flex flex-col items-center gap-3">
            <DonutChart :data="validezData" :size="150" />
            <div class="flex flex-wrap gap-x-3 gap-y-1 justify-center">
              <span v-for="d in validezData" :key="d.key"
                class="flex items-center gap-1 text-xs text-gray-500">
                <span class="w-2.5 h-2.5 rounded-sm inline-block" :style="{ background: d.color }" />
                {{ d.label }} ({{ d.count }})
              </span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-sm font-semibold text-gray-700 mb-1">Origen del reporte</p>
          <p class="text-xs text-gray-400 mb-3">Campo: <code class="bg-gray-100 px-1 rounded">is_anonymous</code></p>
          <div class="flex flex-col items-center gap-3">
            <DonutChart :data="anonData" :size="150" />
            <div class="flex flex-wrap gap-x-3 gap-y-1 justify-center">
              <span v-for="d in anonData" :key="d.label"
                class="flex items-center gap-1 text-xs text-gray-500">
                <span class="w-2.5 h-2.5 rounded-sm inline-block" :style="{ background: d.color }" />
                {{ d.label }} ({{ d.count }})
              </span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-sm font-semibold text-gray-700 mb-1">Distribución de trust score</p>
          <p class="text-xs text-gray-400 mb-3">Campo: <code class="bg-gray-100 px-1 rounded">trust_score</code></p>
          <BarChart :data="trustData" :height="175" />
        </div>

      </div>

      <!-- Botón recargar -->
      <div class="flex justify-end">
        <button @click="fetchStats"
          class="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition hover:bg-gray-50">
          <RefreshCw class="w-3 h-3" /> Actualizar estadísticas
        </button>
      </div>

    </template>

    <div v-else class="text-center py-16 text-gray-400 text-sm">
      No hay datos disponibles.
    </div>

  </div>
</template>
