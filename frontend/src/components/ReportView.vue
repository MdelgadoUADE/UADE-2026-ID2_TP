<script setup>

import MapView from './Map.vue'

</script>

<template>

  <div
    class="space-y-6"
  >

    <div>

      <h2
        class="text-3xl font-bold text-gray-800"
      >
        Reportar
      </h2>

      <p
        class="text-gray-500"
      >
        Generá nuevos reportes desde el mapa.
      </p>

    </div>

    <div
      class="bg-white rounded-2xl shadow-lg overflow-hidden"
    >

      <MapView />

    </div>

  </div>

</template>