<script setup>
import { ref } from 'vue'
import { MapPin, Shield } from 'lucide-vue-next'

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
    const response = await fetch('http://localhost:3000/auth/register', {
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
  <!--
    RESPONSIVE CHANGES:
    - Outer wrapper: added `overflow-y-auto` so that on short-viewport mobile devices
      (landscape phones, small Android devices) the 5-field form scrolls naturally
      within the page without the content being clipped. `min-h-screen`, `flex`,
      `items-center`, `justify-center`, `bg-gray-100`, `p-4` are unchanged.
    - Changed `items-center` → `items-start sm:items-center` so that on short screens
      the form starts from the top and is scrollable, while on tablets/desktops it
      remains vertically centered as before.
  -->
  <div class="min-h-screen overflow-y-auto flex items-start sm:items-center justify-center bg-gray-100 p-4">

    <!--
      RESPONSIVE CHANGES:
      - Inner stack gap: `space-y-4 sm:space-y-8` — reduces the gap between logo
        and card on mobile to avoid content being pushed off the visible area.
        Desktop keeps the original `space-y-8`.
      - Added `py-4` so the content has breathing room when scrolling on short screens.
    -->
    <div class="w-full max-w-md space-y-4 sm:space-y-8 py-4">

      <!-- Logo
        RESPONSIVE CHANGES:
        - Icon container: `w-12 h-12 sm:w-16 sm:h-16` — slightly smaller on mobile
          to recover vertical space for the 5-field form. Color, shape preserved.
        - Icon size: `w-6 h-6 sm:w-8 sm:h-8` to match the container.
        - Title: `text-2xl sm:text-3xl` — prevents overflow on 320px screens.
      -->
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <div class="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-600">
            <MapPin class="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Report-IT</h1>
        <p class="text-gray-500 mt-2">Secure-IT</p>
      </div>

      <!-- Register Card
        RESPONSIVE CHANGES:
        - Card padding: `p-4 sm:p-6` — on 320px screens this recovers 8px per side
          (16px total width), preventing any risk of the card clipping the viewport.
          All visual styles (rounded-2xl, shadow-lg, border, bg-white) are unchanged.
      -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">

        <div class="space-y-1 pb-4">
          <h2 class="text-2xl text-center font-semibold text-gray-900">Crear cuenta</h2>
          <p class="text-center text-gray-500">Completá tus datos para registrarte</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">

          <!--
            RESPONSIVE CHANGES (all 5 inputs):
            - `py-3 sm:py-2` on every input to reach the 44px minimum touch target
              on mobile (12px + 12px padding + ~20px line-height ≈ 44px).
              On sm+ breakpoints (768px+) reverts to the original `py-2`.
              All other classes (w-full, rounded-lg, border-gray-300, px-3,
              focus:outline-none, focus:ring-2, focus:ring-blue-500) are unchanged.
          -->
          <div>
            <label class="block text-sm font-medium mb-1">Usuario</label>
            <input
              v-model="username"
              type="text"
              placeholder="juanperez"
              class="w-full rounded-lg border border-gray-300 px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Apellido</label>
            <input
              v-model="surname"
              type="text"
              placeholder="Perez"
              class="w-full rounded-lg border border-gray-300 px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Correo electrónico</label>
            <input
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              class="w-full rounded-lg border border-gray-300 px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Contraseña</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full rounded-lg border border-gray-300 px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Confirmar contraseña</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="••••••••"
              class="w-full rounded-lg border border-gray-300 px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p v-if="error" class="text-sm text-red-500 text-center">{{ error }}</p>

          <!--
            RESPONSIVE CHANGES:
            - Submit button: `py-3 sm:py-2` for 44px touch target on mobile.
              All other classes (w-full, bg-blue-600, hover:bg-blue-700, text-white,
              rounded-lg, transition-colors, disabled:opacity-50) are unchanged.
          -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {{ isLoading ? 'Registrando...' : 'Crear cuenta' }}
          </button>

        </form>

        <!--
          RESPONSIVE CHANGES:
          - "Iniciá sesión" inline button: added `py-1 px-1` to expand the tap area
            on touch devices without changing its visual appearance.
        -->
        <div class="mt-4 text-center text-sm text-gray-500">
          ¿Ya tenés cuenta?
          <button
            @click="emit('go-to-login')"
            class="text-blue-600 hover:underline font-medium ml-1 py-1 px-1"
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