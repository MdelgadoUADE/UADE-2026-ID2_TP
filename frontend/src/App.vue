<script setup>
import { ref } from "vue";
import MapView from "./components/Map.vue";
import LoginForm from './components/LoginForm.vue'
import AppHeader from './components/AppHeader.vue'

const username = ref('juan.perez')

function logout() {

  isLogged.value = false
}

const reportResult = ref("");

const reportIds = ref([]);

const reportId = ref("");

const nearbyReports = ref([]);

const isLogged = ref(false)

function onLoginSuccess() {

  isLogged.value = true
}

async function getNearbyReports() {
  if (!reportId.value) {
    alert("Ingresá un ID");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/reports/near/${reportId.value}`,
    );

    const data = await response.json();

    nearbyReports.value = data;
  } catch (error) {
    console.error(error);

    alert("Error obteniendo reportes cercanos");
  }
}

async function createReport() {
  const report = {
    user: {
      user_id: "123",
      username: "vue.test",
    },

    notes: "Test desde Vue",

    attachments: [],

    tags: {
      test: true,
    },

    report_location: {
      type: "Point",
      coordinates: [-58.37, -34.6],
    },

    status: "active",

    is_anonymous: false,

    related_reports: [],

    trust_score: 0.99,
  };

  try {
    const response = await fetch("http://localhost:3000/reports", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(report),
    });

    const data = await response.json();

    alert(`Reporte insertado con ID: ${data._id}`);
  } catch (error) {
    console.error(error);

    alert("Error insertando reporte");
  }
}

async function getReport() {
  if (!reportId.value) {
    alert("Ingresá un ID");

    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/reports/${reportId.value}`,
    );

    const data = await response.json();

    reportResult.value = JSON.stringify(data, null, 2);
  } catch (error) {
    console.error(error);

    alert("Error obteniendo reporte");
  }
}

async function getAllReportIds() {
  try {
    const response = await fetch("http://localhost:3000/reports");

    const data = await response.json();

    reportIds.value = data.map((report) => report._id);
  } catch (error) {
    console.error(error);

    alert("Error obteniendo IDs");
  }
}
</script>

<template>
  <LoginForm 
    v-if="!isLogged"
    @login-success="onLoginSuccess"
  />

  <div v-else>
    <AppHeader
      :username="username"
      @logout="logout"
    />

    <div style="padding: 20px">
      <button @click="createReport">Crear Reporte</button>

      <hr />

      <button @click="getAllReportIds">Obtener Todos los IDs</button>

      <ul>
        <li v-for="id in reportIds" :key="id">
          {{ id }}
        </li>
      </ul>

      <hr />

      <input
        v-model="reportId"
        type="text"
        placeholder="Ingresar Report ID"
        style="width: 300px; padding: 8px"
      />

      <button @click="getReport">Obtener Reporte</button>

      <hr />

      <textarea
        v-model="reportResult"
        rows="20"
        cols="80"
        readonly
        style="font-family: monospace"
      ></textarea>
    </div>
    <div style="padding: 20px">
      <input
        v-model="reportId"
        placeholder="Ingresar Report ID"
        style="width: 300px; padding: 8px"
      />

      <button @click="getNearbyReports">Obtener reportes cercanos (50km)</button>

      <hr />

      <table border="1" cellpadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Coordenadas</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="r in nearbyReports" :key="r.id">
            <td>{{ r.id }}</td>
            <td>{{ r.username }}</td>
            <td>{{ r.coordinates }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <MapView />
  </div>
</template>
