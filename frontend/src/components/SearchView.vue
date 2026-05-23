<script setup>

import { ref } from 'vue'

import ReportCard from './ReportCard.vue'

const reportResult = ref(null)

const reportIds = ref([])

const reportId = ref('')

const nearbyReports = ref([])

async function getReport() {

  if (!reportId.value) {

    alert('Ingresá un ID')

    return
  }

  try {

    const response = await fetch(
      `http://localhost:3000/reports/${reportId.value}`
    )

    const data = await response.json()

    reportResult.value = data

  } catch (error) {

    console.error(error)

    alert('Error obteniendo reporte')
  }
}

async function getAllReportIds() {

  try {

    const response = await fetch(
      'http://localhost:3000/reports'
    )

    const data = await response.json()

    reportIds.value = data.map(
      report => report._id
    )

  } catch (error) {

    console.error(error)

    alert('Error obteniendo IDs')
  }
}

async function getNearbyReports() {

  if (!reportId.value) {

    alert('Ingresá un ID')

    return
  }

  try {

    const response = await fetch(
      `http://localhost:3000/reports/near/${reportId.value}`
    )

    const data = await response.json()

    nearbyReports.value = data

  } catch (error) {

    console.error(error)

    alert('Error obteniendo reportes cercanos')
  }
}

</script>

<template>

  <div
    class="space-y-8"
  >

    <!-- TITLE -->
    <div>

      <h2
        class="text-3xl font-bold text-gray-800"
      >
        Buscar Reportes
      </h2>

      <p
        class="text-gray-500"
      >
        Consultá reportes y buscá incidentes cercanos.
      </p>

    </div>

    <!-- IDS -->
    <div
      class="bg-white rounded-2xl shadow-lg p-6 space-y-4"
    >

      <button
        @click="getAllReportIds"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
      >
        Obtener Todos los IDs
      </button>

      <div
        class="max-h-52 overflow-auto border rounded-lg p-4"
      >

        <ul
          class="space-y-2"
        >

          <li
            v-for="id in reportIds"
            :key="id"
            class="font-mono text-sm"
          >
            {{ id }}
          </li>

        </ul>

      </div>

    </div>

    <!-- SEARCH -->
    <div
      class="bg-white rounded-2xl shadow-lg p-6 space-y-4"
    >

      <input
        v-model="reportId"
        type="text"
        placeholder="Ingresar Report ID"
        class="w-full border rounded-lg px-4 py-2"
      />

      <div
        class="flex gap-4"
      >

        <button
          @click="getReport"
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          Obtener Reporte
        </button>

        <button
          @click="getNearbyReports"
          class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
        >
          Buscar Cercanos
        </button>

      </div>

    </div>

    <!-- REPORT -->
    <ReportCard
      v-if="reportResult"
      :report="reportResult"
    />

    <!-- NEARBY -->
    <div
      v-if="nearbyReports.length"
      class="bg-white rounded-2xl shadow-lg p-6"
    >

      <h3
        class="text-2xl font-bold mb-4"
      >
        Reportes Cercanos
      </h3>

      <table
        class="w-full border-collapse"
      >

        <thead>

          <tr
            class="bg-gray-100"
          >

            <th class="border p-3 text-left">
              ID
            </th>

            <th class="border p-3 text-left">
              Username
            </th>

            <th class="border p-3 text-left">
              Coordenadas
            </th>

          </tr>

        </thead>

        <tbody>

          <tr
            v-for="r in nearbyReports"
            :key="r.id"
          >

            <td class="border p-3">
              {{ r.id }}
            </td>

            <td class="border p-3">
              {{ r.username }}
            </td>

            <td class="border p-3">
              {{ r.coordinates }}
            </td>

          </tr>

        </tbody>

      </table>

    </div>

  </div>

</template>