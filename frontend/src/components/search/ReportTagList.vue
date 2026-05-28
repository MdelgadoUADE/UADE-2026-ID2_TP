<script setup>

import {
  Tags
} from 'lucide-vue-next'

defineProps({
  tags: Object
})

function isObject(value) {

  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
}

function formatLabel(label) {

  return label
    .replaceAll('_', ' ')
}

</script>

<template>

  <div>

    <!-- HEADER -->
    <div
      class="flex items-center gap-2 mb-4"
    >

      <Tags class="w-5 h-5 text-blue-600" />

      <h3
        class="text-lg font-semibold text-gray-900"
      >
        Tags
      </h3>

    </div>

    <div class="space-y-4">

      <div
        v-for="(tagValue, tagName) in tags"
        :key="tagName"
        class="
          border
          border-gray-200
          rounded-2xl
          p-5
          bg-gray-50
        "
      >

        <!-- TAG TITLE -->
        <h4
          class="
            font-semibold
            text-gray-900
            capitalize
            mb-4
          "
        >
          {{ formatLabel(tagName) }}
        </h4>

        <!-- OBJECT TAG -->
        <div
          v-if="isObject(tagValue)"
          class="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-3
          "
        >

          <div
            v-for="(value, key) in tagValue"
            :key="key"
            class="
              bg-white
              border
              border-gray-200
              rounded-xl
              p-3
            "
          >

            <p
              class="
                text-xs
                text-gray-500
                mb-1
                capitalize
              "
            >
              {{ formatLabel(key) }}
            </p>

            <p
              class="
                text-sm
                font-medium
                text-gray-900
              "
            >
              {{ value }}
            </p>

          </div>

        </div>

        <!-- SIMPLE TAG -->
        <div
          v-else
          class="
            bg-white
            border
            border-gray-200
            rounded-xl
            px-4
            py-3
            inline-flex
            items-center
          "
        >

          <span
            class="
              text-sm
              font-medium
              text-gray-900
            "
          >
            {{ tagValue }}
          </span>

        </div>

      </div>

    </div>

  </div>

</template>