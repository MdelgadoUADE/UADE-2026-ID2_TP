<script setup>
import { ref } from 'vue'


import {
  MapPin,
  Shield,
  AlertTriangle
} from 'lucide-vue-next'

const emit = defineEmits(['login-success', 'go-to-register'])
const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

async function login(emailValue, passwordValue) {
  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailValue, password: passwordValue })
    })

    const data = await response.json()

    if (!data.success) {
      error.value = data.message || 'Credenciales inválidas'
      return false
    }

    emit('login-success', data.user)  // <-- pasar el usuario completo al padre
    return true

  } catch (e) {
    error.value = 'Error de conexión con el servidor'
    return false
  }
}


function enterEmergencyMode() {

  alert('Modo emergencia')
}

async function handleSubmit(e) {

  error.value = ''

  if (!email.value || !password.value) {

    error.value = 'Por favor completa todos los campos'

    return
  }

  isLoading.value = true
  await login(email.value, password.value)
  isLoading.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">

    <div class="w-full max-w-md space-y-8">

      <!-- Logo -->
      <div class="text-center">

        <div class="flex justify-center mb-4">

          <div
            class="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600"
          >
            <MapPin class="w-8 h-8 text-white" />
          </div>

        </div>

        <h1 class="text-3xl font-bold text-gray-900">
          Report-IT
        </h1>

        <p class="text-gray-500 mt-2">
          Secure-IT
        </p>

      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">

        <div class="space-y-1 pb-4">

          <h2 class="text-2xl text-center font-semibold text-gray-900">
            Iniciar Sesion
          </h2>

          <p class="text-center text-gray-500">
            Ingresa tus credenciales para acceder
          </p>

        </div>

        <form
          @submit.prevent="handleSubmit"
          class="space-y-4"
        >

          <!-- Email -->
          <div>

            <label
              for="email"
              class="block text-sm font-medium mb-1"
            >
              Correo electronico
            </label>

            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          <!-- Password -->
          <div>

            <label
              for="password"
              class="block text-sm font-medium mb-1"
            >
              Contrasena
            </label>

            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="********"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          <!-- Error -->
          <p
            v-if="error"
            class="text-sm text-red-500 text-center"
          >
            {{ error }}
          </p>

          <!-- Submit -->
          <button
            type="submit"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
            :disabled="isLoading"
          >
            {{
              isLoading
                ? 'Ingresando...'
                : 'Ingresar'
            }}
          </button>

        </form>


      <div class="mt-4 text-center text-sm text-gray-500">
          ¿No tenés cuenta?
          <button type="button" @click="emit('go-to-register')" class="text-blue-600 hover:underline font-medium ml-1">
            Registrate
          </button>
        </div>

        <!-- Secure -->
        <div
          class="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500"
        >
          <Shield class="w-4 h-4" />

          <span>
            Conexion segura
          </span>
        </div>

      </div>

      <!-- Emergency Mode -->
      <div
        class="border border-red-300 bg-red-50 rounded-2xl p-6"
      >

        <button
          @click="enterEmergencyMode"
          class="w-full flex items-center justify-center gap-3 text-red-600 hover:text-red-500 transition-colors"
        >

          <AlertTriangle class="w-5 h-5" />

          <span class="font-medium">
            Modo de emergencia disponible sin inicio de sesion
          </span>

        </button>

        <p class="text-xs text-gray-500 text-center mt-2">
          Solo permite generar reportes desde el mapa
        </p>

      </div>

    </div>

  </div>
</template>