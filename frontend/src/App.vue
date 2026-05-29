<script setup>

import { ref, provide } from 'vue'

import LoginForm from './components/LoginForm.vue'
import RegisterForm from './components/RegisterForm.vue'
import Dashboard from './components/Dashboard.vue'

const isLogged = ref(false)
const currentUser = ref(null)
const isEmergencyMode = ref(false)
const view = ref('login') // 'login' | 'register'


provide('currentUser', currentUser)
provide('isEmergencyMode', isEmergencyMode)

function onLoginSuccess(user) {
  currentUser.value = user     // user tiene: user_id, username, surname, email, role
  isLogged.value = true
}

function onRegisterSuccess() {
  // Tras registrarse exitosamente, volver al login
  view.value = 'login'
}

// Emergency Mode
function onEnterEmergency() {
  isEmergencyMode.value = true
}

function onExitEmergency() {
  isEmergencyMode.value = false
}

function logout() {
  isLogged.value = false
  currentUser.value = null
}

</script>

<template>
  <!-- MODO EMERGENCIA -->
  <Dashboard
    v-if="isEmergencyMode"
    :username="null"
    :emergency-mode="true"
    @logout="onExitEmergency"
  />

  <!-- FLUJO NORMAL -->
  <template v-else-if="!isLogged">
    <LoginForm
      v-if="view === 'login'"
      @login-success="onLoginSuccess"
      @go-to-register="view = 'register'"
      @enter-emergency="onEnterEmergency"
    />
    <RegisterForm
      v-else
      @register-success="onRegisterSuccess"
      @go-to-login="view = 'login'"
    />
  </template>

  <Dashboard
    v-else
    :username="currentUser.username"
    :emergency-mode="false"
    @logout="logout"
  />
</template>