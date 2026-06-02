<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

import { useGeoStats } from './composables/useGeoStats.js'

const {
  data, loading, error, filters,
  fetchGeoStats, resetFilters,
  getKpis, getBarData, getHeatPoints,
} = useGeoStats()

// ─── Computed helpers ────────────────────────────────────────────────────────
const kpis = computed(() => getKpis())
const barData = computed(() => getBarData())

// ─── Mapa ────────────────────────────────────────────────────────────────────
const mapContainer = ref(null)
let leafletMap = null
let heatLayer = null

const MAP_CENTER = [-34.6037, -58.3816]
const MAP_ZOOM = 12

// Configuración del heatmap (optimizada para visualización)
const heatmapConfig = {
  radius: 30,
  blur: 20,
  maxZoom: 18,
  minOpacity: 0.4,
  gradient: {
    0.0: '#00B4D8',
    0.2: '#0077B6', 
    0.4: '#F59E0B',
    0.6: '#F97316',
    0.8: '#EF4444',
    1.0: '#7F1D1D'
  }
}

// ─── Actualizar heatmap ──────────────────────────────────────────────────────
function updateHeatmap() {
  if (!leafletMap) return

  const heatPoints = getHeatPoints()
  
  // Si no hay puntos, limpiar la capa pero NO mostrar mensaje de error
  if (!heatPoints || heatPoints.length === 0) {
    if (heatLayer) {
      leafletMap.removeLayer(heatLayer)
      heatLayer = null
    }
    return
  }

  // Convertir al formato de Leaflet.heat
  const heatData = heatPoints.map(point => [
    point.lat, 
    point.lng, 
    (point.weight || 0.5) * 1.0
  ])

  // Remover capa anterior
  if (heatLayer) {
    leafletMap.removeLayer(heatLayer)
  }

  // Crear nueva capa
  heatLayer = L.heatLayer(heatData, heatmapConfig).addTo(leafletMap)

  // Solo ajustar bounds si tenemos puntos y es la primera vez o hay cambios significativos
  if (heatData.length > 0 && heatData.length === heatPoints.length) {
    try {
      const bounds = L.latLngBounds(heatData.map(p => [p[0], p[1]]))
      leafletMap.fitBounds(bounds.pad(0.15))
    } catch (err) {
      console.warn('Error ajustando bounds:', err)
    }
  }
}

// ─── Inicializar mapa ────────────────────────────────────────────────────────
function initMap() {
  if (!mapContainer.value || leafletMap) return

  leafletMap = L.map(mapContainer.value).setView(MAP_CENTER, MAP_ZOOM)

  // Capa base más limpia y profesional
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(leafletMap)

  // Escala
  L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(leafletMap)
  
  // Actualizar heatmap después de inicializar
  nextTick(() => updateHeatmap())
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
async function applyFilters() {
  await fetchGeoStats()
  nextTick(() => updateHeatmap())
}

async function handleReset() {
  resetFilters()
  await fetchGeoStats()
  nextTick(() => updateHeatmap())
}

// ─── Watches ─────────────────────────────────────────────────────────────────
watch(mapContainer, (el) => {
  if (el && !leafletMap) {
    nextTick(() => initMap())
  }
}, { immediate: true })

// Watch para cambios en los datos
watch(data, () => {
  if (leafletMap) {
    nextTick(() => {
      leafletMap.invalidateSize()
      updateHeatmap()
    })
  }
}, { deep: true })

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchGeoStats()
  if (mapContainer.value && !leafletMap) {
    initMap()
  }
})

onBeforeUnmount(() => {
  if (heatLayer) {
    leafletMap?.removeLayer(heatLayer)
  }
  leafletMap?.remove()
  leafletMap = null
})

