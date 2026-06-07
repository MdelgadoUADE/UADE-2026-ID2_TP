<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Search, X, MapPin, Clock3, Tag, ShieldCheck,
  FileText, User, Copy, Check,
  ShieldAlert, Paperclip, Tags,
  Hash
} from 'lucide-vue-next'

// ─── State ───────────────────────────────────────────────────────────────────
const reports        = ref([])
const loading        = ref(false)
const error          = ref(null)
const searchQuery    = ref('')
const selectedReport = ref(null)
const copiedId       = ref(false)
const statusFilter   = ref('active')   // ← pre-seteado en "activo"
const totalCount     = ref(0)
let searchTimeout    = null

// ─── Fetch reports with search ────────────────────────────────────────────────
async function fetchReports() {
  loading.value = true
  error.value   = null
  try {
    const params = new URLSearchParams()
    
    // Agregar filtro de estado
    if (statusFilter.value) {
      params.append('status', statusFilter.value)
    }
    
    // Agregar búsqueda de texto
    if (searchQuery.value.trim()) {
      params.append('q', searchQuery.value.trim())
    }
    
    // Sin límite para búsqueda, pero con límite razonable
    params.append('limit', '500')
    
    const res  = await fetch(`http://localhost:3000/reports/search?${params}`)
    if (!res.ok) throw new Error('Error obteniendo reportes')
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    reports.value = data.reports
    totalCount.value = data.total
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(fetchReports)

// ─── Watch para búsqueda con debounce ─────────────────────────────────────────
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchReports()
  }, 300) // 300ms de debounce
})

// ─── Watch para cambio de estado ──────────────────────────────────────────────
watch(statusFilter, () => {
  fetchReports()
})

// ─── Lista activa (ahora solo muestra lo que viene del backend) ───────────────
const activeList = computed(() => reports.value)

const activeLoading = computed(() => loading.value)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  return new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

function tagCount(tags) {
  return Object.keys(tags || {}).length
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
  const m = {
    active:          'bg-red-100 text-red-700',
    resolved:        'bg-green-100 text-green-700',
    archived:        'bg-gray-100 text-gray-600',
    en_verificacion: 'bg-yellow-100 text-yellow-700',
    asignado:        'bg-blue-100 text-blue-700',
  }
  return m[s] || 'bg-gray-100 text-gray-600'
}

function criticidadColor(c) {
  const m = {
    critica: 'bg-red-600 text-white',
    alta:    'bg-orange-100 text-orange-700',
    media:   'bg-yellow-100 text-yellow-700',
    baja:    'bg-green-100 text-green-700',
  }
  return m[c] || ''
}

function validezColor(v) {
  const m = {
    pendiente: 'bg-gray-100 text-gray-500',
    valido:    'bg-green-100 text-green-700',
    falso:     'bg-red-100 text-red-700',
    dudoso:    'bg-yellow-100 text-yellow-700',
  }
  return m[v] || 'bg-gray-100 text-gray-500'
}

function selectReport(report) {
  selectedReport.value = report
}

async function copyId(id) {
  try {
    await navigator.clipboard.writeText(id)
    copiedId.value = true
    setTimeout(() => { copiedId.value = false }, 1500)
  } catch {
    copiedId.value = true
    setTimeout(() => { copiedId.value = false }, 1500)
  }
}

