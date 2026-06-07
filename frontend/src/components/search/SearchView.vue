<script setup>

import { onMounted } from 'vue'

import {
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

  // ACTIVE DATA
  activeReports,
  activeLoading,

  // ACTIONS
  fetchReports,
  selectReport

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
      />

    </div>

  </div>

</template>