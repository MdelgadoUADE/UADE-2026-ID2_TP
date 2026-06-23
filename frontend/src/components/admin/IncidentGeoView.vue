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
const kpis    = computed(() => getKpis())
const barData = computed(() => getBarData())

// ─── RESPONSIVE: panel de filtros colapsable en móvil ────────────────────────
// En desktop el panel siempre está abierto. En móvil el usuario puede
// ocultarlo para ganar espacio de pantalla.
const filtersOpen = ref(true)

// ─── Mapa ────────────────────────────────────────────────────────────────────
const mapContainer = ref(null)
let leafletMap  = null
let heatLayer   = null

const MAP_CENTER = [-34.6037, -58.3816]
const MAP_ZOOM   = 12

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

  if (!heatPoints || heatPoints.length === 0) {
    if (heatLayer) {
      leafletMap.removeLayer(heatLayer)
      heatLayer = null
    }
    return
  }

  const heatData = heatPoints.map(point => [
    point.lat,
    point.lng,
    (point.weight || 0.5) * 1.0
  ])

  if (heatLayer) {
    leafletMap.removeLayer(heatLayer)
  }

  heatLayer = L.heatLayer(heatData, heatmapConfig).addTo(leafletMap)

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

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(leafletMap)

  // Escala
  L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(leafletMap)

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
  critica: { label: 'Crítica',  bg: 'bg-red-100',     text: 'text-red-700'     },
  alta:    { label: 'Alta',     bg: 'bg-orange-100',  text: 'text-orange-700'  },
  media:   { label: 'Media',    bg: 'bg-amber-100',   text: 'text-amber-700'   },
  baja:    { label: 'Baja',     bg: 'bg-emerald-100', text: 'text-emerald-700' },
  '':      { label: 'Todas',    bg: 'bg-gray-100',    text: 'text-gray-600'    },
}

const VENTANAS = [
  { value: 6,   label: 'Últimas 6h'    },
  { value: 12,  label: 'Últimas 12h'   },
  { value: 24,  label: 'Últimas 24h'   },
  { value: 48,  label: 'Últimas 48h'   },
  { value: 168, label: 'Última semana' },
  { value: 720, label: 'Último mes'    },
  { value: 0,   label: 'Sin límite'    },
]

const HEATMAP_LEGEND = [
  { color: '#00B4D8', label: 'Baja'      },
  { color: '#0077B6', label: 'Media-Baja'},
  { color: '#F59E0B', label: 'Media'     },
  { color: '#F97316', label: 'Alta'      },
  { color: '#EF4444', label: 'Muy Alta'  },
]
</script>

