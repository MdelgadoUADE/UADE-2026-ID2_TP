<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'  // Plugin para heatmap

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Import de tu composable existente
import { useGeoStats } from './composables/useGeoStats.js'

const {
  data, loading, error, filters,
  fetchGeoStats, resetFilters,
  getKpis, getBarData, getHeatPoints,
} = useGeoStats()

// ─── Computed helpers ────────────────────────────────────────────────────────
const kpis = computed(() => getKpis())
const barData = computed(() => getBarData())

// ─── Mapa Leaflet con Heatmap ────────────────────────────────────────────────
const mapContainer = ref(null)
let leafletMap = null
let heatLayer = null  // Capa para el heatmap
let markersLayer = null  // Capa opcional para marcadores (toggle)

// Configuración del mapa
const MAP_CENTER = [-34.6037, -58.3816]  // Buenos Aires
const MAP_ZOOM = 13

// Configuración del heatmap
const heatmapConfig = {
  radius: 25,        // Radio de influencia de cada punto (en píxeles)
  blur: 15,          // Cantidad de blur aplicado
  maxZoom: 17,       // Zoom máximo donde el heatmap es más visible
  minOpacity: 0.3,   // Opacidad mínima
  gradient: {        // Gradiente de colores (0 = frío, 1 = caliente)
    0.0: '#00B4D8',   // Azul claro - baja densidad
    0.2: '#0077B6',   // Azul medio
    0.4: '#F59E0B',   // Amarillo/naranja - densidad media
    0.6: '#F97316',   // Naranja - densidad alta
    0.8: '#EF4444',   // Rojo - densidad muy alta
    1.0: '#7F1D1D'    // Rojo oscuro - máxima densidad
  }
}

// Control de UI
const showMarkers = ref(false)  // Toggle para mostrar/ocultar marcadores
const heatmapIntensity = ref(1.0)  // Intensidad del heatmap

// ─── Inicializar mapa ────────────────────────────────────────────────────────
function initMap() {
  if (!mapContainer.value) {
    console.error('Contenedor del mapa no encontrado')
    return
  }

  try {
    // Crear el mapa
    leafletMap = L.map(mapContainer.value).setView(MAP_CENTER, MAP_ZOOM)

    // Capa base (OpenStreetMap con estilo más limpio)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 3
    }).addTo(leafletMap)

    // Inicializar capas
    markersLayer = L.layerGroup().addTo(leafletMap)
    
    // Crear heatmap layer (vacío inicialmente)
    heatLayer = L.heatLayer([], heatmapConfig).addTo(leafletMap)

    // Control de escala
    L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(leafletMap)

  } catch (err) {
    console.error('Error creando el mapa:', err)
    error.value = 'Error al inicializar el mapa'
  }
}

// ─── Actualizar heatmap con nuevos datos ──────────────────────────────────────
function updateHeatmap(heatPoints) {
  if (!heatLayer || !leafletMap) return

  // Remover capa anterior si existe
  if (heatLayer) {
    leafletMap.removeLayer(heatLayer)
  }

  // Si no hay puntos, mostrar capa vacía
  if (!heatPoints || heatPoints.length === 0) {
    heatLayer = L.heatLayer([], heatmapConfig).addTo(leafletMap)
    return
  }

  // Convertir puntos al formato que espera Leaflet.heat: [lat, lng, intensity]
  // Usamos el weight que viene de getHeatPoints() (basado en criticidad)
  const heatData = heatPoints.map(point => {
    // point tiene formato: { lat, lng, weight }
    const intensity = point.weight * heatmapIntensity.value
    return [point.lat, point.lng, intensity]
  })

  // Crear nueva capa de heatmap con la configuración actualizada
  heatLayer = L.heatLayer(heatData, {
    ...heatmapConfig,
    radius: heatmapConfig.radius,
    blur: heatmapConfig.blur,
    maxZoom: heatmapConfig.maxZoom,
    minOpacity: heatmapConfig.minOpacity,
    gradient: heatmapConfig.gradient
  }).addTo(leafletMap)

  // Ajustar los bounds del mapa para mostrar todos los puntos
  if (heatPoints.length > 0) {
    const bounds = L.latLngBounds(heatPoints.map(p => [p.lat, p.lng]))
    leafletMap.fitBounds(bounds.pad(0.2))
  }
}

