<script setup>
import ReportListCard from './ReportListCard.vue'

defineProps({
  reports: Array,
  loading: Boolean
})

defineEmits(['select'])
</script>

<template>
  <div class="space-y-4">

    <div
      v-if="loading"
      class="text-gray-500"
    >
      Cargando reportes...
    </div>

    <ReportListCard
      v-for="report in reports"
      :key="report._id"
      :report="report"
      @click="$emit('select', report)"
    />

  </div>
</template>