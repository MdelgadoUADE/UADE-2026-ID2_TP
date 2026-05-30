<script setup>
import { ref, onMounted } from 'vue'
import { Users, MapPin, Tag, Clock, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const clusters = ref([])
const loading = ref(false)
const error = ref(null)
const expandedClusters = ref(new Set())

const criticalityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

async function fetchClusters() {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('http://localhost:3000/analytics/reports/clusters', {
      headers: {
        'x-user-id': props.user.user_id,
        'x-user-role': props.user.role,
        'x-user-name': props.user.username
      }
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'Error fetching clusters')
    }

    clusters.value = data.clusters
  } catch (err) {
    console.error('Error fetching clusters:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function toggleCluster(clusterId) {
  if (expandedClusters.value.has(clusterId)) {
    expandedClusters.value.delete(clusterId)
  } else {
    expandedClusters.value.add(clusterId)
  }
}

function isExpanded(clusterId) {
  return expandedClusters.value.has(clusterId)
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

function getClusterSeverity(cluster) {
  const criticalCount = cluster.reports.filter(r => r.criticality === 'critical').length
  const highCount = cluster.reports.filter(r => r.criticality === 'high').length
  
  if (criticalCount > 0) return 'critical'
  if (highCount > 0) return 'high'
  if (cluster.reports.length >= 5) return 'medium'
  return 'low'
}

function getClusterSeverityLabel(severity) {
  const labels = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo'
  }
  return labels[severity] || 'Desconocido'
}

function getReportLocation(report) {
  return report?.report_location || {}
}

function getReportCoordinates(report) {
  return report?.report_location?.coordinates || []
}

function getReportTags(report) {
  if (!report?.tags) return []
  return Array.isArray(report.tags) ? report.tags : Object.keys(report.tags)
}

function getClusterId(cluster) {
  return cluster?.cluster_id || cluster?._id
}

function getAverageLocation(cluster) {
  if (!cluster.reports || cluster.reports.length === 0) return null

  const reportsWithCoordinates = cluster.reports.filter(report => getReportCoordinates(report).length >= 2)
  if (reportsWithCoordinates.length === 0) return null
  
  const avgLat = reportsWithCoordinates.reduce((sum, r) => sum + getReportCoordinates(r)[1], 0) / reportsWithCoordinates.length
  const avgLng = reportsWithCoordinates.reduce((sum, r) => sum + getReportCoordinates(r)[0], 0) / reportsWithCoordinates.length
  
  return { lat: avgLat.toFixed(6), lng: avgLng.toFixed(6) }
}

onMounted(() => {
  fetchClusters()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Clusters de Reportes Relacionados</h2>
        <p class="text-gray-600 mt-1">{{ clusters.length }} grupos de reportes identificados</p>
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
      <TrendingUp class="w-8 h-8 animate-spin mx-auto text-blue-600" />
      <p class="text-gray-600 mt-2">Cargando clusters...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="clusters.length === 0"
      class="text-center py-12 bg-gray-50 rounded-lg border border-gray-200"
    >
      <Users class="w-12 h-12 mx-auto text-gray-400 mb-3" />
      <p class="text-gray-900 font-semibold">No hay clusters identificados</p>
      <p class="text-gray-600 text-sm mt-1">Ejecute el algoritmo de clustering para agrupar reportes relacionados</p>
    </div>

    <!-- Clusters List -->
    <div v-else class="space-y-4">
      <div
        v-for="cluster in clusters"
        :key="getClusterId(cluster)"
        class="bg-white rounded-lg border shadow-sm overflow-hidden"
      >
        <!-- Cluster Header -->
        <div
          @click="toggleCluster(getClusterId(cluster))"
          class="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900">
                  Cluster #{{ getClusterId(cluster) }}
                </h3>
                <span
                  :class="[
                    'px-2 py-1 rounded-full text-xs font-medium',
                    criticalityColors[getClusterSeverity(cluster)]
                  ]"
                >
                  {{ getClusterSeverityLabel(getClusterSeverity(cluster)) }}
                </span>
                <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  {{ cluster.reports.length }} reportes
                </span>
              </div>

              <div class="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                <div class="flex items-center gap-1">
                  <MapPin class="w-4 h-4" />
                  {{ getReportLocation(cluster.reports[0]).address || 'Sin dirección' }}
                </div>
                
                <div class="flex items-center gap-1">
                  <Clock class="w-4 h-4" />
                  {{ formatDate(cluster.reports[0]?.timestamp) }}
                </div>
              </div>

              <!-- Common Tags -->
              <div v-if="cluster.common_tags && cluster.common_tags.length > 0" class="flex flex-wrap gap-2">
                <span
                  v-for="tag in cluster.common_tags"
                  :key="tag"
                  class="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                >
                  <Tag class="w-3 h-3" />
                  {{ tag }}
                </span>
              </div>

              <!-- Average Location -->
              <div v-if="getAverageLocation(cluster)" class="text-xs text-gray-500 mt-2">
                Centro aproximado: {{ getAverageLocation(cluster).lat }}, {{ getAverageLocation(cluster).lng }}
              </div>
            </div>

            <button class="text-gray-400 hover:text-gray-600 transition-colors ml-4">
              <ChevronDown v-if="!isExpanded(getClusterId(cluster))" class="w-5 h-5" />
              <ChevronUp v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Cluster Reports (Expanded) -->
        <div
          v-if="isExpanded(getClusterId(cluster))"
          class="border-t bg-gray-50"
        >
          <div class="p-6 space-y-4">
            <h4 class="font-semibold text-gray-900 mb-3">Reportes en este cluster:</h4>
            
            <div
              v-for="report in cluster.reports"
              :key="report._id"
              class="bg-white rounded-lg border p-4"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h5 class="font-semibold text-gray-900">{{ report.title }}</h5>
                    <span
                      :class="[
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        criticalityColors[report.criticality]
                      ]"
                    >
                      {{ report.criticality }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">{{ report.description }}</p>
                  
                  <div class="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>Usuario: {{ report.user?.username || 'Usuario desconocido' }}</span>
                    <span>Score: {{ Number(report.trust_score || 0).toFixed(2) }}</span>
                    <span>Estado: {{ report.status }}</span>
                    <span>{{ formatDate(report.timestamp) }}</span>
                  </div>

                  <!-- Report Tags -->
                  <div v-if="getReportTags(report).length > 0" class="flex flex-wrap gap-1 mt-2">
                    <span
                      v-for="tag in getReportTags(report)"
                      :key="tag"
                      class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="text-xs text-gray-400 mt-2">
                <span v-if="getReportCoordinates(report).length >= 2">
                  {{ getReportCoordinates(report)[1].toFixed(6) }}, {{ getReportCoordinates(report)[0].toFixed(6) }}
                </span>
                <span v-else>
                  Sin coordenadas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Box -->
    <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex gap-3">
        <AlertTriangle class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div class="text-sm text-blue-900">
          <p class="font-semibold mb-1">Sobre los Clusters</p>
          <p>
            Los clusters agrupan reportes relacionados basándose en proximidad geográfica (<500m),
            tags comunes, ventana temporal (48h) y score de confianza (>0.4). Esto ayuda a identificar
            patrones y eventos recurrentes en áreas específicas.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>