// ─── Actualizar marcadores opcionales ─────────────────────────────────────────
function updateMarkers(heatPoints) {
  if (!markersLayer) return
  
  markersLayer.clearLayers()
  
  if (!showMarkers.value || !heatPoints) return

  heatPoints.forEach(point => {
    const marker = L.circleMarker([point.lat, point.lng], {
      radius: 4,
      color: '#FFFFFF',
      weight: 1,
      opacity: 0.8,
      fillColor: '#EF4444',
      fillOpacity: 0.6
    })
    
    // Calcular intensidad para mostrar en tooltip
    const intensityPct = Math.round(point.weight * 100)
    
    marker.bindTooltip(`
      <strong>Incidente</strong><br/>
      Intensidad: ${intensityPct}%
    `, { sticky: true })
    
    marker.addTo(markersLayer)
  })
}

// ─── Handlers de UI ───────────────────────────────────────────────────────────
async function applyFilters() { 
  await fetchGeoStats()
  
  // Actualizar heatmap con nuevos datos
  const heatPoints = getHeatPoints()
  updateHeatmap(heatPoints)
}

async function handleReset() { 
  resetFilters()
  await fetchGeoStats()
  const heatPoints = getHeatPoints()
  updateHeatmap(heatPoints)
}

// Actualizar radio del heatmap dinámicamente
function updateHeatmapRadius(value) {
  if (!heatLayer || !leafletMap) return
  
  const heatPoints = getHeatPoints()
  const heatData = heatPoints.map(point => [point.lat, point.lng, point.weight * heatmapIntensity.value])
  
  leafletMap.removeLayer(heatLayer)
  heatLayer = L.heatLayer(heatData, {
    ...heatmapConfig,
    radius: value,
    blur: heatmapConfig.blur
  }).addTo(leafletMap)
}

// Actualizar intensidad del heatmap
function updateHeatmapIntensity(value) {
  heatmapIntensity.value = value
  const heatPoints = getHeatPoints()
  updateHeatmap(heatPoints)
}

// Toggle de marcadores
function toggleMarkers() {
  showMarkers.value = !showMarkers.value
  const heatPoints = getHeatPoints()
  updateMarkers(heatPoints)
}

// ─── Watches ──────────────────────────────────────────────────────────────────
watch(mapContainer, (el) => {
  if (el && !leafletMap) {
    nextTick(() => initMap())
  }
}, { immediate: true })

watch(data, async (newData) => {
  if (!newData) return
  
  await nextTick()
  requestAnimationFrame(() => {
    leafletMap?.invalidateSize()
    
    const heatPoints = getHeatPoints()
    updateHeatmap(heatPoints)
    
    if (showMarkers.value) {
      updateMarkers(heatPoints)
    }
  })
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchGeoStats()
  await nextTick()
  
  if (mapContainer.value && !leafletMap) {
    initMap()
  }
})

onBeforeUnmount(() => {
  if (heatLayer) {
    leafletMap?.removeLayer(heatLayer)
  }
  if (markersLayer) {
    leafletMap?.removeLayer(markersLayer)
  }
  leafletMap?.remove()
  leafletMap = null
})

// ─── Configuración estática para UI ───────────────────────────────────────────
const CRIT_CONFIG = {
  critica: { label: 'Crítica', bg: 'bg-red-100', text: 'text-red-700' },
  alta: { label: 'Alta', bg: 'bg-orange-100', text: 'text-orange-700' },
  media: { label: 'Media', bg: 'bg-amber-100', text: 'text-amber-700' },
  baja: { label: 'Baja', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  '': { label: 'Todas', bg: 'bg-gray-100', text: 'text-gray-600' },
}

const VALIDEZ_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'valido', label: 'Válido' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'dudoso', label: 'Dudoso' },
  { value: 'falso', label: 'Falso' }
]

const VENTANAS = [
  { value: 6, label: 'Últimas 6h' },
  { value: 12, label: 'Últimas 12h' },
  { value: 24, label: 'Últimas 24h' },
  { value: 48, label: 'Últimas 48h' },
  { value: 168, label: 'Última semana' },
  { value: 720, label: 'Último mes' },
  { value: 0, label: 'Sin límite' },
]

// Leyenda del heatmap
const HEATMAP_GRADIENT_LEGEND = [
  { color: '#00B4D8', label: 'Baja densidad', min: 0, max: 20 },
  { color: '#0077B6', label: 'Densidad media-baja', min: 20, max: 40 },
  { color: '#F59E0B', label: 'Densidad media', min: 40, max: 60 },
  { color: '#F97316', label: 'Densidad alta', min: 60, max: 80 },
  { color: '#EF4444', label: 'Densidad muy alta', min: 80, max: 100 },
]
</script>

