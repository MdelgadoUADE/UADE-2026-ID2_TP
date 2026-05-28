<script setup>

import { onMounted } from 'vue'

import ReportSearchBar from './ReportSearchBar.vue'
import ReportList from './ReportList.vue'
import ReportDetailView from './ReportDetailView.vue'

import {
  useReports
} from './composables/useReports'

const {
  filteredReports,
  loading,
  error,
  selectedReport,
  searchQuery,
  fetchReports,
  selectReport
} = useReports()

onMounted(fetchReports)

</script>

<template>

  <div
    class="grid grid-cols-1 lg:grid-cols-3 gap-6"
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
          rounded-xl
          p-4
          mb-4
        "
      >
        {{ error }}
      </div>

      <ReportList
        :reports="filteredReports"
        :loading="loading"
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