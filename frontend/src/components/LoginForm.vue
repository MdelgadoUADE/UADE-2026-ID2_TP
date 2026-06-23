<script setup>
import { ref } from 'vue'


import {
  MapPin,
  Shield,
  AlertTriangle
} from 'lucide-vue-next'

const emit = defineEmits(['login-success', 'go-to-register', 'enter-emergency'])
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


// Reportes anonimos
function enterEmergencyMode() {
  emit('enter-emergency')
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
  <!--
    RESPONSIVE CHANGES:
    - Outer wrapper: added `overflow-y-auto` to prevent content clipping in landscape
      mobile; kept `min-h-screen`, `flex`, `items-center`, `justify-center`, `bg-gray-100`, `p-4`
    - Inner stack: reduced gap from `space-y-8` → `space-y-4 sm:space-y-8` so the
      logo + card + emergency block fit without scrolling on small-height viewports
      (e.g. iPhone SE landscape 568px tall)
  -->
  <div class="min-h-screen overflow-y-auto flex items-center justify-center bg-gray-100 p-4">

    <div class="w-full max-w-md space-y-4 sm:space-y-8 py-4">

      <!-- Logo
        RESPONSIVE CHANGES:
        - Icon container: `w-12 h-12 sm:w-16 sm:h-16` — slightly smaller on mobile to
          save vertical space; rounded-2xl and bg-blue-600 preserved
        - Icon size: `w-6 h-6 sm:w-8 sm:h-8` matching the container reduction
        - Title: `text-2xl sm:text-3xl` — reduces on 320px to prevent overflow
      -->
      <div class="text-center">

        <div class="flex justify-center mb-4">

          <div
            class="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-600"
          >
            <MapPin class="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>

        </div>

        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
          Report-IT
        </h1>

        <p class="text-gray-500 mt-2">
          Secure-IT
        </p>

      </div>

      <!-- Login Card
        RESPONSIVE CHANGES:
        - Card padding: `p-4 sm:p-6` — saves 8px per side on 320px screens
          (was `p-6` always). All visual styles (rounded-2xl, shadow-lg, border) preserved.
      -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">

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

            <!--
              RESPONSIVE CHANGES:
              - Added `py-3 sm:py-2` — 44px minimum touch target on mobile (py-3 = 12px
                top + 12px bottom + ~20px line-height ≈ 44px). Desktop keeps the original
                `py-2`. All other classes preserved.
            -->
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              class="w-full rounded-lg border border-gray-300 px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <!--
              RESPONSIVE CHANGES:
              - Same `py-3 sm:py-2` touch-target fix as email input.
            -->
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="********"
              class="w-full rounded-lg border border-gray-300 px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          <!-- Error -->
          <p
            v-if="error"
            class="text-sm text-red-500 text-center"
          >
            {{ error }}
          </p>

          <!-- Submit
            RESPONSIVE CHANGES:
            - Added `py-3 sm:py-2` — ensures the primary CTA button meets 44px touch
              target on mobile. Desktop appearance unchanged. `w-full`, `bg-blue-600`,
              `hover:bg-blue-700`, `text-white`, `rounded-lg`, `transition-colors` preserved.
          -->
          <button
            type="submit"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-2 rounded-lg transition-colors"
            :disabled="isLoading"
          >
            {{
              isLoading
                ? 'Ingresando...'
                : 'Ingresar'
            }}
          </button>

        </form>


        <!--
          RESPONSIVE CHANGES:
          - "Registrate" inline button: added `py-1 px-1` to expand its tap area without
            affecting visual appearance. `text-blue-600`, `hover:underline`, `font-medium`
            preserved.
        -->
        <div class="mt-4 text-center text-sm text-gray-500">
          ¿No tenés cuenta?
          <button type="button" @click="emit('go-to-register')" class="text-blue-600 hover:underline font-medium ml-1 py-1 px-1">
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

      <!-- Emergency Mode
        RESPONSIVE CHANGES:
        - Button inner layout: added `flex-wrap` so that on very narrow screens
          (320px) the icon + text wrap gracefully instead of overflowing.
        - `py-3 sm:py-2` on the button for touch-target on mobile.
        - All other styles (border-red-300, bg-red-50, rounded-2xl, p-6,
          text-red-600, hover:text-red-500) preserved.
      -->
      <div
        class="border border-red-300 bg-red-50 rounded-2xl p-4 sm:p-6"
      >

        <button
          @click="enterEmergencyMode"
          class="w-full flex items-center justify-center gap-3 flex-wrap text-red-600 hover:text-red-500 transition-colors py-1"
        >

          <AlertTriangle class="w-5 h-5 shrink-0" />

          <span class="font-medium text-sm sm:text-base">
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