// ─── UI Config ────────────────────────────────────────────────────────────────
const CRIT_CONFIG = {
  critica: { label: 'Crítica', bg: 'bg-red-100', text: 'text-red-700' },
  alta: { label: 'Alta', bg: 'bg-orange-100', text: 'text-orange-700' },
  media: { label: 'Media', bg: 'bg-amber-100', text: 'text-amber-700' },
  baja: { label: 'Baja', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  '': { label: 'Todas', bg: 'bg-gray-100', text: 'text-gray-600' },
}

const VENTANAS = [
  { value: 6, label: 'Últimas 6h' },
  { value: 12, label: 'Últimas 12h' },
  { value: 24, label: 'Últimas 24h' },
  { value: 48, label: 'Últimas 48h' },
  { value: 168, label: 'Última semana' },
  { value: 720, label: 'Último mes' },
  { value: 0, label: 'Sin límite' },
]

const HEATMAP_LEGEND = [
  { color: '#00B4D8', label: 'Baja' },
  { color: '#0077B6', label: 'Media-Baja' },
  { color: '#F59E0B', label: 'Media' },
  { color: '#F97316', label: 'Alta' },
  { color: '#EF4444', label: 'Muy Alta' },
]
</script>

<template>
  <div class="space-y-5">

    <!-- Panel de Filtros -->
    <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-gray-800">Heatmap de Incidentes</p>
          <p class="text-xs text-gray-500">Visualización de densidad por ubicación y criticidad</p>
        </div>
      </div>

      <div class="p-5">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Criticidad</label>
            <select v-model="filters.criticidad" class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">Todas</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ventana temporal</label>
            <select v-model.number="filters.horasAtras" class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option v-for="v in VENTANAS" :key="v.value" :value="v.value">{{ v.label }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Validez</label>
            <select v-model="filters.validez" class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">Todas</option>
              <option value="valido">Válido</option>
              <option value="pendiente">Pendiente</option>
              <option value="dudoso">Dudoso</option>
              <option value="falso">Falso</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mín. reportes por zona</label>
            <input v-model.number="filters.minReportes" type="number" min="1" max="100" class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"/>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 mt-4">
          <button @click="handleReset" class="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-4 py-2.5 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Resetear
          </button>
          <button @click="applyFilters" :disabled="loading" class="flex items-center gap-2 text-sm font-semibold bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white rounded-xl px-5 py-2.5 transition-colors shadow-sm">
            <svg class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {{ loading ? 'Cargando...' : 'Aplicar filtros' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error (solo errores reales, no de datos vacíos) -->
    <div v-if="error && error !== 'Sin datos para mostrar'" class="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      {{ error }}
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <p class="text-xs text-gray-500 uppercase">Total Reportes</p>
        <p class="text-2xl font-bold text-gray-800">{{ kpis.total }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <p class="text-xs text-gray-500 uppercase">Alta / Crítica</p>
        <p class="text-2xl font-bold text-red-600">{{ kpis.criticos }}</p>
        <p class="text-xs text-gray-400">{{ kpis.pctCriticos }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <p class="text-xs text-gray-500 uppercase">Zona más activa</p>
        <p class="text-lg font-bold text-gray-800 truncate" :title="kpis.zonaTop">{{ kpis.zonaTop }}</p>
        <p class="text-xs text-gray-400">{{ kpis.zonaTopCount }} reportes</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <p class="text-xs text-gray-500 uppercase">Ventana</p>
        <p class="text-sm font-bold text-gray-800">{{ VENTANAS.find(v => v.value === filters.horasAtras)?.label || 'Sin límite' }}</p>
      </div>
    </div>

    <!-- Mapa Heatmap -->
    <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p class="text-sm font-semibold text-gray-800">Heatmap de Densidad de Incidentes</p>
          <p class="text-xs text-gray-500">Mayor intensidad = más incidentes cerca</p>
        </div>
        <div class="hidden md:flex items-center gap-3 text-xs">
          <span class="text-gray-500 mr-1">Densidad:</span>
          <div v-for="step in HEATMAP_LEGEND" :key="step.label" class="flex items-center gap-1">
            <span class="inline-block w-3 h-3 rounded-full" :style="{ background: step.color }" />
            <span class="text-gray-500 text-xs">{{ step.label }}</span>
          </div>
        </div>
      </div>

      <!-- Contenedor del mapa -->
      <div ref="mapContainer" class="w-full" style="height: 500px; min-height: 500px; background: #f8fafc"></div>

      <!-- Loading overlay -->
      <div v-if="loading" class="absolute inset-0 bg-white/70 flex items-center justify-center rounded-b-2xl" style="margin-top: -1px;">
        <div class="flex items-center gap-2 bg-white px-5 py-3 rounded-full shadow-lg">
          <div class="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-sm text-gray-600">Cargando incidentes...</span>
        </div>
      </div>
    </div>

    <!-- Top Zonas -->
    <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100">
        <p class="text-sm font-semibold text-gray-800">Top Zonas por Incidentes</p>
        <p class="text-xs text-gray-500">Mínimo {{ filters.minReportes }} reporte{{ filters.minReportes !== 1 ? 's' : '' }} por zona</p>
      </div>
      <div class="p-5">
        <div v-if="!barData.length" class="text-center py-8 text-gray-400">
          Sin zonas con {{ filters.minReportes }}+ reportes
        </div>
        <div v-else class="space-y-4">
          <div v-for="zona in barData" :key="zona.fullLabel" class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="font-medium text-gray-700 truncate" :title="zona.fullLabel">{{ zona.fullLabel }}</span>
              <span class="text-gray-500 font-mono">{{ zona.count }}</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-7 overflow-hidden">
              <div 
                class="h-full rounded-full flex items-center justify-end px-3 text-xs text-white font-semibold"
                :style="{ width: `${(zona.count / barData[0].count) * 100}%`, backgroundColor: zona.color }"
              >
                <span v-if="(zona.count / barData[0].count) > 0.15">{{ Math.round((zona.count / kpis.total) * 100) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>