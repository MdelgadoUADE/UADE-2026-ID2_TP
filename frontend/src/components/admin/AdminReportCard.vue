<script setup>
import { ref, computed } from 'vue'
import {
  MapPin, Clock3, Tags, UserX, Link2,
  ChevronDown, ChevronUp, ShieldAlert
} from 'lucide-vue-next'

const props = defineProps({
  report:    { type: Object,  required: true },
  isRelated: { type: Boolean, default: false },
})

const emit = defineEmits(['patch'])

const expanded = ref(false)

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
const statusColor     = computed(() => STATUS_COLORS[props.report.status]     || 'bg-gray-100 text-gray-500')
const criticidadColor = computed(() => props.report.criticidad ? CRITICIDAD_COLORS[props.report.criticidad] : 'bg-gray-100 text-gray-400')
const validezColor    = computed(() => VALIDEZ_COLORS[props.report.validez]   || 'bg-gray-100 text-gray-400')

const tagEntries = computed(() => Object.entries(props.report.tags || {}))

function formatDate(d) {
  return new Date(d).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ── Patch helpers ─────────────────────────────────────
function patch(field, value) {
  emit('patch', { id: props.report._id, update: { [field]: value } })
}
</script>

<template>
  <div
    :class="[
      'rounded-xl border transition-all',
      isRelated
        ? 'border-indigo-200 bg-indigo-50/40 ml-6 border-l-4 border-l-indigo-400'
        : 'border-gray-200 bg-white shadow-sm'
    ]"
  >
    <!-- ── Header ───────────────────────────────────── -->
    <div class="flex items-start justify-between p-4 gap-3">

      <!-- Left: usuario + dirección + tiempo -->
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-semibold text-gray-800 text-sm">
            {{ report.is_anonymous ? 'Anónimo' : (report.user?.username ?? '—') }}
          </span>
          <span v-if="report.is_anonymous"
            class="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            <UserX class="w-3 h-3" /> anónimo
          </span>
          <span v-if="isRelated"
            class="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
            <Link2 class="w-3 h-3" /> relacionado
          </span>
        </div>

        <div class="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <MapPin class="w-3 h-3 shrink-0" />
          <span class="truncate">{{ report.report_location?.address || 'Sin dirección' }}</span>
        </div>
        <div class="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
          <Clock3 class="w-3 h-3 shrink-0" />
          {{ formatDate(report.timestamp) }}
        </div>
      </div>

      <!-- Right: trust score + badges estado actual -->
      <div class="flex flex-col items-end gap-1.5 shrink-0">
        <div class="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
          <ShieldAlert class="w-3 h-3" />
          {{ report.trust_score ?? '—' }}
        </div>
        <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', statusColor]">
          {{ STATUS_LABELS[report.status] ?? report.status }}
        </span>
        <span v-if="report.criticidad"
          :class="['text-xs px-2 py-0.5 rounded-full font-medium', criticidadColor]">
          {{ report.criticidad }}
        </span>
      </div>
    </div>

    <!-- ── Tags preview ──────────────────────────────── -->
    <div v-if="tagEntries.length" class="px-4 pb-2 flex flex-wrap gap-1.5">
      <span
        v-for="[k, v] in tagEntries.slice(0, expanded ? tagEntries.length : 3)"
        :key="k"
        class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
      >
        {{ k }}: {{ v }}
      </span>
      <button
        v-if="tagEntries.length > 3"
        @click="expanded = !expanded"
        class="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
      >
        <template v-if="!expanded">
          +{{ tagEntries.length - 3 }} más <ChevronDown class="w-3 h-3" />
        </template>
        <template v-else>
          menos <ChevronUp class="w-3 h-3" />
        </template>
      </button>
    </div>

    <!-- ── Notas (expandible) ────────────────────────── -->
    <div v-if="expanded && report.notes" class="px-4 pb-2">
      <p class="text-xs text-gray-500 italic bg-gray-50 rounded p-2">{{ report.notes }}</p>
    </div>

    <!-- ── Controles RF_24 ───────────────────────────── -->
    <div class="px-4 pb-4 pt-1 border-t border-gray-100 mt-1 grid grid-cols-3 gap-2">

      <!-- Estado -->
      <div>
        <label class="text-xs text-gray-400 block mb-1">Estado</label>
        <select
          :value="report.status"
          @change="patch('status', $event.target.value)"
          class="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="active">Activo</option>
          <option value="en_verificacion">En verificación</option>
          <option value="asignado">Asignado</option>
          <option value="resolved">Resuelto</option>
          <option value="archived">Archivado</option>
        </select>
      </div>

      <!-- Criticidad RF_24 -->
      <div>
        <label class="text-xs text-gray-400 block mb-1">Criticidad</label>
        <select
          :value="report.criticidad ?? ''"
          @change="patch('criticidad', $event.target.value || null)"
          class="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">— sin clasificar —</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>

      <!-- Validez RF_24 -->
      <div>
        <label class="text-xs text-gray-400 block mb-1">Validez</label>
        <select
          :value="report.validez ?? 'pendiente'"
          @change="patch('validez', $event.target.value)"
          :class="[
            'w-full text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400',
            validezColor, 'border-gray-200'
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
</template>
