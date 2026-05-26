<script setup>
import { ref, onMounted } from "vue";

//importacion de modal de reporte
import CreateReport from "./CreateReport.vue";

//importacion de mapa utilizado para la herramienta
import L from "leaflet";
import "leaflet/dist/leaflet.css";

let map;

const showReportModal = ref(false);
const selectedStreet = ref("");

const selectedLat = ref(null);
const selectedLng = ref(null);

//funcion manejadora del mapa
onMounted(() => {
  // Default center
  map = L.map("map", {
    minZoom: 14,
    maxZoom: 17,
  }).setView([-34.6037, -58.3816], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  //get user location if browser supports geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        console.log("Locacion de usuario:", lat, lng);

        // Move map to user location
        map.setView([lat, lng], 17);

        const radius = 0.01;

        const bounds = L.latLngBounds(
          [lat - radius, lng - radius],
          [lat + radius, lng + radius],
        );

        map.setMaxBounds(bounds);

        // Add marker
        //L.marker([lat, lng]).addTo(map).bindPopup("estas aqui!").openPopup();
      },
      (error) => {
        console.error("Geolocation error:", error);
        window.alert(
          "Hubo un error consiguiendo la localizacion actual, por favor revisar que el navegador permita la geolocalizacion",
        );
      },
    );
  } else {
    console.log("Geolocation not supported");
  }

  //limitador de consultas Nominatim permite 1 request por segundo
  let lastClick = 0;

  map.on("click", async (e) => {
    // se chequea que no exceda el limite de request
    const now = Date.now();

    if (now - lastClick < 1000) return;

    lastClick = now;
    //

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    console.log("Click en mapa:", lat, lng);

    try {
      const response = await fetch(
        `http://localhost:3000/map/reverse-geocode?lat=${lat}&lng=${lng}`,
      );

      const data = await response.json();

      showPopup(lat, lng, data.street);
    } catch (error) {
      showPopup(lat, lng, "No se pudo obtener la calle");
      console.error(error);
    }
  });
});
function showPopup(lat, lng, street) {
  L.popup()
    .setLatLng([lat, lng])
    .setContent(
      `
      <div>
        <strong>${street}</strong>
        <br><br>
        <button id="crear-reporte-btn">
          Crear reporte
        </button>
      </div>
    `,
    )
    .openOn(map);

  setTimeout(() => {
    const btn = document.getElementById("crear-reporte-btn");

    if (btn) {
      btn.addEventListener("click", () => {
        map.closePopup();

        selectedLat.value = lat;
        selectedLng.value = lng;

        showReportModal.value = true;
        selectedStreet.value = street;
      });
    }
  }, 0);
}
</script>

<template>
  <div id="map"></div>

  <CreateReport
    :visible="showReportModal"
    :street="selectedStreet"
    :lat="selectedLat"
    :lng="selectedLng"
    @close="showReportModal = false"
  />
</template>

<style scoped>
#map {
  height: 500px;
  width: 100%;
}
</style>
