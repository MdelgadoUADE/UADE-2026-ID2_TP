<script setup>
import { ref } from 'vue'
import { MapPin, Shield } from 'lucide-vue-next'
import { API_URL } from '../api.js'

const emit = defineEmits(['register-success', 'go-to-login'])

const username = ref('')
const surname = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const isLoading = ref(false)

async function handleSubmit() {
  error.value = ''

  if (!username.value || !surname.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = 'Por favor completa todos los campos'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  if (password.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  isLoading.value = true

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        surname: surname.value,
        email: email.value,
        password: password.value
      })
    })

    const data = await response.json()

    if (!data.success) {
      error.value = data.message || 'Error al registrar usuario'
      return
    }

    emit('register-success') // registro OK, volver al login

  } catch (e) {
    error.value = 'Error de conexión con el servidor'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md space-y-8">

      <!-- Logo -->
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <div class="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600">
            <MapPin class="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">Report-IT</h1>
        <p class="text-gray-500 mt-2">Secure-IT</p>
      </div>

      <!-- Register Card -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">

        <div class="space-y-1 pb-4">
          <h2 class="text-2xl text-center font-semibold text-gray-900">Crear cuenta</h2>
          <p class="text-center text-gray-500">Completá tus datos para registrarte</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">

          <div>
            <label class="block text-sm font-medium mb-1">Usuario</label>
            <input
              v-model="username"
              type="text"
              placeholder="juanperez"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Apellido</label>
            <input
              v-model="surname"
              type="text"
              placeholder="Perez"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Correo electrónico</label>
            <input
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Contraseña</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Confirmar contraseña</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="••••••••"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p v-if="error" class="text-sm text-red-500 text-center">{{ error }}</p>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {{ isLoading ? 'Registrando...' : 'Crear cuenta' }}
          </button>

        </form>

        <div class="mt-4 text-center text-sm text-gray-500">
          ¿Ya tenés cuenta?
          <button
            @click="emit('go-to-login')"
            class="text-blue-600 hover:underline font-medium ml-1"
          >
            Iniciá sesión
          </button>
        </div>

        <div class="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Shield class="w-4 h-4" />
          <span>Conexión segura</span>
        </div>

      </div>
    </div>
  </div>
</template>