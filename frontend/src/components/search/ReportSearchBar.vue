<script setup>

import { ref, watch } from 'vue'

import {
  Search,
  X,
  RefreshCw
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue',
  'search',
  'refresh'
])

const localValue = ref(props.modelValue)

watch(
  () => props.modelValue,
  value => {
    localValue.value = value
  }
)

function updateValue(value) {

  localValue.value = value

  emit('update:modelValue', value)
  emit('search', value)
}

function clearSearch() {

  updateValue('')
}

function handleRefresh() {

  emit('refresh')
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
      p-4
      mb-6
    "
  >

    <div
      class="
        flex
        items-center
        gap-3
      "
    >

      <!-- ICON -->
      <div
        class="
          flex
          items-center
          justify-center
          w-10
          h-10
          rounded-xl
          bg-blue-600
        "
      >
        <Search class="w-5 h-5 text-white" />
      </div>

      <!-- INPUT -->
      <div class="flex-1 relative">

        <input
          :value="localValue"
          @input="updateValue($event.target.value)"
          type="text"
          placeholder="Buscar por usuario, tags, estado..."
          class="
            w-full
            rounded-xl
            border
            border-gray-300
            px-4
            py-3
            pr-10
            text-sm
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:border-blue-500
          "
        />

        <!-- CLEAR -->
        <button
          v-if="localValue"
          @click="clearSearch"
          class="
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            text-gray-400
            hover:text-gray-600
          "
        >
          <X class="w-4 h-4" />
        </button>

      </div>

      <!-- REFRESH BUTTON -->
      <button
        @click="handleRefresh"
        :disabled="loading"
        class="
          flex
          items-center
          justify-center
          w-10
          h-10
          rounded-xl
          bg-gray-100
          hover:bg-gray-200
          disabled:opacity-50
          disabled:cursor-not-allowed
          transition-colors
        "
        title="Actualizar reportes"
      >
        <RefreshCw
          class="w-5 h-5 text-gray-700"
          :class="{ 'animate-spin': loading }"
        />
      </button>

    </div>

    <!-- HELP -->
    <p
      class="
        mt-3
        text-xs
        text-gray-500
      "
    >
      Buscá reportes por usuario, estado o contenido de tags
    </p>

  </div>

</template>