<script setup>
import { ref } from 'vue'
import { MapPin } from 'lucide-vue-next'

const props = defineProps({
  username: String,
  activeTab: String,
  emergencyMode: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'logout',
  'change-tab'
])

// Estado del menú hamburguesa (solo usado en mobile/tablet)
const menuOpen = ref(false)

function handleChangeTab(tab) {
  emit('change-tab', tab)
  menuOpen.value = false // cerrar menú al navegar
}
</script>

<template>
  <header :class="[
    'shadow-sm',
    emergencyMode
      ? 'bg-red-600 text-white'
      : 'bg-white text-gray-900'
  ]">

    <!-- Barra principal -->
    <div class="px-6 py-4 flex items-center justify-between">

      <!-- Izquierda: Logo + título + badge emergencia -->
      <div class="flex items-center gap-2 min-w-0">
        <div :class="[
          'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg',
          emergencyMode ? 'bg-red-800' : 'bg-blue-600'
        ]">
          <MapPin class="w-4 h-4 text-white" />
        </div>
        <span class="font-bold text-lg whitespace-nowrap">Report-IT</span>
        <span
          v-if="emergencyMode"
          class="ml-2 text-xs font-bold bg-red-800 text-white px-2 py-0.5 rounded-full whitespace-nowrap"
        >
          MODO EMERGENCIA
        </span>

        <!-- NAV desktop (solo visible en lg+) -->
        <nav class="hidden lg:flex gap-4 ml-2">
          <button
            @click="emit('change-tab', 'reportar')"
            class="px-4 py-2 rounded-lg transition"
            :class="activeTab === 'reportar'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-white hover:bg-gray-600'"
          >
            Reportar
          </button>

          <!-- Solo visible para administradores -->
          <button
            v-if="isAdmin"
            @click="emit('change-tab', 'admin-dashboard')"
            class="px-4 py-2 rounded-lg transition flex items-center gap-1.5"
            :class="activeTab === 'admin-dashboard'
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'"
          >
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            Dashboard
          </button>
        </nav>
      </div>

      <!-- Derecha: username + logout (desktop) + hamburguesa (mobile) -->
      <div class="flex items-center gap-3 flex-shrink-0">

        <!-- Username: solo visible en desktop -->
        <span class="hidden lg:inline text-sm">
          {{ username }}
        </span>

        <!-- Logout: solo visible en desktop -->
        <button
          @click="emit('logout')"
          class="hidden lg:inline-flex bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>

        <!-- Botón hamburguesa: solo visible en mobile/tablet -->
        <button
          @click="menuOpen = !menuOpen"
          class="lg:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg transition"
          :class="emergencyMode ? 'hover:bg-red-700' : 'hover:bg-gray-100'"
          aria-label="Abrir menú"
        >
          <!-- Ícono hamburguesa / X -->
          <span v-if="!menuOpen" class="flex flex-col gap-1.5">
            <span :class="['block w-5 h-0.5', emergencyMode ? 'bg-white' : 'bg-gray-700']"></span>
            <span :class="['block w-5 h-0.5', emergencyMode ? 'bg-white' : 'bg-gray-700']"></span>
            <span :class="['block w-5 h-0.5', emergencyMode ? 'bg-white' : 'bg-gray-700']"></span>
          </span>
          <span v-else class="flex items-center justify-center w-5 h-5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
              :class="['w-5 h-5', emergencyMode ? 'text-white' : 'text-gray-700']">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        </button>

      </div>
    </div>

    <!-- Menú desplegable mobile/tablet (visible solo cuando menuOpen = true) -->
    <div
      v-if="menuOpen"
      class="lg:hidden border-t px-4 py-3 flex flex-col gap-2"
      :class="emergencyMode ? 'border-red-700 bg-red-600' : 'border-gray-200 bg-white'"
    >
      <!-- Username en móvil -->
      <div
        v-if="username"
        class="text-sm px-2 py-1"
        :class="emergencyMode ? 'text-red-100' : 'text-gray-500'"
      >
        {{ username }}
      </div>

      <!-- Botón Reportar -->
      <button
        @click="handleChangeTab('reportar')"
        class="w-full text-left px-4 py-3 rounded-lg transition font-medium"
        :class="activeTab === 'reportar'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-700 text-white hover:bg-gray-600'"
      >
        Reportar
      </button>

      <!-- Botón Dashboard (solo admin) -->
      <button
        v-if="isAdmin"
        @click="handleChangeTab('admin-dashboard')"
        class="w-full text-left px-4 py-3 rounded-lg transition font-medium flex items-center gap-2"
        :class="activeTab === 'admin-dashboard'
          ? 'bg-indigo-600 text-white'
          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'"
      >
        <svg class="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
        </svg>
        Dashboard
      </button>

      <!-- Logout -->
      <button
        @click="emit('logout'); menuOpen = false"
        class="w-full text-left px-4 py-3 rounded-lg transition font-medium bg-red-500 hover:bg-red-600 text-white"
      >
        Logout
      </button>
    </div>

  </header>
</template>