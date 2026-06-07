<script setup>
import TrustScoreBadge from './TrustScoreBadge.vue'

defineProps({

  report: {
    type: Object,
    required: true
  }
})

function formatDate(date) {

  return new Date(date).toLocaleString()
}

function getStatusColor(status) {

  switch (status) {

    case 'active':
      return 'bg-red-500'

    case 'resolved':
      return 'bg-green-500'

    case 'archived':
      return 'bg-gray-500'

    default:
      return 'bg-blue-500'
  }
}

</script>

<template>

  <div
    class="bg-white rounded-2xl shadow-lg p-6 space-y-6"
  >

    <div
      class="flex items-center justify-between"
    >

      <div>

        <h2
          class="text-2xl font-bold text-gray-800"
        >
          Reporte
        </h2>

        <p
          class="text-sm text-gray-500"
        >
          ID: {{ report._id }}
        </p>

      </div>

      <span
        class="px-4 py-2 rounded-full text-white text-sm font-medium"
        :class="getStatusColor(report.status)"
      >
        {{ report.status }}
      </span>

    </div>

    <div>

      <h3
        class="font-semibold text-lg mb-2"
      >
        Usuario
      </h3>

      <div
        class="grid grid-cols-2 gap-2 text-sm"
      >

        <p>
          <strong>Username:</strong>
          {{ report.user?.username }}
        </p>

        <p>
          <strong>Nombre:</strong>
          {{ report.user?.surname }}
        </p>

        <p>
          <strong>Email:</strong>
          {{ report.user?.email }}
        </p>

        <p>
          <strong>Anónimo:</strong>
          {{ report.is_anonymous ? 'Sí' : 'No' }}
        </p>

      </div>

    </div>

    <div>

      <h3
        class="font-semibold text-lg mb-2"
      >
        Descripción
      </h3>

      <p
        class="text-gray-700"
      >
        {{ report.notes }}
      </p>

    </div>

    <div>

      <h3
        class="font-semibold text-lg mb-3"
      >
        Tags
      </h3>

      <div
        class="space-y-3"
      >

        <div
          v-for="(value, key) in report.tags"
          :key="key"
          class="border rounded-xl p-3"
        >

          <p
            class="font-semibold text-blue-600 mb-2"
          >
            {{ key }}
          </p>

          <div
            v-if="typeof value === 'object'"
            class="grid grid-cols-2 gap-2 text-sm"
          >

            <p
              v-for="(subValue, subKey) in value"
              :key="subKey"
            >
              <strong>{{ subKey }}:</strong>
              {{ subValue }}
            </p>

          </div>

          <p
            v-else
            class="text-sm"
          >
            {{ value }}
          </p>

        </div>

      </div>

    </div>

    <div>

      <h3
        class="font-semibold text-lg mb-2"
      >
        Ubicación
      </h3>

      <p
        class="text-sm"
      >
        Longitud:
        {{ report.report_location.coordinates[0] }}
      </p>

      <p
        class="text-sm"
      >
        Latitud:
        {{ report.report_location.coordinates[1] }}
      </p>

    </div>

    <div
      class="grid grid-cols-2 gap-4"
    >

      <div
        class="bg-gray-100 rounded-xl p-4"
      >

        <p
          class="text-sm text-gray-500 mb-2"
        >
          Trust Score
        </p>

        <TrustScoreBadge
          :trust-score="report.trust_score"
          size="large"
        />

      </div>

      <div
        class="bg-gray-100 rounded-xl p-4"
      >

        <p
          class="text-sm text-gray-500"
        >
          Fecha
        </p>

        <p
          class="font-semibold"
        >
          {{ formatDate(report.timestamp) }}
        </p>

      </div>

    </div>

    <div>

      <h3
        class="font-semibold text-lg mb-2"
      >
        Attachments
      </h3>

      <ul
        class="list-disc pl-5 text-sm"
      >

        <li
          v-for="attachment in report.attachments"
          :key="attachment"
        >
          {{ attachment }}
        </li>

      </ul>

    </div>

  </div>

</template>