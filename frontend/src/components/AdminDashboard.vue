<script setup>

defineProps({
  currentUser: Object
})

</script>

<template>
  <div class="p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">

    <div class="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600">
      <svg class="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    </div>

    <h1 class="text-2xl font-bold text-gray-800">Dashboard de administración</h1>

    <p class="text-gray-500 text-sm">
      Bienvenido, <span class="font-semibold text-gray-700">{{ currentUser?.username }}</span>.
      Los módulos de análisis se irán construyendo acá.
    </p>

    <div class="mt-4 grid grid-cols-2 gap-3 w-full max-w-md">
      <div class="bg-white rounded-xl border border-gray-200 p-4 text-center opacity-40 cursor-not-allowed select-none">
        <p class="text-xs text-gray-500 mb-1">🚨 Gestión de incidentes</p>
        <p class="text-xs text-gray-400">Próximamente</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4 text-center opacity-40 cursor-not-allowed select-none">
        <p class="text-xs text-gray-500 mb-1">📍 Geo-análisis</p>
        <p class="text-xs text-gray-400">Próximamente</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4 text-center opacity-40 cursor-not-allowed select-none">
        <p class="text-xs text-gray-500 mb-1">⏱️ Análisis temporal</p>
        <p class="text-xs text-gray-400">Próximamente</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4 text-center opacity-40 cursor-not-allowed select-none">
        <p class="text-xs text-gray-500 mb-1">🛡️ Calidad y confianza</p>
        <p class="text-xs text-gray-400">Próximamente</p>
      </div>
    </div>

  </div>
</template>
