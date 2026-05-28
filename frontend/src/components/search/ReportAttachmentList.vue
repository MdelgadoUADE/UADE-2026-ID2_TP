<script setup>
defineProps({
  attachments: Array
})
</script>

<template>

  <div>

    <h3 class="font-semibold text-lg mb-4">
      Attachments
    </h3>

    <div
      v-if="attachments?.length"
      class="space-y-2"
    >

      <div
        v-for="attachment in attachments"
        :key="attachment"
        class="
          flex
          items-center
          justify-between
          border
          rounded-lg
          p-3
        "
      >

        <span class="font-mono text-sm">
          {{ attachment }}
        </span>

        <button
          class="
            text-blue-600
            hover:text-blue-800
            text-sm
          "
        >
          Ver
        </button>

      </div>

    </div>

    <div
      v-else
      class="text-gray-400"
    >
      Sin attachments
    </div>

  </div>

</template>