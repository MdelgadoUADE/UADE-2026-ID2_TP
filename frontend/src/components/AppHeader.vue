<script setup>

const props = defineProps({
  username: String,
  activeTab: String,
  userRole: String,
  isEmergency: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'logout',
  'change-tab',
  'exit-emergency'
])

</script>

<template>

  <header
    class="bg-gray-900 text-white px-6 py-4 flex items-center justify-between"
  >

    <!-- LEFT -->
    <div
      class="flex items-center gap-10"
    >

      <h1
        class="text-2xl font-bold"
      >
        Report-IT
      </h1>

      <!-- NAV -->
      <nav
        class="flex gap-4"
      >

        <button
          @click="emit('change-tab', 'reportar')"
          class="px-4 py-2 rounded-lg transition"
          :class="activeTab === 'reportar'
            ? 'bg-blue-600'
            : 'bg-gray-700 hover:bg-gray-600'"
        >
          Reportar
        </button>

        <button
          v-if="!isEmergency"
          @click="emit('change-tab', 'buscar')"
          class="px-4 py-2 rounded-lg transition"
          :class="activeTab === 'buscar'
            ? 'bg-blue-600'
            : 'bg-gray-700 hover:bg-gray-600'"
        >
          Buscar
        </button>

        <button
          v-if="isEmergency"
          disabled
          class="px-4 py-2 rounded-lg bg-gray-800 text-gray-500 cursor-not-allowed"
          title="Inicia sesión para acceder a búsqueda"
        >
          Buscar 🔒
        </button>

        <button
          v-if="!isEmergency"
          @click="emit('change-tab', 'analytics')"
          class="px-4 py-2 rounded-lg transition"
          :class="activeTab === 'analytics'
            ? 'bg-blue-600'
            : 'bg-gray-700 hover:bg-gray-600'"
        >
          Analytics
        </button>

      </nav>

    </div>

    <!-- RIGHT -->
    <div
      class="flex items-center gap-4"
    >

      <span :class="isEmergency ? 'text-red-400' : ''">
        {{ username }}
      </span>

      <button
        v-if="!isEmergency"
        @click="emit('logout')"
        class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
      >
        Logout
      </button>

      <button
        v-else
        @click="emit('exit-emergency')"
        class="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors"
      >
        Iniciar Sesión
      </button>

    </div>

  </header>

</template>