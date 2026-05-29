<script setup>
import { computed } from 'vue'
import { FileText, Clock, CheckCircle, XCircle, Star, TrendingUp, AlertTriangle, Users } from 'lucide-vue-next'

const props = defineProps({
  stats: {
    type: Object,
    required: true
  },
  user: {
    type: Object,
    required: true
  }
})

// Helper para convertir array de agregación a objeto
const getStatusCounts = computed(() => {
  if (!props.stats?.byStatus) return {}
  return props.stats.byStatus.reduce((acc, item) => {
    acc[item._id] = item.count
    return acc
  }, {})
})

const getValidityCounts = computed(() => {
  if (!props.stats?.byValidity) return {}
  return props.stats.byValidity.reduce((acc, item) => {
    acc[item._id] = item.count
    return acc
  }, {})
})

const getCriticalityCounts = computed(() => {
  if (!props.stats?.byCriticality) return {}
  return props.stats.byCriticality.reduce((acc, item) => {
    acc[item._id] = item.count
    return acc
  }, {})
})

const totalReports = computed(() => {
  return props.stats?.total?.[0]?.count || 0
})

const avgTrustScore = computed(() => {
  return props.stats?.avgTrustScore?.[0]?.avg || 0
})

const cards = computed(() => {
  if (!props.stats) return []

  const statusCounts = getStatusCounts.value
  const validityCounts = getValidityCounts.value
  const criticalityCounts = getCriticalityCounts.value

  return [
    {
      title: 'Total de Reportes',
      value: totalReports.value,
      icon: FileText,
      color: 'blue',
      description: 'Reportes en el sistema'
    },
    {
      title: 'Activos',
      value: statusCounts.active || 0,
      icon: Clock,
      color: 'yellow',
      description: 'Reportes activos'
    },
    {
      title: 'Resueltos',
      value: statusCounts.resolved || 0,
      icon: CheckCircle,
      color: 'green',
      description: 'Casos cerrados'
    },
    {
      title: 'Archivados',
      value: statusCounts.archived || 0,
      icon: XCircle,
      color: 'red',
      description: 'Archivados'
    },
    {
      title: 'Score Promedio',
      value: avgTrustScore.value.toFixed(2),
      icon: Star,
      color: 'amber',
      description: 'Confianza promedio'
    },
    {
      title: 'Pendientes Validación',
      value: validityCounts.pending || 0,
      icon: AlertTriangle,
      color: 'purple',
      description: 'Esperando revisión'
    },
    {
      title: 'Validados',
      value: validityCounts.valid || 0,
      icon: CheckCircle,
      color: 'emerald',
      description: 'Reportes verificados'
    },
    {
      title: 'Críticos',
      value: criticalityCounts.critical || 0,
      icon: AlertTriangle,
      color: 'rose',
      description: 'Requieren atención urgente'
    }
  ]
})

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rose: 'bg-rose-50 text-rose-600 border-rose-200'
}
</script>

<template>
  <div>
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div
        v-for="card in cards"
        :key="card.title"
        class="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-600">{{ card.title }}</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ card.value }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ card.description }}</p>
          </div>
          <div :class="['p-3 rounded-lg border', colorClasses[card.color]]">
            <component :is="card.icon" class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- By Status -->
      <div class="bg-white rounded-lg border shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Por Estado</h3>
        <div class="space-y-3">
          <div
            v-for="item in stats?.byStatus"
            :key="item._id"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-gray-600 capitalize">{{ item._id.replace('_', ' ') }}</span>
            <div class="flex items-center gap-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all"
                  :style="{ width: `${(item.count / totalReports) * 100}%` }"
                ></div>
              </div>
              <span class="text-sm font-semibold text-gray-900 w-12 text-right">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- By Validity -->
      <div class="bg-white rounded-lg border shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Por Validez</h3>
        <div class="space-y-3">
          <div
            v-for="item in stats?.byValidity"
            :key="item._id"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-gray-600 capitalize">{{ item._id }}</span>
            <div class="flex items-center gap-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div
                  :class="[
                    'h-2 rounded-full transition-all',
                    item._id === 'valid' ? 'bg-green-600' :
                    item._id === 'invalid' ? 'bg-red-600' :
                    item._id === 'duplicate' ? 'bg-yellow-600' :
                    'bg-gray-600'
                  ]"
                  :style="{ width: `${(item.count / totalReports) * 100}%` }"
                ></div>
              </div>
              <span class="text-sm font-semibold text-gray-900 w-12 text-right">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- By Criticality -->
      <div class="bg-white rounded-lg border shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Por Criticidad</h3>
        <div class="space-y-3">
          <div
            v-for="item in stats?.byCriticality"
            :key="item._id"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-gray-600 capitalize">{{ item._id }}</span>
            <div class="flex items-center gap-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div
                  :class="[
                    'h-2 rounded-full transition-all',
                    item._id === 'critical' ? 'bg-red-600' :
                    item._id === 'high' ? 'bg-orange-600' :
                    item._id === 'medium' ? 'bg-yellow-600' :
                    'bg-blue-600'
                  ]"
                  :style="{ width: `${(item.count / totalReports) * 100}%` }"
                ></div>
              </div>
              <span class="text-sm font-semibold text-gray-900 w-12 text-right">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Tags -->
      <div class="bg-white rounded-lg border shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Tags Más Usados</h3>
        <div class="space-y-3">
          <div
            v-for="item in stats?.topTags"
            :key="item._id"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-gray-600 capitalize">{{ item._id }}</span>
            <div class="flex items-center gap-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-purple-600 h-2 rounded-full transition-all"
                  :style="{ width: `${(item.count / totalReports) * 100}%` }"
                ></div>
              </div>
              <span class="text-sm font-semibold text-gray-900 w-12 text-right">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>