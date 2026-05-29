<script setup>
import { ref } from 'vue'
import { X, CheckCircle, XCircle, AlertTriangle, Copy } from 'lucide-vue-next'

const props = defineProps({
  report: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'validate'])

const formData = ref({
  validity: 'valid',
  criticality: props.report.criticality || 'medium',
  status: 'pending',
  analyst_notes: ''
})

const validityOptions = [
  { value: 'valid', label: 'Válido', icon: CheckCircle, color: 'green' },
  { value: 'invalid', label: 'Inválido', icon: XCircle, color: 'red' },
  { value: 'duplicate', label: 'Duplicado', icon: Copy, color: 'yellow' }
]

const criticalityOptions = [
  { value: 'low', label: 'Baja', color: 'blue' },
  { value: 'medium', label: 'Media', color: 'yellow' },
  { value: 'high', label: 'Alta', color: 'orange' },
  { value: 'critical', label: 'Crítica', color: 'red' }
]

const statusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'rejected', label: 'Rechazado' }
]

function handleSubmit() {
  if (!formData.value.analyst_notes.trim()) {
    alert('Por favor ingrese notas del analista')
    return
  }

  emit('validate', formData.value)
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <h2 class="text-2xl font-bold text-gray-900">Validar Reporte</h2>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Report Info -->
      <div class="p-6 bg-gray-50 border-b">
        <h3 class="font-semibold text-gray-900 mb-2">{{ report.title }}</h3>
        <p class="text-sm text-gray-600 mb-3">{{ report.description }}</p>
        
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Usuario:</span>
            <span class="ml-2 font-medium">{{ report.user.username }}</span>
          </div>
          <div>
            <span class="text-gray-500">Trust Score:</span>
            <span class="ml-2 font-medium">{{ report.trust_score.toFixed(2) }}</span>
          </div>
          <div>
            <span class="text-gray-500">Ubicación:</span>
            <span class="ml-2 font-medium">{{ report.location.address || 'Sin dirección' }}</span>
          </div>
          <div>
            <span class="text-gray-500">Fecha:</span>
            <span class="ml-2 font-medium">
              {{ new Date(report.timestamp).toLocaleDateString('es-AR') }}
            </span>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="report.tags && report.tags.length > 0" class="mt-3">
          <span class="text-sm text-gray-500">Tags:</span>
          <div class="flex flex-wrap gap-2 mt-1">
            <span
              v-for="tag in report.tags"
              :key="tag"
              class="px-2 py-1 bg-white text-gray-700 rounded text-xs border"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        
        <!-- Validity -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Validez del Reporte
          </label>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="option in validityOptions"
              :key="option.value"
              type="button"
              @click="formData.validity = option.value"
              :class="[
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                formData.validity === option.value
                  ? `border-${option.color}-600 bg-${option.color}-50`
                  : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <component
                :is="option.icon"
                :class="[
                  'w-6 h-6',
                  formData.validity === option.value
                    ? `text-${option.color}-600`
                    : 'text-gray-400'
                ]"
              />
              <span
                :class="[
                  'text-sm font-medium',
                  formData.validity === option.value
                    ? `text-${option.color}-900`
                    : 'text-gray-600'
                ]"
              >
                {{ option.label }}
              </span>
            </button>
          </div>
        </div>

        <!-- Criticality -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Nivel de Criticidad
          </label>
          <div class="grid grid-cols-4 gap-3">
            <button
              v-for="option in criticalityOptions"
              :key="option.value"
              type="button"
              @click="formData.criticality = option.value"
              :class="[
                'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                formData.criticality === option.value
                  ? `border-${option.color}-600 bg-${option.color}-50`
                  : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <AlertTriangle
                :class="[
                  'w-5 h-5',
                  formData.criticality === option.value
                    ? `text-${option.color}-600`
                    : 'text-gray-400'
                ]"
              />
              <span
                :class="[
                  'text-xs font-medium',
                  formData.criticality === option.value
                    ? `text-${option.color}-900`
                    : 'text-gray-600'
                ]"
              >
                {{ option.label }}
              </span>
            </button>
          </div>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Estado del Reporte
          </label>
          <select
            v-model="formData.status"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <!-- Analyst Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Notas del Analista *
          </label>
          <textarea
            v-model="formData.analyst_notes"
            rows="4"
            placeholder="Ingrese observaciones, acciones tomadas, o justificación de la clasificación..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            Estas notas serán visibles para otros analistas
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4 border-t">
          <button
            type="button"
            @click="handleClose"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Guardar Validación
          </button>
        </div>
      </form>

    </div>
  </div>
</template>

<style scoped>
/* Fix for dynamic color classes */
.border-green-600 { border-color: rgb(22 163 74); }
.bg-green-50 { background-color: rgb(240 253 244); }
.text-green-600 { color: rgb(22 163 74); }
.text-green-900 { color: rgb(20 83 45); }

.border-red-600 { border-color: rgb(220 38 38); }
.bg-red-50 { background-color: rgb(254 242 242); }
.text-red-600 { color: rgb(220 38 38); }
.text-red-900 { color: rgb(127 29 29); }

.border-yellow-600 { border-color: rgb(202 138 4); }
.bg-yellow-50 { background-color: rgb(254 252 232); }
.text-yellow-600 { color: rgb(202 138 4); }
.text-yellow-900 { color: rgb(113 63 18); }

.border-blue-600 { border-color: rgb(37 99 235); }
.bg-blue-50 { background-color: rgb(239 246 255); }
.text-blue-600 { color: rgb(37 99 235); }
.text-blue-900 { color: rgb(30 58 138); }

.border-orange-600 { border-color: rgb(234 88 12); }
.bg-orange-50 { background-color: rgb(255 247 237); }
.text-orange-600 { color: rgb(234 88 12); }
.text-orange-900 { color: rgb(124 45 18); }
</style>