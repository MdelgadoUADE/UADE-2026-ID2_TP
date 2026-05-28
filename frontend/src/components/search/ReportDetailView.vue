<script setup>
import {
  MapPin,
  Clock3,
  ShieldCheck,
  User,
  FileText
} from 'lucide-vue-next'

import ReportTagList from './ReportTagList.vue'
import ReportAttachmentList from './ReportAttachmentList.vue'

defineProps({
  report: Object
})

function formatDate(date) {
  return new Date(date).toLocaleString()
}
</script>

<template>

  <div
    v-if="report"
    class="
      bg-white
      rounded-2xl
      shadow-lg
      border
      border-gray-200
      p-8
      space-y-8
    "
  >

    <!-- HEADER -->
    <div class="flex items-start justify-between">

      <div>

        <div class="flex items-center gap-3">

          <div
            class="
              w-12
              h-12
              rounded-xl
              bg-blue-600
              flex
              items-center
              justify-center
            "
          >
            <User class="w-6 h-6 text-white" />
          </div>

          <div>

            <h2 class="text-2xl font-bold text-gray-900">
              {{ report.user.username }}
            </h2>

            <p class="text-gray-500">
              {{ report.user.email }}
            </p>

          </div>

        </div>

      </div>

      <div
        class="
          flex
          items-center
          gap-2
          bg-green-50
          text-green-700
          px-4
          py-2
          rounded-full
          text-sm
          font-medium
        "
      >
        <ShieldCheck class="w-4 h-4" />

        {{ report.status }}
      </div>

    </div>

    <!-- META -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

      <div
        class="
          border
          border-gray-200
          rounded-xl
          p-4
        "
      >

        <div class="flex items-center gap-2 mb-2">

          <MapPin class="w-4 h-4 text-blue-600" />

          <span class="font-medium text-gray-900">
            Ubicación
          </span>

        </div>

        <p class="text-sm text-gray-600">
          {{ report.report_location.coordinates }}
        </p>

      </div>

      <div
        class="
          border
          border-gray-200
          rounded-xl
          p-4
        "
      >

        <div class="flex items-center gap-2 mb-2">

          <Clock3 class="w-4 h-4 text-blue-600" />

          <span class="font-medium text-gray-900">
            Fecha
          </span>

        </div>

        <p class="text-sm text-gray-600">
          {{ formatDate(report.timestamp) }}
        </p>

      </div>

    </div>

    <!-- NOTES -->
    <div>

      <div class="flex items-center gap-2 mb-3">

        <FileText class="w-5 h-5 text-blue-600" />

        <h3 class="text-lg font-semibold text-gray-900">
          Notas
        </h3>

      </div>

      <div
        class="
          border
          border-gray-200
          rounded-xl
          p-5
          bg-gray-50
        "
      >
        <p class="text-gray-700 leading-relaxed">
          {{ report.notes }}
        </p>
      </div>

    </div>

    <!-- TAGS -->
    <ReportTagList
      :tags="report.tags"
    />

    <!-- ATTACHMENTS -->
    <ReportAttachmentList
      :attachments="report.attachments"
    />

  </div>

  <!-- EMPTY -->
  <div
    v-else
    class="
      bg-white
      rounded-2xl
      shadow-lg
      border
      border-gray-200
      p-12
      flex
      flex-col
      items-center
      justify-center
      text-center
    "
  >

    <div
      class="
        w-16
        h-16
        rounded-2xl
        bg-gray-100
        flex
        items-center
        justify-center
        mb-4
      "
    >
      <FileText class="w-8 h-8 text-gray-400" />
    </div>

    <h3 class="text-lg font-semibold text-gray-800">
      Ningún reporte seleccionado
    </h3>

    <p class="text-gray-500 mt-2">
      Seleccioná un reporte para visualizar los detalles
    </p>

  </div>

</template>