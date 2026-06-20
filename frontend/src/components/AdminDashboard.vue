<script setup>
import { ref } from 'vue'
import { AlertTriangle, MapPin, Clock, Shield } from 'lucide-vue-next'
import IncidentManagementView from './admin/IncidentManagementView.vue'
import IncidentGeoView        from './admin/IncidentGeoView.vue'
import IncidentTemporalView   from './admin/IncidentTemporalView.vue'

defineProps({
  currentUser: Object
})

const activeCategory = ref('incidentes')

const CATEGORIES = [
  { id: 'incidentes', label: 'Gestión de incidentes', icon: AlertTriangle },
  { id: 'geo',        label: 'Geo-análisis',           icon: MapPin },
  { id: 'temporal',   label: 'Análisis temporal',      icon: Clock },
  { id: 'confianza',  label: 'Calidad y confianza',    icon: Shield, soon: true },
]
</script>

<template>
  <div class="space-y-4">

    <!-- Sub-nav de categorías -->
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="cat in CATEGORIES"
        :key="cat.id"
        :disabled="cat.soon"
        @click="!cat.soon && (activeCategory = cat.id)"
        :class="[
          'flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium transition',
          cat.soon
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : activeCategory === cat.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
        ]"
      >
        <component :is="cat.icon" class="w-4 h-4" />
        {{ cat.label }}
        <span v-if="cat.soon" class="text-xs font-normal opacity-60">· pronto</span>
      </button>
    </div>

    <!-- Contenido de la categoría activa -->
    <IncidentManagementView v-if="activeCategory === 'incidentes'" />
    <IncidentGeoView        v-if="activeCategory === 'geo'" />
    <IncidentTemporalView   v-if="activeCategory === 'temporal'" />

  </div>
</template>