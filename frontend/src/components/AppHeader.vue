<script setup>

defineProps({

  username: String,

  activeTab: String
})

const emit = defineEmits([
  'logout',
  'change-tab'
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