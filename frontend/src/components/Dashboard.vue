<script setup>

import { ref } from 'vue'

import ReportView from './ReportView.vue'
import SearchView from './SearchView.vue'
import AppHeader from './AppHeader.vue'

defineProps({
  username: String
})

const emit = defineEmits([
  'logout'
])

const activeTab = ref('reportar')

function changeTab(tab) {

  activeTab.value = tab
}

</script>

<template>

  <div
    class="min-h-screen bg-gray-100"
  >

    <AppHeader
      :username="username"
      :activeTab="activeTab"
      @logout="emit('logout')"
      @change-tab="changeTab"
    />

    <main
      class="p-6"
    >

      <ReportView
        v-if="activeTab === 'reportar'"
      />

      <SearchView
        v-if="activeTab === 'buscar'"
      />

    </main>

  </div>

</template>