<template>
  <div class="space-y-4 sm:space-y-5">

    <!-- ═══════════════════════════════════════════════════════════════════
         PANEL DE FILTROS
         RESPONSIVE: cabecera siempre visible; el cuerpo es colapsable en
         móvil/tablet para no consumir espacio antes de ver el mapa.
         En md+ (≥768px) el cuerpo siempre se muestra (filtersOpen forzado
         por la clase CSS en lugar de v-show, así no parpadea al montar).
    ════════════════════════════════════════════════════════════════════ -->
    <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

      <!-- Cabecera del panel – siempre visible -->
      <div class="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
        <!-- Icono -->
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>

        <!-- Texto -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-800 truncate">Heatmap de Incidentes</p>
          <p class="text-xs text-gray-500 hidden sm:block">Visualización de densidad por ubicación y criticidad</p>
        </div>

        <!--
          RESPONSIVE: botón toggle solo visible en móvil/tablet (md:hidden).
          En desktop el cuerpo siempre está abierto.
          El chevron rota 180° cuando el panel está abierto.
        -->
        <button
          @click="filtersOpen = !filtersOpen"
          class="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
          :aria-label="filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'"
        >
          <svg
            class="w-4 h-4 transition-transform duration-200"
            :class="filtersOpen ? 'rotate-180' : 'rotate-0'"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      </div>

      <!--
        RESPONSIVE: en móvil/tablet el cuerpo se oculta cuando filtersOpen=false.
        En md+ (≥768px) siempre visible via `!block` (clase md:!block).
        Usamos v-show para preservar el DOM y evitar remount de los selects.
      -->
      <div
        v-show="filtersOpen"
        class="md:!block p-4 sm:p-5"
      >
        <!--
          RESPONSIVE: grid de filtros
          - mobile (< 768px):   2 columnas para aprovechar el ancho sin apilar todo
          - md (≥ 768px):       4 columnas, igual que antes
          Los campos individuales siguen siendo col-span-1 salvo el último
          ("Mín. reportes") que en móvil ocupa las 2 columnas para no quedar
          aplastado.
        -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">

          <!-- Criticidad -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 sm:mb-2">
              Criticidad
            </label>
            <select
              v-model="filters.criticidad"
              class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[44px]"
            >
              <option value="">Todas</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          <!-- Ventana temporal -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 sm:mb-2">
              <span class="hidden sm:inline">Ventana temporal</span>
              <span class="sm:hidden">Período</span>
            </label>
            <select
              v-model.number="filters.horasAtras"
              class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[44px]"
            >
              <option v-for="v in VENTANAS" :key="v.value" :value="v.value">{{ v.label }}</option>
            </select>
          </div>

          <!-- Validez -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 sm:mb-2">
              Validez
            </label>
            <select
              v-model="filters.validez"
              class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[44px]"
            >
              <option value="">Todas</option>
              <option value="valido">Válido</option>
              <option value="pendiente">Pendiente</option>
              <option value="dudoso">Dudoso</option>
              <option value="falso">Falso</option>
            </select>
          </div>

          <!--
            RESPONSIVE: "Mín. reportes" ocupa las 2 columnas restantes en
            móvil (col-span-2) para que el input no quede demasiado angosto.
            En md+ vuelve a ser col-span-1.
          -->
          <div class="col-span-2 md:col-span-1">
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 sm:mb-2">
              <span class="hidden sm:inline">Mín. reportes por zona</span>
              <span class="sm:hidden">Mín. reportes</span>
            </label>
            <input
              v-model.number="filters.minReportes"
              type="number" min="1" max="100"
              class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5
                     focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[44px]"
            />
          </div>
        </div>

        <!--
          RESPONSIVE: botones de acción
          - mobile:   cada botón ocupa el ancho completo (w-full sm:w-auto)
          - sm+:      alineados a la derecha en fila, igual que antes
          Altura mínima de 44px garantizada para targets táctiles.
        -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 mt-4">
          <button
            @click="handleReset"
            class="flex items-center justify-center gap-1.5 text-sm border border-gray-200
                   text-gray-600 hover:bg-gray-50 rounded-xl px-4 py-2.5 transition-colors
                   w-full sm:w-auto min-h-[44px]"
          >
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Resetear
          </button>

          <button
            @click="applyFilters"
            :disabled="loading"
            class="flex items-center justify-center gap-2 text-sm font-semibold
                   bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300
                   text-white rounded-xl px-5 py-2.5 transition-colors shadow-sm
                   w-full sm:w-auto min-h-[44px]"
          >
            <svg
              class="w-3.5 h-3.5 shrink-0"
              :class="loading ? 'animate-spin' : ''"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {{ loading ? 'Cargando...' : 'Aplicar filtros' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error (solo errores reales, no de datos vacíos) -->
    <div
      v-if="error && error !== 'Sin datos para mostrar'"
      class="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4"
    >
      <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         KPIs
         RESPONSIVE:
         - mobile: 2 columnas (misma cantidad, cards más compactas)
         - md+:    4 columnas — igual que antes
         - Textos: text-xl sm:text-2xl para evitar overflow en 320px
    ════════════════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">

      <div class="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 shadow-sm">
        <p class="text-xs text-gray-500 uppercase leading-tight">Total Reportes</p>
        <p class="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{{ kpis.total }}</p>
      </div>

      <div class="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 shadow-sm">
        <p class="text-xs text-gray-500 uppercase leading-tight">Alta / Crítica</p>
        <p class="text-xl sm:text-2xl font-bold text-red-600 mt-1">{{ kpis.criticos }}</p>
        <p class="text-xs text-gray-400 truncate">{{ kpis.pctCriticos }}</p>
      </div>

      <div class="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 shadow-sm">
        <p class="text-xs text-gray-500 uppercase leading-tight">Zona más activa</p>
        <p
          class="text-sm sm:text-lg font-bold text-gray-800 mt-1 truncate"
          :title="kpis.zonaTop"
        >{{ kpis.zonaTop }}</p>
        <p class="text-xs text-gray-400">{{ kpis.zonaTopCount }} reportes</p>
      </div>

      <div class="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 shadow-sm">
        <p class="text-xs text-gray-500 uppercase leading-tight">Ventana</p>
        <p class="text-xs sm:text-sm font-bold text-gray-800 mt-1 leading-snug">
          {{ VENTANAS.find(v => v.value === filters.horasAtras)?.label || 'Sin límite' }}
        </p>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         MAPA HEATMAP
         RESPONSIVE:
         - El contenedor del mapa cambia de altura según viewport:
             · mobile (< 640px):  300px  — uso eficiente en pantallas pequeñas
             · sm (640-767px):    380px  — tablets en portrait
             · md+ (≥ 768px):    500px  — desktop (idéntico al original)
         - position: relative en el wrapper padre para que el overlay de
           carga se posicione correctamente en todos los breakpoints.
         - La leyenda del heatmap pasa de `hidden md:flex` a ser siempre
           visible pero reorganizada: en mobile aparece debajo del header
           del panel en lugar de en línea.
    ════════════════════════════════════════════════════════════════════ -->
    <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

      <!-- Cabecera del mapa -->
      <div class="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-800">Heatmap de Densidad de Incidentes</p>
            <p class="text-xs text-gray-500">Mayor intensidad = más incidentes cerca</p>
          </div>
        </div>

        <!--
          RESPONSIVE: leyenda siempre visible.
          - En mobile se muestra en una fila con scroll horizontal si hace falta,
            usando `overflow-x-auto` y `pb-1` para ver la scrollbar.
          - En md+ queda en línea igual que antes pero sin `hidden`.
        -->
        <div class="mt-2 flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 text-xs">
          <span class="text-gray-500 shrink-0">Densidad:</span>
          <div
            v-for="step in HEATMAP_LEGEND"
            :key="step.label"
            class="flex items-center gap-1 shrink-0"
          >
            <span
              class="inline-block w-3 h-3 rounded-full"
              :style="{ background: step.color }"
            />
            <span class="text-gray-500">{{ step.label }}</span>
          </div>
        </div>
      </div>

      <!--
        RESPONSIVE: contenedor del mapa con height adaptable por breakpoint.
        Usamos la clase utilitaria inline de Tailwind a través de style para
        respetar los breakpoints sin añadir CSS externo.
        `position: relative` es necesario para el loading overlay.
      -->
      <div class="relative w-full">
        <div
          ref="mapContainer"
          class="w-full geo-map-container"
          style="background: #f8fafc"
        ></div>

        <!-- Loading overlay
             RESPONSIVE: el overlay usa `absolute inset-0` correctamente porque
             el padre ahora tiene `position: relative`.
        -->
        <div
          v-if="loading"
          class="absolute inset-0 bg-white/70 flex items-center justify-center"
        >
          <div class="flex items-center gap-2 bg-white px-5 py-3 rounded-full shadow-lg">
            <div class="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm text-gray-600">Cargando incidentes...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         TOP ZONAS
         RESPONSIVE:
         - El contenedor de las barras tiene `overflow-x-hidden` para evitar
           que las barras rompan el layout en pantallas angostas.
         - El label de la zona usa `break-words` para evitar overflow de texto.
         - Las barras ya usan width en % por lo que escalan nativamente.
    ════════════════════════════════════════════════════════════════════ -->
    <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div class="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
        <p class="text-sm font-semibold text-gray-800">Top Zonas por Incidentes</p>
        <p class="text-xs text-gray-500">
          Mínimo {{ filters.minReportes }} reporte{{ filters.minReportes !== 1 ? 's' : '' }} por zona
        </p>
      </div>

      <div class="p-4 sm:p-5 overflow-x-hidden">
        <div v-if="!barData.length" class="text-center py-8 text-gray-400">
          Sin zonas con {{ filters.minReportes }}+ reportes
        </div>

        <div v-else class="space-y-3 sm:space-y-4">
          <div v-for="zona in barData" :key="zona.fullLabel" class="space-y-1">
            <div class="flex justify-between items-baseline gap-2 text-sm">
              <!--
                RESPONSIVE: el label usa `break-words` para que nombres largos
                de zona no desborden el contenedor en pantallas angostas.
              -->
              <span
                class="font-medium text-gray-700 break-words min-w-0 flex-1"
                :title="zona.fullLabel"
              >{{ zona.fullLabel }}</span>
              <span class="text-gray-500 font-mono shrink-0 text-xs sm:text-sm">{{ zona.count }}</span>
            </div>

            <div class="w-full bg-gray-100 rounded-full h-6 sm:h-7 overflow-hidden">
              <div
                class="h-full rounded-full flex items-center justify-end px-2 sm:px-3
                       text-xs text-white font-semibold transition-all duration-500"
                :style="{
                  width: `${(zona.count / barData[0].count) * 100}%`,
                  backgroundColor: zona.color
                }"
              >
                <span v-if="(zona.count / barData[0].count) > 0.15">
                  {{ Math.round((zona.count / kpis.total) * 100) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<!--
  RESPONSIVE: estilos con scoped para la altura del mapa.
  Se usan media queries nativas en lugar de clases Tailwind inline
  porque Tailwind no permite valores arbitrarios en `height` con
  breakpoints condicionales sin purge config personalizada.
  
  Breakpoints:
    mobile   (< 640px):  300px
    sm       (640-767px): 380px
    md+      (≥ 768px):  500px  ← idéntico al original
-->
<style scoped>
.geo-map-container {
  height: 300px;
  min-height: 300px;
}

@media (min-width: 640px) {
  .geo-map-container {
    height: 380px;
    min-height: 380px;
  }
}

@media (min-width: 768px) {
  .geo-map-container {
    height: 500px;
    min-height: 500px;
  }
}
</style>