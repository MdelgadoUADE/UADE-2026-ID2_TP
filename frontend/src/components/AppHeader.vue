<script setup>

//defineProps({
//
//  username: String,
//
//  activeTab: String
//})

const props = defineProps({
  username: String,
  activeTab: String,
  emergencyMode: {
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
          @click="emit('change-tab', 'buscar')"
          class="px-4 py-2 rounded-lg transition"
          :class="activeTab === 'buscar'
            ? 'bg-blue-600'
            : 'bg-gray-700 hover:bg-gray-600'"
        >
          Buscar
        </button>

      </nav>

    </div>

    <!-- RIGHT -->
    <div
      class="flex items-center gap-4"
    >

      <span>
        {{ username }}
      </span>

      <button
        @click="emit('logout')"
        class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg"
      >
        Logout
      </button>

    </div>

  </header>

</template>