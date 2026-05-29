<script setup>

import { ref, inject } from 'vue'

import ReportView from './ReportView.vue'
import SearchView from './search/SearchView.vue'
import AnalyticsView from './analytics/AnalyticsView.vue'
import AppHeader from './AppHeader.vue'
import { AlertTriangle } from 'lucide-vue-next'

const props = defineProps({
  username: String,
  isEmergency: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'logout',
  'exit-emergency'
])

const activeTab = ref('reportar')
const currentUser = inject('currentUser')

function changeTab(tab) {
  // En modo emergencia, solo permitir la pestaña de reportar
  if (props.isEmergency && tab !== 'reportar') {
    return
  }
  
  // Verificar acceso a analytics (solo admin y analyst)
  if (tab === 'analytics') {
    const userRole = currentUser.value?.role
    if (userRole !== 'admin' && userRole !== 'analyst') {
      return
    }
  }
  
  activeTab.value = tab
}

</script>

<template>

  <div
    class="min-h-screen bg-gray-100"
  >

    <AppHeader
      :username="username"
      :activeTab="activeTab"
      :user-role="currentUser?.role"
      :is-emergency="isEmergency"
      @logout="emit('logout')"
      @exit-emergency="emit('exit-emergency')"
      @change-tab="changeTab"
    />

    <!-- Emergency Mode Banner -->
    <div
      v-if="isEmergency"
      class="bg-red-600 text-white px-6 py-3 flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <AlertTriangle class="w-5 h-5" />
        <div>
          <p class="font-semibold">Modo Emergencia Activo</p>
          <p class="text-sm text-red-100">Solo puedes crear reportes. Inicia sesión para acceder a todas las funciones.</p>
        </div>
      </div>
      <button
        @click="emit('exit-emergency')"
        class="bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 font-medium transition-colors"
      >
        Iniciar Sesión
      </button>
    </div>

    <main
      class="p-6"
    >

      <ReportView
        v-if="activeTab === 'reportar'"
      />

      <SearchView
        v-if="activeTab === 'buscar' && !isEmergency"
      />

      <AnalyticsView
        v-if="activeTab === 'analytics' && !isEmergency && currentUser"
        :user="currentUser"
      />

    </main>

  </div>

</template>