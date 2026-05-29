<script setup>
import { ref, onMounted } from 'vue'
import { Clock, MapPin, Tag, User, Star, AlertTriangle, CheckCircle, XCircle, Copy } from 'lucide-vue-next'
import ValidateReportModal from './ValidateReportModal.vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['report-validated'])

const reports = ref([])
const loading = ref(false)
const error = ref(null)
const selectedReport = ref(null)
const showValidateModal = ref(false)

const criticalityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

async function fetchPendingReports() {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('http://localhost:3000/analytics/reports/pending', {
      headers: {
        'x-user-id': props.user.user_id,
        'x-user-role': props.user.role,
        'x-user-name': props.user.username
      }
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'Error fetching pending reports')
    }

    reports.value = data.reports
  } catch (err) {
    console.error('Error fetching pending reports:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function openValidateModal(report) {
  selectedReport.value = report
  showValidateModal.value = true
}

function closeValidateModal() {
  showValidateModal.value = false
  selectedReport.value = null
}

async function handleValidation(validationData) {
  try {
    const response = await fetch(
      `http://localhost:3000/analytics/reports/${selectedReport.value._id}/validate`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': props.user.user_id,
          'x-user-role': props.user.role,
          'x-user-name': props.user.username
        },
        body: JSON.stringify(validationData)
      }
    )

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'Error validating report')
    }

    // Refresh list
    await fetchPendingReports()
    
    // Notify parent
    emit('report-validated')
    
    // Close modal
    closeValidateModal()
    
    alert('Reporte validado exitosamente')
  } catch (err) {
    console.error('Error validating report:', err)
    alert('Error al validar reporte: ' + err.message)
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getTrustScoreColor(score) {
  if (score >= 0.7) return 'text-green-600'
  if (score >= 0.4) return 'text-yellow-600'
  return 'text-red-600'
}

onMounted(() => {
  fetchPendingReports()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Reportes Pendientes de Validación</h2>
        <p class="text-gray-600 mt-1">{{ reports.length }} reportes esperando revisión</p>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4"
    >
      <p class="font-semibold">Error</p>
      <p class="text-sm">{{ error }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <Clock class="w-8 h-8 animate-spin mx-auto text-blue-600" />
      <p class="text-gray-600 mt-2">Cargando reportes...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="reports.length === 0"
      class="text-center py-12 bg-gray-50 rounded-lg border border-gray-200"
    >
      <CheckCircle class="w-12 h-12 mx-auto text-green-600 mb-3" />
      <p class="text-gray-900 font-semibold">No hay reportes pendientes</p>
      <p class="text-gray-600 text-sm mt-1">Todos los reportes han sido revisados</p>
    </div>

    <!-- Reports List -->
    <div v-else class="space-y-4">
      <div
        v-for="report in reports"
        :key="report._id"
        class="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-semibold text-gray-900">{{ report.title }}</h3>
              <span
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  criticalityColors[report.criticality]
                ]"
              >
                {{ report.criticality }}
              </span>
            </div>
            
            <p class="text-gray-600 text-sm mb-3">{{ report.description }}</p>

            <div class="flex flex-wrap gap-4 text-sm text-gray-600">
              <div class="flex items-center gap-1">
                <Clock class="w-4 h-4" />
                {{ formatDate(report.timestamp) }}
              </div>
              
              <div class="flex items-center gap-1">
                <MapPin class="w-4 h-4" />
                {{ report.location.address || 'Sin dirección' }}
              </div>

              <div class="flex items-center gap-1">
                <User class="w-4 h-4" />
                {{ report.user.username }}
              </div>

              <div class="flex items-center gap-1">
                <Star class="w-4 h-4" />
                <span :class="getTrustScoreColor(report.trust_score)">
                  {{ report.trust_score.toFixed(2) }}
                </span>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="report.tags && report.tags.length > 0" class="flex flex-wrap gap-2 mt-3">
              <span
                v-for="tag in report.tags"
                :key="tag"
                class="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                <Tag class="w-3 h-3" />
                {{ tag }}
              </span>
            </div>

            <!-- Related Reports -->
            <div
              v-if="report.related_reports && report.related_reports.length > 0"
              class="mt-3 flex items-center gap-2 text-sm text-purple-600"
            >
              <Copy class="w-4 h-4" />
              <span>{{ report.related_reports.length }} reportes relacionados</span>
            </div>
          </div>

          <button
            @click="openValidateModal(report)"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-4"
          >
            <CheckCircle class="w-4 h-4" />
            Validar
          </button>
        </div>

        <!-- Coordinates -->
        <div class="text-xs text-gray-500 mt-2">
          Coordenadas: {{ report.location.coordinates[1].toFixed(6) }}, {{ report.location.coordinates[0].toFixed(6) }}
        </div>
      </div>
    </div>

    <!-- Validate Modal -->
    <ValidateReportModal
      v-if="showValidateModal && selectedReport"
      :report="selectedReport"
      @close="closeValidateModal"
      @validate="handleValidation"
    />
  </div>
</template>