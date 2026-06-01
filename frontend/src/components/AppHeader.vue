<script setup>
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
</script>

<template>
  <header :class="[
    'px-6 py-4 flex items-center justify-between shadow-sm',
    emergencyMode
      ? 'bg-red-600 text-white'
      : 'bg-white text-gray-900'
  ]">
    <!-- Logo -->
    <div class="flex items-center gap-2">
      <div :class="[
        'flex items-center justify-center w-8 h-8 rounded-lg',
        emergencyMode ? 'bg-red-800' : 'bg-blue-600'
      ]">
        <MapPin class="w-4 h-4 text-white" />
      </div>
      <span class="font-bold text-lg">Report-IT</span>
      <span v-if="emergencyMode" class="ml-2 text-xs font-bold bg-red-800 text-white px-2 py-0.5 rounded-full">
        MODO EMERGENCIA
      </span>

      <!-- NAV -->
      <nav class="flex gap-4 ml-2">

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

    <!-- RIGHT -->
    <div class="flex items-center gap-4">

      <span class="text-sm">
        {{ username }}
      </span>

      <button
        @click="emit('logout')"
        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
      >
        Logout
      </button>

    </div>

  </header>
</template>
