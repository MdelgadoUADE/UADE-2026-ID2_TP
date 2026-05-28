<script setup>
import {
  MapPin,
  Clock3,
  Tags,
  Paperclip,
  ChevronRight,
  ShieldAlert
} from 'lucide-vue-next'

defineProps({
  report: Object
})

function formatDate(date) {
  return new Date(date).toLocaleString()
}

function tagCount(tags) {
  return Object.keys(tags || {}).length
}

function coordinates(location) {
  if (!location?.coordinates) return '-'

  const [lng, lat] = location.coordinates

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}
</script>

<template>

  <div
    class="
      bg-white
      rounded-2xl
      shadow-lg
      border
      border-gray-200
      p-5
      cursor-pointer
      hover:shadow-xl
      hover:border-blue-300
      transition-all
      duration-200
    "
  >

    <!-- TOP -->
    <div class="flex items-start justify-between">

      <div>

        <h3 class="text-lg font-semibold text-gray-900">
          {{ report.user.username }}
        </h3>

        <p class="text-sm text-gray-500">
          {{ report.status }}
        </p>

      </div>

      <div
        class="
          flex
          items-center
          gap-1
          bg-blue-50
          text-blue-700
          px-3
          py-1
          rounded-full
          text-sm
          font-medium
        "
      >
        <ShieldAlert class="w-4 h-4" />

        {{ report.trust_score }}
      </div>

    </div>

    <!-- INFO -->
    <div class="mt-5 space-y-3">

      <div class="flex items-center gap-3 text-gray-600">

        <MapPin class="w-4 h-4 text-blue-600" />

        <span class="text-sm">
          {{ coordinates(report.report_location) }}
        </span>

      </div>

      <div class="flex items-center gap-3 text-gray-600">

        <Clock3 class="w-4 h-4 text-blue-600" />

        <span class="text-sm">
          {{ formatDate(report.timestamp) }}
        </span>

      </div>

      <div class="flex items-center gap-3 text-gray-600">

        <Tags class="w-4 h-4 text-blue-600" />

        <span class="text-sm">
          {{ tagCount(report.tags) }} tags
        </span>

      </div>

      <div class="flex items-center gap-3 text-gray-600">

        <Paperclip class="w-4 h-4 text-blue-600" />

        <span class="text-sm">
          {{ report.attachments?.length || 0 }} attachments
        </span>

      </div>

    </div>

    <!-- FOOTER -->
    <div
      class="
        mt-6
        pt-4
        border-t
        border-gray-100
        flex
        items-center
        justify-between
      "
    >

      <span class="text-sm text-gray-500">
        Ver detalle del reporte
      </span>

      <ChevronRight
        class="
          w-5
          h-5
          text-blue-600
        "
      />

    </div>

  </div>

</template>