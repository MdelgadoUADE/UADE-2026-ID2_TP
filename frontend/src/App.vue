<script setup>

import { ref } from 'vue'

import LoginForm from './components/LoginForm.vue'
import RegisterForm from './components/RegisterForm.vue'
import Dashboard from './components/Dashboard.vue'

const isLogged = ref(false)
const currentUser = ref(null)
const view = ref('login') // 'login' | 'register'


function onLoginSuccess(user) {
  currentUser.value = user     // user tiene: user_id, username, surname, email, role
  isLogged.value = true
}

function onRegisterSuccess() {
  // Tras registrarse exitosamente, volver al login
  view.value = 'login'
}

function logout() {
  isLogged.value = false
  currentUser.value = null
}

</script>

<template>
  <template v-if="!isLogged">

    <LoginForm
      v-if="view === 'login'"
      @login-success="onLoginSuccess"
      @go-to-register="view = 'register'"
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
    @logout="logout"
  />
</template>