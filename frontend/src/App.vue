<script setup>

import { ref } from 'vue'

import LoginForm from './components/LoginForm.vue'
import Dashboard from './components/Dashboard.vue'

const isLogged = ref(false)

const username = ref('juan.perez')

function onLoginSuccess() {

  isLogged.value = true
}

function logout() {

  isLogged.value = false
}

</script>

<template>

  <!-- LOGIN -->
  <LoginForm
    v-if="!isLogged"
    @login-success="onLoginSuccess"
  />

  <!-- DASHBOARD -->
  <Dashboard
    v-else
    :username="username"
    @logout="logout"
  />

</template>