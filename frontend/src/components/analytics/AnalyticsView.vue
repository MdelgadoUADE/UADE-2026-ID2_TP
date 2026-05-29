<script setup>
import { ref, onMounted } from 'vue'
import { BarChart3, Users, AlertTriangle, CheckCircle, TrendingUp, RefreshCw } from 'lucide-vue-next'
import StatsCards from './StatsCards.vue'
import PendingReports from './PendingReports.vue'
import ClustersView from './ClustersView.vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const activeSection = ref('stats')
const stats = ref(null)
const loading = ref(false)
const error = ref(null)

async function fetchStats() {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('http://localhost:3000/analytics/stats', {
      headers: {
        'x-user-id': props.user.user_id,
        'x-user-role': props.user.role,
        'x-user-name': props.user.username
      }
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'Error fetching stats')
    }

    stats.value = data.stats
  } catch (err) {
    console.error('Error fetching stats:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function runClustering() {
  if (!confirm('¿Ejecutar clustering automático? Esto puede tomar unos segundos.')) {
    return
  }

  loading.value = true
  
  try {
    const response = await fetch('http://localhost:3000/analytics/cluster/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': props.user.user_id,
        'x-user-role': props.user.role,
        'x-user-name': props.user.username
      }
    })

    const data = await response.json()

    if (data.success) {
      alert(`Clustering completado!\n\nClusters creados: ${data.clustersCreated}\nReportes procesados: ${data.reportsProcessed}`)
      // Refrescar stats
      await fetchStats()
    } else {
      throw new Error(data.message || 'Error running clustering')
    }
  } catch (err) {
    console.error('Error running clustering:', err)
    alert('Error ejecutando clustering: ' + err.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="space-y-6">
    
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Dashboard de Analistas</h1>
        <p class="text-gray-600 mt-1">Panel de control y gestión de reportes</p>
      </div>
      
      <div class="flex gap-3">
        <button
          @click="fetchStats"
          :disabled="loading"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw :class="['w-4 h-4', loading && 'animate-spin']" />
          Actualizar
        </button>
        
        <button
          @click="runClustering"
          :disabled="loading"
          class="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          <TrendingUp class="w-4 h-4" />
          Ejecutar Clustering
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
    >
      <p class="font-semibold">Error</p>
      <p class="text-sm">{{ error }}</p>
    </div>

    <!-- Navigation Tabs -->
    <div class="border-b border-gray-200">
      <nav class="flex gap-4">
        <button
          @click="activeSection = 'stats'"
          :class="[
            'px-4 py-2 border-b-2 font-medium transition-colors',
            activeSection === 'stats'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          ]"
        >
          <div class="flex items-center gap-2">
            <BarChart3 class="w-4 h-4" />
            Estadísticas
          </div>
        </button>

        <button
          @click="activeSection = 'pending'"
          :class="[
            'px-4 py-2 border-b-2 font-medium transition-colors',
            activeSection === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          ]"
        >
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-4 h-4" />
            Pendientes
          </div>
        </button>

        <button
          @click="activeSection = 'clusters'"
          :class="[
            'px-4 py-2 border-b-2 font-medium transition-colors',
            activeSection === 'clusters'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          ]"
        >
          <div class="flex items-center gap-2">
            <Users class="w-4 h-4" />
            Clusters
          </div>
        </button>
      </nav>
    </div>

    <!-- Content -->
    <div v-if="loading && !stats" class="text-center py-12">
      <RefreshCw class="w-8 h-8 animate-spin mx-auto text-blue-600" />
      <p class="text-gray-600 mt-2">Cargando datos...</p>
    </div>

    <div v-else>
      <StatsCards
        v-if="activeSection === 'stats'"
        :stats="stats"
        :user="user"
      />

      <PendingReports
        v-if="activeSection === 'pending'"
        :user="user"
        @report-validated="fetchStats"
      />

      <ClustersView
        v-if="activeSection === 'clusters'"
        :user="user"
      />
    </div>

  </div>
</template>