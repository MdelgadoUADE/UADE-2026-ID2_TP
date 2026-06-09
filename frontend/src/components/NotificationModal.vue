<script setup>
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  type: {
    type: String,
    default: 'success', // 'success', 'error', 'warning'
    validator: (value) => ['success', 'error', 'warning'].includes(value)
  },
  title: String,
  message: String,
  autoClose: {
    type: Boolean,
    default: false
  },
  autoCloseDelay: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['close'])

const iconComponent = computed(() => {
  switch (props.type) {
    case 'success':
      return CheckCircle
    case 'error':
      return XCircle
    case 'warning':
      return AlertCircle
    default:
      return CheckCircle
  }
})

const colorClasses = computed(() => {
  switch (props.type) {
    case 'success':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        title: 'text-green-900',
        message: 'text-green-700',
        button: 'bg-green-600 hover:bg-green-700'
      }
    case 'error':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        title: 'text-red-900',
        message: 'text-red-700',
        button: 'bg-red-600 hover:bg-red-700'
      }
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        title: 'text-yellow-900',
        message: 'text-yellow-700',
        button: 'bg-yellow-600 hover:bg-yellow-700'
      }
    default:
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        title: 'text-green-900',
        message: 'text-green-700',
        button: 'bg-green-600 hover:bg-green-700'
      }
  }
})

// Auto-close functionality
if (props.autoClose && props.visible) {
  setTimeout(() => {
    emit('close')
  }, props.autoCloseDelay)
}
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="visible"
      class="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <Transition
        enter-active-class="transition-all duration-200"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-200"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="visible"
          :class="[
            'bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2',
            colorClasses.border
          ]"
        >
          <!-- Close button -->
          <button
            @click="emit('close')"
            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>

          <!-- Content -->
          <div class="flex flex-col items-center text-center gap-4">
            <!-- Icon -->
            <div :class="['rounded-full p-3', colorClasses.bg]">
              <component
                :is="iconComponent"
                :class="['w-12 h-12', colorClasses.icon]"
              />
            </div>

            <!-- Title -->
            <h3
              v-if="title"
              :class="['text-2xl font-bold', colorClasses.title]"
            >
              {{ title }}
            </h3>

            <!-- Message -->
            <p
              v-if="message"
              :class="['text-base', colorClasses.message]"
            >
              {{ message }}
            </p>

            <!-- Action button -->
            <button
              @click="emit('close')"
              :class="[
                'mt-2 px-6 py-2.5 rounded-lg text-white font-medium transition-colors w-full',
                colorClasses.button
              ]"
            >
              Aceptar
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>