<script setup>
import { onMounted } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

onMounted(() => {
  const map = L.map("map", {
    minZoom: 14,
    maxZoom: 17,
  }).setView([-34.6037, -58.3816], 15);
  // Default center

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
        L.marker([lat, lng]).addTo(map).bindPopup("estas aqui!").openPopup();
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
});
</script>

<template>
  <div id="map"></div>
</template>

<style scoped>
#map {
  height: 500px;
  width: 100%;
}
</style>
