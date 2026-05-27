<script setup>

import { ref } from 'vue'

import LoginForm from './components/LoginForm.vue'
import Dashboard from './components/Dashboard.vue'

const isLogged = ref(false)

const currentUser = ref(null)  

function onLoginSuccess(user) {
  currentUser.value = user     // user tiene: user_id, username, surname, email, role
  isLogged.value = true
}

function logout() {
  isLogged.value = false
  currentUser.value = null
}

</script>

<template>
  <LoginForm
    v-if="!isLogged"
    @login-success="onLoginSuccess"
  />

  <Dashboard
    v-else
    :username="currentUser.username"
    @logout="logout"
  />
</template>