// ─── Update report field ──────────────────────────────────────────────────────
async function updateReportField(field, value) {
  if (!selectedReport.value?._id) return
  
  try {
    const response = await fetch(`http://localhost:3000/reports/${selectedReport.value._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value })
    })
    
    if (!response.ok) {
      throw new Error('Error al actualizar el reporte')
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Error al actualizar')
    }
    
    // Update local report object
    if (selectedReport.value) {
      selectedReport.value[field] = value
    }
    
    // Also update in the reports list
    const reportIndex = reports.value.findIndex(r => r._id === selectedReport.value._id)
    if (reportIndex !== -1) {
      reports.value[reportIndex][field] = value
    }
    
  } catch (err) {
    console.error('Error updating report:', err)
    alert(`Error al actualizar: ${err.message}`)
  }
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 h-full">

    <!-- ══════════════════════════════════════════════
         COLUMNA IZQUIERDA — Lista + buscador
    ═══════════════════════════════════════════════ -->
    <div class="lg:col-span-1 flex flex-col gap-3">

      <!-- Buscador -->
      <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por usuario, ID, dirección, tag, notas..."
            class="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          />
          <button v-if="searchQuery" @click="searchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Filtro de estado -->
        <div class="mt-2.5">
          <label class="text-xs text-gray-500 block mb-1.5">Filtrar por estado</label>
          <select
            v-model="statusFilter"
            class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          >
            <option value="active">Activo</option>
            <option value="en_verificacion">En verificación</option>
            <option value="asignado">Asignado</option>
            <option value="resolved">Resuelto</option>
            <option value="archived">Archivado</option>
            <option value="">Todos los estados</option>
          </select>
        </div>

        <div class="mt-2 flex items-center justify-between">
          <span class="text-xs text-gray-400">
            {{ activeList.length }} de {{ totalCount }} reporte{{ totalCount !== 1 ? 's' : '' }}
          </span>
          <span v-if="searchQuery.trim()" class="text-xs text-blue-600 font-medium">
            Buscando...
          </span>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error"
        class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
        {{ error }}
      </div>

      <!-- Lista de reportes -->
      <div v-if="activeLoading" class="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
        <div class="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        Cargando...
      </div>

      <div v-else class="space-y-2 overflow-y-auto" style="max-height: calc(100vh - 280px)">
        <button
          v-for="report in activeList"
          :key="report._id"
          @click="selectReport(report)"
          :class="[
            'w-full text-left border rounded-xl p-3 transition-all group',
            selectedReport?._id === report._id
              ? 'border-blue-400 bg-blue-50 shadow-sm'
              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
          ]"
        >
          <!-- Top row -->
          <div class="flex items-start justify-between gap-2">
            <span :class="[
              'text-sm font-semibold truncate',
              selectedReport?._id === report._id ? 'text-blue-800' : 'text-gray-800'
            ]">
              {{ report.user?.username || 'Anónimo' }}
            </span>
            <span :class="['text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0', statusColor(report.status)]">
              {{ report.status }}
            </span>
          </div>

          <!-- ID — siempre visible -->
          <p class="text-xs font-mono text-gray-400 mt-0.5 truncate">{{ report._id }}</p>

          <!-- Address -->
          <div class="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
            <MapPin class="w-3 h-3 shrink-0 text-gray-400" />
            <span class="truncate">{{ report.report_location?.address || '—' }}</span>
          </div>

          <!-- Meta row -->
          <div class="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
            <span class="flex items-center gap-1">
              <Clock3 class="w-3 h-3" />
              {{ formatDate(report.timestamp) }}
            </span>
            <span class="flex items-center gap-1">
              <Tag class="w-3 h-3" />
              {{ tagCount(report.tags) }}
            </span>
            <span v-if="report.criticidad"
              :class="['ml-auto px-1.5 py-0.5 rounded text-xs font-medium', criticidadColor(report.criticidad)]">
              {{ report.criticidad }}
            </span>
          </div>
        </button>

        <p v-if="!activeLoading && !activeList.length" class="text-center text-sm text-gray-400 py-8">
          Sin resultados
        </p>
      </div>

    </div>

    <!-- ══════════════════════════════════════════════
         COLUMNA DERECHA — Detalle del reporte
    ═══════════════════════════════════════════════ -->
    <div class="lg:col-span-2">

      <!-- Estado vacío -->
      <div v-if="!selectedReport"
        class="bg-white border border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <FileText class="w-8 h-8 text-gray-300" />
        </div>
        <p class="text-base font-semibold text-gray-600">Ningún reporte seleccionado</p>
        <p class="text-sm text-gray-400 mt-1">Elegí un reporte de la lista para ver su detalle</p>
      </div>

      <!-- Detalle -->
      <div v-else class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        <!-- ── Header con ID siempre visible ── -->
        <div class="border-b border-gray-100 px-6 py-4">
          <div class="flex items-start justify-between gap-4">

            <!-- Usuario + ID -->
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <User class="w-5 h-5 text-white" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-lg font-bold text-gray-900">
                    {{ selectedReport.user?.username || 'Anónimo' }}
                  </h2>
                  <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', statusColor(selectedReport.status)]">
                    {{ selectedReport.status }}
                  </span>
                  <span v-if="selectedReport.criticidad"
                    :class="['text-xs px-2 py-0.5 rounded-full font-medium', criticidadColor(selectedReport.criticidad)]">
                    {{ selectedReport.criticidad }}
                  </span>
                  <span v-if="selectedReport.is_anonymous"
                    class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                    Anónimo
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-0.5">{{ selectedReport.user?.email || '—' }}</p>
              </div>
            </div>


          </div>

          <!-- ID del reporte — siempre visible, con botón de copiar -->
          <div class="mt-3 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Hash class="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span class="text-xs font-mono text-gray-600 flex-1 select-all break-all">
              {{ selectedReport._id }}
            </span>
            <button
              @click="copyId(selectedReport._id)"
              :class="[
                'flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all shrink-0',
                copiedId
                  ? 'bg-green-100 text-green-600'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
              ]"
            >
              <Check v-if="copiedId" class="w-3 h-3" />
              <Copy v-else class="w-3 h-3" />
              {{ copiedId ? 'Copiado' : 'Copiar' }}
            </button>
          </div>
        </div>

        <!-- ── Cuerpo del detalle ── -->
        <div class="p-6 space-y-5">

          <!-- Ubicación + Fecha -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="border border-gray-200 rounded-xl p-4">
              <div class="flex items-center gap-2 mb-2">
                <MapPin class="w-4 h-4 text-blue-600" />
                <span class="text-sm font-semibold text-gray-700">Ubicación</span>
              </div>
              <p class="text-sm text-gray-800 leading-relaxed">
                {{ selectedReport.report_location?.address || 'Dirección no disponible' }}
              </p>
              <p class="text-xs font-mono text-gray-400 mt-1">
                {{ selectedReport.report_location?.coordinates?.join(', ') }}
              </p>
            </div>

            <div class="border border-gray-200 rounded-xl p-4">
              <div class="flex items-center gap-2 mb-2">
                <Clock3 class="w-4 h-4 text-blue-600" />
                <span class="text-sm font-semibold text-gray-700">Fecha y hora</span>
              </div>
              <p class="text-sm text-gray-800">{{ new Date(selectedReport.timestamp).toLocaleString('es-AR') }}</p>
              <div class="mt-2 flex items-center gap-2">
                <ShieldAlert class="w-3.5 h-3.5 text-gray-400" />
                <span class="text-xs text-gray-500">Trust score:
                  <span class="font-mono font-semibold text-gray-700">{{ selectedReport.trust_score?.toFixed(2) ?? '—' }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Notas -->
          <div v-if="selectedReport.notes">
            <div class="flex items-center gap-2 mb-2">
              <FileText class="w-4 h-4 text-blue-600" />
              <span class="text-sm font-semibold text-gray-700">Notas</span>
            </div>
            <div class="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <p class="text-sm text-gray-700 leading-relaxed">{{ selectedReport.notes }}</p>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="tagEntries(selectedReport.tags).length">
            <div class="flex items-center gap-2 mb-2">
              <Tags class="w-4 h-4 text-blue-600" />
              <span class="text-sm font-semibold text-gray-700">Tags</span>
              <span class="text-xs text-gray-400">({{ tagEntries(selectedReport.tags).length }})</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="[k, v] in tagEntries(selectedReport.tags)"
                :key="k"
                class="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5"
              >
                <span class="text-xs font-semibold text-blue-700">{{ k }}</span>
                <span v-if="v !== null" class="text-xs text-blue-500">→ {{ v }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-gray-400 italic">Sin tags registrados.</div>

          <!-- Attachments -->
          <div v-if="selectedReport.attachments?.length">
            <div class="flex items-center gap-2 mb-2">
              <Paperclip class="w-4 h-4 text-blue-600" />
              <span class="text-sm font-semibold text-gray-700">Adjuntos</span>
            </div>
            <div class="space-y-1.5">
              <div v-for="att in selectedReport.attachments" :key="att"
                class="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                <span class="text-xs font-mono text-gray-600">{{ att }}</span>
                <button class="text-xs text-blue-600 hover:text-blue-800 font-medium">Ver</button>
              </div>
            </div>
          </div>

          <!-- MANAGEMENT FIELDS -->
          <div class="border-t border-gray-200 pt-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">
              Gestión del Reporte
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              <!-- Estado -->
              <div>
                <label class="text-xs font-medium text-gray-600 block mb-1.5">
                  Estado
                </label>
                <select
                  :value="selectedReport.status"
                  @change="updateReportField('status', $event.target.value)"
                  class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Activo</option>
                  <option value="en_verificacion">En verificación</option>
                  <option value="asignado">Asignado</option>
                  <option value="resolved">Resuelto</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>

              <!-- Criticidad -->
              <div>
                <label class="text-xs font-medium text-gray-600 block mb-1.5">
                  Criticidad
                </label>
                <select
                  :value="selectedReport.criticidad ?? ''"
                  @change="updateReportField('criticidad', $event.target.value || null)"
                  :class="[
                    'w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    criticidadColor(selectedReport.criticidad)
                  ]"
                >
                  <option value="">— sin clasificar —</option>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>

              <!-- Validez -->
              <div>
                <label class="text-xs font-medium text-gray-600 block mb-1.5">
                  Validez
                </label>
                <select
                  :value="selectedReport.validez ?? 'pendiente'"
                  @change="updateReportField('validez', $event.target.value)"
                  :class="[
                    'w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    validezColor(selectedReport.validez)
                  ]"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="valido">Válido</option>
                  <option value="falso">Falso</option>
                  <option value="dudoso">Dudoso</option>
                </select>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>
