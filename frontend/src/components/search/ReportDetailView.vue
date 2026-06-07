<script setup>
import { computed } from 'vue'
import {
  MapPin,
  Clock3,
  ShieldCheck,
  User,
  FileText
} from 'lucide-vue-next'

import ReportTagList from './ReportTagList.vue'
import ReportAttachmentList from './ReportAttachmentList.vue'

const props = defineProps({
  report: Object
})

function formatDate(date) {
  return new Date(date).toLocaleString()
}

// ── Labels y colores ──────────────────────────────────
const STATUS_LABELS = {
  active:          'Activo',
  en_verificacion: 'En verificación',
  asignado:        'Asignado',
  resolved:        'Resuelto',
  archived:        'Archivado',
}

const STATUS_COLORS = {
  active:          'bg-blue-100   text-blue-700',
  en_verificacion: 'bg-yellow-100 text-yellow-700',
  asignado:        'bg-purple-100 text-purple-700',
  resolved:        'bg-green-100  text-green-700',
  archived:        'bg-gray-100   text-gray-500',
}

const CRITICIDAD_COLORS = {
  baja:    'bg-green-100  text-green-700',
  media:   'bg-yellow-100 text-yellow-700',
  alta:    'bg-orange-100 text-orange-700',
  critica: 'bg-red-100    text-red-700',
}

const VALIDEZ_COLORS = {
  pendiente: 'bg-gray-100   text-gray-500',
  valido:    'bg-green-100  text-green-700',
  falso:     'bg-red-100    text-red-700',
  dudoso:    'bg-yellow-100 text-yellow-700',
}

// ── Computed helpers ──────────────────────────────────
const statusColor     = computed(() => STATUS_COLORS[props.report?.status]     || 'bg-gray-100 text-gray-500')
const criticidadColor = computed(() => props.report?.criticidad ? CRITICIDAD_COLORS[props.report.criticidad] : 'bg-gray-100 text-gray-400')
const validezColor    = computed(() => VALIDEZ_COLORS[props.report?.validez]   || 'bg-gray-100 text-gray-400')

// ── Update report ─────────────────────────────────────
async function updateReportField(field, value) {
  if (!props.report?._id) return
  
  try {
    const response = await fetch(`http://localhost:3000/reports/${props.report._id}/status`, {
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
    if (props.report) {
      props.report[field] = value
    }
    
  } catch (err) {
    console.error('Error updating report:', err)
    alert(`Error al actualizar: ${err.message}`)
  }
}

</script>

<template>

  <div
    v-if="report"
    class="
      bg-white
      rounded-2xl
      shadow-lg
      border
      border-gray-200
      p-8
      space-y-8
    "
  >

    <!-- HEADER -->
    <div class="flex items-start justify-between">

      <div>

        <div class="flex items-center gap-3">

          <div
            class="
              w-12
              h-12
              rounded-xl
              bg-blue-600
              flex
              items-center
              justify-center
            "
          >
            <User class="w-6 h-6 text-white" />
          </div>

          <div>

            <h2 class="text-2xl font-bold text-gray-900">
              {{ report.user.username }}
            </h2>

            <p class="text-gray-500">
              {{ report.user.email }}
            </p>

          </div>

        </div>

      </div>

      <div
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
          statusColor
        ]"
      >
        <ShieldCheck class="w-4 h-4" />

        {{ STATUS_LABELS[report.status] ?? report.status }}
      </div>

    </div>

    <!-- META -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

      <div
        class="
          border
          border-gray-200
          rounded-xl
          p-4
        "
      >

        <div class="flex items-center gap-2 mb-2">

          <MapPin class="w-4 h-4 text-blue-600" />

          <span class="font-medium text-gray-900">
            Ubicación
          </span>

        </div>

        <!-- ADDRESS -->
        <p
            class="
            text-base
            font-medium
            text-gray-900
            leading-relaxed
            "
        >

            {{
            report.report_location?.address ||
            'Dirección no disponible'
            }}

        </p>

        <!-- COORDINATES -->
        <p
            class="
            mt-2
            text-xs
            text-gray-500
            font-mono
            "
        >

            {{
            report.report_location?.coordinates?.join(', ')
            }}

        </p>

      </div>

      <div
        class="
          border
          border-gray-200
          rounded-xl
          p-4
        "
      >

        <div class="flex items-center gap-2 mb-2">

          <Clock3 class="w-4 h-4 text-blue-600" />

          <span class="font-medium text-gray-900">
            Fecha
          </span>

        </div>

        <p class="text-sm text-gray-600">
          {{ formatDate(report.timestamp) }}
        </p>

      </div>

    </div>

    <!-- NOTES -->
    <div>

      <div class="flex items-center gap-2 mb-3">

        <FileText class="w-5 h-5 text-blue-600" />

        <h3 class="text-lg font-semibold text-gray-900">
          Notas
        </h3>

      </div>

      <div
        class="
          border
          border-gray-200
          rounded-xl
          p-5
          bg-gray-50
        "
      >
        <p class="text-gray-700 leading-relaxed">
          {{ report.notes }}
        </p>
      </div>

    </div>

    <!-- TAGS -->
    <ReportTagList
      :tags="report.tags"
    />

    <!-- ATTACHMENTS -->
    <ReportAttachmentList
      :attachments="report.attachments"
    />

    <!-- MANAGEMENT FIELDS -->
    <div class="border-t border-gray-200 pt-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        Gestión del Reporte
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <!-- Estado -->
        <div>
          <label class="text-sm font-medium text-gray-700 block mb-2">
            Estado
          </label>
          <select
            :value="report.status"
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
          <label class="text-sm font-medium text-gray-700 block mb-2">
            Criticidad
          </label>
          <select
            :value="report.criticidad ?? ''"
            @change="updateReportField('criticidad', $event.target.value || null)"
            :class="[
              'w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              criticidadColor
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
          <label class="text-sm font-medium text-gray-700 block mb-2">
            Validez
          </label>
          <select
            :value="report.validez ?? 'pendiente'"
            @change="updateReportField('validez', $event.target.value)"
            :class="[
              'w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              validezColor
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

  <!-- EMPTY -->
  <div
    v-else
    class="
      bg-white
      rounded-2xl
      shadow-lg
      border
      border-gray-200
      p-12
      flex
      flex-col
      items-center
      justify-center
      text-center
    "
  >

    <div
      class="
        w-16
        h-16
        rounded-2xl
        bg-gray-100
        flex
        items-center
        justify-center
        mb-4
      "
    >
      <FileText class="w-8 h-8 text-gray-400" />
    </div>

    <h3 class="text-lg font-semibold text-gray-800">
      Ningún reporte seleccionado
    </h3>

    <p class="text-gray-500 mt-2">
      Seleccioná un reporte para visualizar los detalles
    </p>

  </div>

</template>