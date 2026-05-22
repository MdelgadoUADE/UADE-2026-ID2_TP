<script setup>
import { LogOut } from 'lucide-vue-next'

defineProps({
  username: {
    type: String,
    required: true
  }
})

const emit = defineEmits([
  'logout'
])

function handleLogout() {

  emit('logout')
}
</script>

<template>

<div class="bg-red-500 text-white">
    TEST
</div>

  <header
    class="w-full bg-blue-600 text-white shadow-md"
  >

    <div
      class="max-w-7xl mx-auto px-6 py-4 flex flex-row items-center justify-between"
    >

      <!-- IZQUIERDA -->
      <div
        class="flex flex-row items-center gap-4"
      >

        <div
          class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg"
        >
          logo
        </div>

        <div
          class="flex flex-col"
        >

          <h1
            class="text-2xl font-bold leading-none"
          >
            Report-IT!
          </h1>

          <p
            class="text-sm text-blue-100"
          >
            Secure-IT
          </p>

        </div>

      </div>

      <!-- DERECHA -->
      <div
        class="flex flex-row items-center gap-4"
      >

        <span
          class="font-medium"
        >
          {{ username }}
        </span>

        <button
          @click="handleLogout"
          class="flex flex-row items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
        >

          <LogOut class="w-4 h-4" />

          <span>
            Logout
          </span>

        </button>

      </div>

    </div>

  </header>

</template>