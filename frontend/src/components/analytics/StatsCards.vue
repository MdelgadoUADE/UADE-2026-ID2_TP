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

const cards = computed(() => {
  if (!props.stats) return []

  return [
    {
      title: 'Total de Reportes',
      value: props.stats.totalReports || 0,
      icon: FileText,
      color: 'blue',
      description: 'Reportes en el sistema'
    },
    {
      title: 'Pendientes',
      value: props.stats.byStatus?.pending || 0,
      icon: Clock,
      color: 'yellow',
      description: 'Esperando revisión'
    },
    {
      title: 'En Progreso',
      value: props.stats.byStatus?.in_progress || 0,
      icon: TrendingUp,
      color: 'purple',
      description: 'Siendo atendidos'
    },
    {
      title: 'Resueltos',
      value: props.stats.byStatus?.resolved || 0,
      icon: CheckCircle,
      color: 'green',
      description: 'Casos cerrados'
    },
    {
      title: 'Rechazados',
      value: props.stats.byStatus?.rejected || 0,
      icon: XCircle,
      color: 'red',
      description: 'No válidos'
    },
    {
      title: 'Score Promedio',
      value: props.stats.avgTrustScore ? props.stats.avgTrustScore.toFixed(2) : '0.00',
      icon: Star,
      color: 'amber',
      description: 'Confianza promedio'
    },
    {
      title: 'Validados',
      value: props.stats.byValidity?.valid || 0,
      icon: CheckCircle,
      color: 'emerald',
      description: 'Reportes verificados'
    },
    {
      title: 'Críticos',
      value: props.stats.byCriticality?.critical || 0,
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
            v-for="(value, key) in stats?.byStatus"
            :key="key"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-gray-600 capitalize">{{ key.replace('_', ' ') }}</span>
            <div class="flex items-center gap-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all"
                  :style="{ width: `${(value / stats.totalReports) * 100}%` }"
                ></div>
              </div>
              <span class="text-sm font-semibold text-gray-900 w-12 text-right">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- By Validity -->
      <div class="bg-white rounded-lg border shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Por Validez</h3>
        <div class="space-y-3">
          <div
            v-for="(value, key) in stats?.byValidity"
            :key="key"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-gray-600 capitalize">{{ key }}</span>
            <div class="flex items-center gap-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div
                  :class="[
                    'h-2 rounded-full transition-all',
                    key === 'valid' ? 'bg-green-600' :
                    key === 'invalid' ? 'bg-red-600' :
                    key === 'duplicate' ? 'bg-yellow-600' :
                    'bg-gray-600'
                  ]"
                  :style="{ width: `${(value / stats.totalReports) * 100}%` }"
                ></div>
              </div>
              <span class="text-sm font-semibold text-gray-900 w-12 text-right">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- By Criticality -->
      <div class="bg-white rounded-lg border shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Por Criticidad</h3>
        <div class="space-y-3">
          <div
            v-for="(value, key) in stats?.byCriticality"
            :key="key"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-gray-600 capitalize">{{ key }}</span>
            <div class="flex items-center gap-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div
                  :class="[
                    'h-2 rounded-full transition-all',
                    key === 'critical' ? 'bg-red-600' :
                    key === 'high' ? 'bg-orange-600' :
                    key === 'medium' ? 'bg-yellow-600' :
                    'bg-blue-600'
                  ]"
                  :style="{ width: `${(value / stats.totalReports) * 100}%` }"
                ></div>
              </div>
              <span class="text-sm font-semibold text-gray-900 w-12 text-right">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Trust Score Distribution -->
      <div class="bg-white rounded-lg border shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Distribución de Confianza</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Alta (≥ 0.7)</span>
            <div class="flex items-center gap-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-green-600 h-2 rounded-full transition-all"
                  :style="{ width: `${(stats?.trustScoreDistribution?.high / stats?.totalReports) * 100 || 0}%` }"
                ></div>
              </div>
              <span class="text-sm font-semibold text-gray-900 w-12 text-right">
                {{ stats?.trustScoreDistribution?.high || 0 }}
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Media (0.4 - 0.7)</span>
            <div class="flex items-center gap-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-yellow-600 h-2 rounded-full transition-all"
                  :style="{ width: `${(stats?.trustScoreDistribution?.medium / stats?.totalReports) * 100 || 0}%` }"
                ></div>
              </div>
              <span class="text-sm font-semibold text-gray-900 w-12 text-right">
                {{ stats?.trustScoreDistribution?.medium || 0 }}
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Baja (< 0.4)</span>
            <div class="flex items-center gap-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-red-600 h-2 rounded-full transition-all"
                  :style="{ width: `${(stats?.trustScoreDistribution?.low / stats?.totalReports) * 100 || 0}%` }"
                ></div>
              </div>
              <span class="text-sm font-semibold text-gray-900 w-12 text-right">
                {{ stats?.trustScoreDistribution?.low || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>