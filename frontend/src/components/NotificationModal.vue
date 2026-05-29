<script setup>
import { ref, watch } from 'vue'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'info', // 'success', 'error', 'warning', 'info'
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: 'Aceptar'
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  },
  showCancel: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

const isVisible = ref(props.show)

watch(() => props.show, (newVal) => {
  isVisible.value = newVal
})

function handleConfirm() {
  emit('confirm')
  close()
}

function handleCancel() {
  emit('cancel')
  close()
}

function close() {
  isVisible.value = false
  emit('close')
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    buttonColor: 'bg-green-600 hover:bg-green-700'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    buttonColor: 'bg-red-600 hover:bg-red-700'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    buttonColor: 'bg-blue-600 hover:bg-blue-700'
  }
}
</script>

<template>
  <Transition name="modal">
    <div
      v-if="isVisible"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      @click.self="close"
    >
      <div
        class="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all"
        @click.stop
      >
        <!-- Header -->
        <div :class="['p-6 border-b', typeConfig[type].borderColor]">
          <div class="flex items-start gap-4">
            <component
              :is="typeConfig[type].icon"
              :class="['w-6 h-6 flex-shrink-0', typeConfig[type].iconColor]"
            />
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ title }}
              </h3>
            </div>
            <button
              @click="close"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Body -->
        <div :class="['p-6', typeConfig[type].bgColor]">
          <p class="text-gray-700 whitespace-pre-line">
            {{ message }}
          </p>
        </div>

        <!-- Footer -->
        <div class="p-6 bg-gray-50 rounded-b-lg flex gap-3 justify-end">
          <button
            v-if="showCancel"
            @click="handleCancel"
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {{ cancelText }}
          </button>
          <button
            @click="handleConfirm"
            :class="['px-4 py-2 text-white rounded-lg transition-colors', typeConfig[type].buttonColor]"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.9);
}
</style>