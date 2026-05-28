<script setup>

import { onMounted } from 'vue'

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

</script>

<template>

  <div
    class="
      grid
      grid-cols-1
      lg:grid-cols-3
      gap-6
    "
  >

    <!-- SIDEBAR -->
    <div class="lg:col-span-1">

      <!-- SEARCH -->
      <ReportSearchBar
        v-model="searchQuery"
      />

      <!-- ERROR -->
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

      <!-- LIST HEADER -->
      <div
        class="
          flex
          items-center
          justify-between
          mb-4
        "
      >

        <div
          class="
            flex
            items-center
            gap-2
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

            {{
              showingNearby
                ? 'Reportes cercanos'
                : 'Todos los reportes'
            }}

          </h2>

        </div>

        <!-- BACK -->
        <button
          v-if="showingNearby"
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

      <!-- REPORT LIST -->
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

</template>