<template>
  <div class="space-y-5">

    <!-- ══════════════════════════════════════════════════════════════
         FILTROS
    ═══════════════════════════════════════════════════════════════ -->
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

          <!-- Criticidad -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Criticidad
            </label>
            <select v-model="filters.criticidad"
              class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400">
              <option value="">Todas</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          <!-- Ventana temporal -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Ventana temporal
            </label>
            <select v-model.number="filters.horasAtras"
              class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400">
              <option v-for="v in VENTANAS" :key="v.value" :value="v.value">
                {{ v.label }}
              </option>
            </select>
          </div>

          <!-- Validez -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Validez
            </label>
            <select v-model="filters.validez"
              class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400">
              <option value="">Todas</option>
              <option value="valido">Válido</option>
              <option value="pendiente">Pendiente</option>
              <option value="dudoso">Dudoso</option>
              <option value="falso">Falso</option>
            </select>
          </div>

          <!-- Mínimo de reportes por zona -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Mín. reportes por zona
            </label>
            <input
              v-model.number="filters.minReportes"
              type="number" min="1" max="100"
              class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
            />
          </div>

        </div>

        <!-- Controles adicionales del heatmap -->
        <div class="mt-4 pt-4 border-t border-gray-100">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <!-- Radio del heatmap -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Radio del heatmap: {{ Math.round(heatmapConfig.radius) }}px
              </label>
              <input
                type="range"
                :value="heatmapConfig.radius"
                @input="updateHeatmapRadius($event.target.value)"
                min="10"
                max="60"
                step="5"
                class="w-full"
              />
            </div>

            <!-- Intensidad del heatmap -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Intensidad: {{ (heatmapIntensity * 100).toFixed(0) }}%
              </label>
              <input
                type="range"
                v-model.number="heatmapIntensity"
                @input="updateHeatmapIntensity(heatmapIntensity)"
                min="0.3"
                max="2"
                step="0.1"
                class="w-full"
              />
            </div>

            <!-- Toggle de marcadores -->
            <div class="flex items-end">
              <button
                @click="toggleMarkers"
                :class="[
                  'flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-colors',
                  showMarkers
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                {{ showMarkers ? 'Ocultar' : 'Mostrar' }} puntos
              </button>
            </div>

          </div>
        </div>

        <!-- Botones -->
        <div class="flex items-center justify-end gap-2 mt-4">
          <button @click="handleReset"
            class="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-4 py-2.5 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Resetear
          </button>
          <button @click="applyFilters" :disabled="loading"
            class="flex items-center gap-2 text-sm font-semibold bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white rounded-xl px-5 py-2.5 transition-colors shadow-sm">
            <svg class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {{ loading ? 'Cargando...' : 'Aplicar filtros' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Error ──────────────────────────────────────────────────────────── -->
    <div v-if="error"
      class="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      {{ error }}
    </div>

    <template v-if="!loading || data">

      <!-- ══════════════════════════════════════════════════════════════
           KPI CARDS
      ═══════════════════════════════════════════════════════════════ -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">

        <div class="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-1.5 shadow-sm">
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            Reportes en rango
          </div>
          <p class="text-2xl font-bold text-gray-800">{{ kpis.total }}</p>
          <p class="text-xs text-gray-400">Con los filtros actuales</p>
        </div>

        <div class="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-1.5 shadow-sm">
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            Alta / Crítica
          </div>
          <p class="text-2xl font-bold text-red-600">{{ kpis.criticos }}</p>
          <p class="text-xs text-gray-400">{{ kpis.pctCriticos }} del total</p>
        </div>

        <div class="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-1.5 shadow-sm">
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
            Zona más activa
          </div>
          <p class="text-lg font-bold text-gray-800 leading-tight truncate" :title="kpis.zonaTop">
            {{ kpis.zonaTop }}
          </p>
          <p class="text-xs text-gray-400">{{ kpis.zonaTopCount }} reporte{{ kpis.zonaTopCount !== 1 ? 's' : '' }}</p>
        </div>

        <div class="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-1.5 shadow-sm">
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Ventana temporal
          </div>
          <p class="text-lg font-bold text-gray-800">
            {{ VENTANAS.find(v => v.value === filters.horasAtras)?.label ?? `${filters.horasAtras}h` }}
          </p>
          <p class="text-xs text-gray-400">
            {{ filters.criticidad ? CRIT_CONFIG[filters.criticidad]?.label : 'Todas las criticidades' }}
          </p>
        </div>

      </div>

      <!-- ══════════════════════════════════════════════════════════════
           MAPA HEATMAP
      ═══════════════════════════════════════════════════════════════ -->
      <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible">

        <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-800">Heatmap de Densidad de Incidentes</p>
            <p class="text-xs text-gray-500">
              Visualización de concentración geográfica · Mayor intensidad = más incidentes cerca
            </p>
          </div>

          <!-- Leyenda del heatmap -->
          <div class="hidden md:flex items-center gap-2 text-xs">
            <span class="text-gray-500 mr-1">Densidad:</span>
            <div v-for="step in HEATMAP_GRADIENT_LEGEND" :key="step.label" class="flex items-center gap-1">
              <span
                class="inline-block w-3 h-3 rounded-full"
                :style="{ background: step.color }"
              />
              <span class="text-gray-500 text-xs">{{ step.label }}</span>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div
          v-if="getHeatPoints().length === 0 && !loading"
          class="flex flex-col items-center justify-center py-12 gap-3 text-gray-400"
        >
          <svg class="w-10 h-10 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <p class="text-sm font-medium">Sin incidentes para los filtros seleccionados</p>
          <p class="text-xs">Probá ampliar la ventana temporal o quitar filtros de criticidad</p>
        </div>

        <!-- Contenedor del mapa -->
        <div
          ref="mapContainer"
          class="w-full rounded-b-2xl relative bg-gray-100"
          style="height: 500px; min-height: 500px"
          :class="{ 'opacity-60 pointer-events-none': loading }"
        />

        <!-- Loading overlay del mapa -->
        <div v-if="loading" class="absolute inset-0 bg-white/50 flex items-center justify-center rounded-b-2xl" style="margin-top: -1px;">
          <div class="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg">
            <div class="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm text-gray-600">Cargando datos del heatmap...</span>
          </div>
        </div>

      </div>

      <!-- ══════════════════════════════════════════════════════════════
           TOP ZONAS — BAR CHART
      ═══════════════════════════════════════════════════════════════ -->
      <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-800">Top 5 Zonas por Incidentes</p>
            <p class="text-xs text-gray-500">
              Color según criticidad dominante · Mínimo {{ filters.minReportes }} reporte{{ filters.minReportes !== 1 ? 's' : '' }} por zona
            </p>
          </div>
          <div class="hidden md:flex items-center gap-2 flex-wrap justify-end">
            <span v-for="(cfg, key) in CRIT_CONFIG" :key="key"
              v-show="key !== ''"
              :class="['text-xs px-2 py-0.5 rounded-full font-medium', cfg.bg, cfg.text]">
              {{ cfg.label }}
            </span>
          </div>
        </div>

        <div class="p-5">

          <div v-if="!barData.length"
            class="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
            <svg class="w-8 h-8 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <p class="text-sm">Sin zonas con {{ filters.minReportes }}+ reportes</p>
          </div>

          <div v-else class="space-y-4">
            <!-- Gráfico de barras horizontal con CSS -->
            <div v-for="(zona, idx) in barData" :key="zona.fullLabel" class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400 font-mono w-6">{{ idx + 1 }}</span>
                  <span class="font-medium text-gray-700 truncate" :title="zona.fullLabel">
                    {{ zona.fullLabel }}
                  </span>
                </div>
                <span class="text-gray-500 font-mono">{{ zona.count }}</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                <div 
                  class="h-full rounded-full flex items-center justify-end px-3 text-xs text-white font-semibold transition-all"
                  :style="{ 
                    width: `${(zona.count / barData[0].count) * 100}%`,
                    backgroundColor: zona.color
                  }"
                >
                  {{ Math.round((zona.count / kpis.total) * 100) }}%
                </div>
              </div>
            </div>

            <!-- Tabla resumen -->
            <div class="mt-6 pt-4 border-t border-gray-100">
              <div class="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600">
                <span class="col-span-1">#</span>
                <span class="col-span-6">Zona</span>
                <span class="col-span-3 text-right">Reportes</span>
                <span class="col-span-2 text-right">% del total</span>
              </div>
              <div class="space-y-1 mt-1">
                <div v-for="(zona, i) in barData" :key="zona.fullLabel"
                  class="grid grid-cols-12 gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors">
                  <span class="col-span-1 text-xs text-gray-400">{{ i + 1 }}</span>
                  <span class="col-span-6 font-medium text-gray-700 truncate" :title="zona.fullLabel">
                    {{ zona.fullLabel }}
                  </span>
                  <span class="col-span-3 text-right font-semibold text-gray-800">{{ zona.count }}</span>
                  <span class="col-span-2 text-right text-xs text-gray-500">
                    {{ kpis.total > 0 ? ((zona.count / kpis.total) * 100).toFixed(1) : '0' }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </template>

  </div>
</template>

<style scoped>
/* Estilos para el mapa */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

:deep(.leaflet-popup-content) {
  margin: 10px 12px;
  font-size: 12px;
}

:deep(.leaflet-control-scale) {
  margin-bottom: 10px;
  margin-left: 10px;
}

/* Estilos para el range input */
input[type="range"] {
  -webkit-appearance: none;
  background: transparent;
}

input[type="range"]:focus {
  outline: none;
}

input[type="range"]::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #f97316;
  margin-top: -6px;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb:hover {
  background: #ea580c;
  transform: scale(1.1);
}
</style>