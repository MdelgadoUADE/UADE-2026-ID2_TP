<script setup>

import { ref, provide } from 'vue'

import LoginForm from './components/LoginForm.vue'
import RegisterForm from './components/RegisterForm.vue'
import Dashboard from './components/Dashboard.vue'

const isLogged = ref(false)
const currentUser = ref(null)
const view = ref('login') // 'login' | 'register' | 'emergency'
const emergencyMode = ref(false)

provide('currentUser', currentUser)

function onLoginSuccess(user) {
  currentUser.value = user     // user tiene: user_id, username, surname, email, role
  isLogged.value = true
  emergencyMode.value = false
}

function onRegisterSuccess() {
  // Tras registrarse exitosamente, volver al login
  view.value = 'login'
}

function logout() {
  isLogged.value = false
  currentUser.value = null
  emergencyMode.value = false
}

function enterEmergencyMode() {
  emergencyMode.value = true
  currentUser.value = null
  isLogged.value = false
}

function exitEmergencyMode() {
  emergencyMode.value = false
  view.value = 'login'
}

</script>

<template>
  <!-- Login/Register Screen -->
  <template v-if="!isLogged && !emergencyMode">

    <LoginForm
      v-if="view === 'login'"
      @login-success="onLoginSuccess"
      @go-to-register="view = 'register'"
      @emergency-mode="enterEmergencyMode"
    />

    <RegisterForm
      v-else
      @register-success="onRegisterSuccess"
      @go-to-login="view = 'login'"
    />

  </template>

  <!-- Dashboard (logged in or emergency mode) -->
  <Dashboard
    v-else
    :username="currentUser?.username || 'Usuario Anónimo'"
    :is-emergency="emergencyMode"
    @logout="logout"
    @exit-emergency="exitEmergencyMode"
  />
</template>