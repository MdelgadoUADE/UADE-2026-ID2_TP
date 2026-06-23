<script setup>

import { ref, computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'

import ReportView    from './ReportView.vue'
import AppHeader     from './AppHeader.vue'
import AdminDashboard from './AdminDashboard.vue'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null
  },
  emergencyMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'logout'
])

const activeTab = ref('reportar')

const isAdmin = computed(() => props.currentUser?.role === 'admin')

function changeTab(tab) {
  activeTab.value = tab
}

</script>

<template>
  <!-- Banda de alerta modo emergencia -->
  <div v-if="emergencyMode"
    class="bg-red-600 text-white text-center text-sm font-medium py-2 px-4 flex items-center justify-center gap-2">
    <AlertTriangle class="w-4 h-4" />
    MODO EMERGENCIA — Reportes anónimos · Sin adjuntos disponibles
    <button @click="$emit('logout')" class="ml-4 underline hover:no-underline text-white">
      Salir
    </button>
  </div>

  <div class="min-h-screen bg-gray-100">

    <AppHeader
      :username="currentUser?.username ?? null"
      :activeTab="activeTab"
      :emergency-mode="emergencyMode"
      :is-admin="isAdmin"
      @logout="emit('logout')"
      @change-tab="changeTab"
    />

    <!--
      RESPONSIVE CHANGE:
      - `p-6` → `p-3 sm:p-6`
      - On 320px screens p-6 consumed 48px of width (24px each side), leaving only
        272px for content. With p-3 (12px each side) we get 296px — a meaningful gain
        that prevents horizontal overflow on the map and form cards.
      - On sm+ (768px+) the original p-6 spacing is restored exactly.
    -->
    <main class="p-3 sm:p-6">

      <ReportView
        v-if="activeTab === 'reportar'"
      />

      <AdminDashboard
        v-if="activeTab === 'admin-dashboard'"
        :current-user="currentUser"
      />

    </main>

  </div>
</template>