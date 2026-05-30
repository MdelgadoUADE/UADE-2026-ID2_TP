<script setup>

import { onMounted, computed } from 'vue'

import {
  ArrowLeft,
  Radar
} from 'lucide-vue-next'

import ReportSearchBar from './ReportSearchBar.vue'
import ReportList from './ReportList.vue'
import ReportDetailView from './ReportDetailView.vue'

import {
  useReports
} from './composables/useReports'

const {

  // STATE
  error,
  selectedReport,
  originReport,
  searchQuery,
  showingNearby,

  // ACTIVE DATA
  activeReports,
  activeLoading,

  // ACTIONS
  fetchReports,
  selectReport,
  fetchNearbyReports,
  clearNearbyReports

} = useReports()

onMounted(() => {

  fetchReports()
})

const nearbySearchTitle = computed(() => {

  return originReport.value?.user?.username
    ? `Reportes cercanos a ${originReport.value.user.username}`
    : 'Reportes cercanos'
})

</script>

<template>

  <!-- ========================= -->
  <!-- NORMAL MODE -->
  <!-- ========================= -->

  <div
    v-if="!showingNearby"
    class="
      grid
      grid-cols-1
      lg:grid-cols-3
      gap-6
    "
  >

    <!-- SIDEBAR -->
    <div class="lg:col-span-1">

      <ReportSearchBar
        v-model="searchQuery"
      />

      <div
        v-if="error"
        class="
          bg-red-50
          border
          border-red-200
          text-red-600
          rounded-2xl
          p-4
          mb-4
        "
      >
        {{ error }}
      </div>

      <div
        class="
          flex
          items-center
          gap-2
          mb-4
        "
      >

        <Radar
          class="
            w-5
            h-5
            text-blue-600
          "
        />

        <h2
          class="
            text-lg
            font-semibold
            text-gray-900
          "
        >
          Todos los reportes
        </h2>

      </div>

      <ReportList
        :reports="activeReports"
        :loading="activeLoading"
        @select="selectReport"
      />

    </div>

    <!-- DETAIL -->

    <div class="lg:col-span-2">

      <ReportDetailView
        :report="selectedReport"
        @find-nearby="fetchNearbyReports"
      />

    </div>

  </div>

  <!-- ========================= -->
  <!-- NEARBY MODE -->
  <!-- ========================= -->

  <div
    v-else
    class="
      grid
      grid-cols-1
      lg:grid-cols-2
      gap-6
    "
  >

    <!-- ORIGIN REPORT -->

    <div>

      <div
        class="
          flex
          items-center
          justify-between
          mb-4
        "
      >

        <h2
          class="
            text-lg
            font-semibold
            text-gray-900
          "
        >
          Reporte de referencia
        </h2>

        <button
          @click="clearNearbyReports"
          class="
            flex
            items-center
            gap-2
            text-sm
            font-medium
            text-blue-600
            hover:text-blue-700
          "
        >

          <ArrowLeft class="w-4 h-4" />

          Volver

        </button>

      </div>

      <ReportDetailView
        :report="originReport"
      />

    </div>

    <!-- NEARBY REPORTS -->

    <div>

      <div
        class="
          bg-white
          rounded-2xl
          shadow-lg
          border
          border-gray-200
          p-6
          mb-6
        "
      >

        <h2
          class="
            text-xl
            font-bold
            text-gray-900
            mb-2
          "
        >
          {{ nearbySearchTitle }}
        </h2>

        <p
          class="
            text-sm
            text-gray-500
          "
        >
          Se muestran reportes cercanos a la ubicación del reporte seleccionado.
        </p>

      </div>

      <ReportSearchBar
        v-model="searchQuery"
      />

      <ReportList
        :reports="activeReports"
        :loading="activeLoading"
        @select="selectReport"
      />

    </div>

  </div>

</template>