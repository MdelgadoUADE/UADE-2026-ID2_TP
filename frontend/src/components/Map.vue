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
      /*
        RESPONSIVE CHANGE — popup button styles:
        The original button had zero inline styles, making it a plain browser-default
        button with ~24px height — far below the 44px minimum touch target.

        Added inline styles only (no external classes, since Leaflet popups render
        outside Vue's scoped CSS and outside Tailwind's purge scope):
        - padding: 10px 16px  → reaches ~44px total height for touch targets
        - font-size: 14px     → readable on small screens
        - border-radius: 6px  → matches the app's rounded-lg aesthetic
        - background/color    → matches the app's blue-600 (#2563eb) primary button
        - border: none        → removes browser default border
        - cursor: pointer     → explicit pointer for touch devices
        - width: 100%         → fills the popup width, easier to tap
        - margin-top: 8px     → spacing from the street label
        - font-weight: 600    → matches font-medium/semibold used app-wide

        No logic, event listeners, or behavior changed.
      */
      `
      <div style="min-width: 160px; padding: 4px 0;">
        <strong style="font-size: 14px; display: block; margin-bottom: 4px;">${street}</strong>
        <button
          id="crear-reporte-btn"
          style="
            display: block;
            width: 100%;
            margin-top: 8px;
            padding: 10px 16px;
            background-color: #2563eb;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            line-height: 1.2;
          "
        >
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
/*
  RESPONSIVE CHANGE — dynamic map height:

  Original: `height: 500px` — a fixed pixel value that ignores the viewport.
  Problems on mobile:
    • Portrait phone (320×568): 500px map leaves ~20px for anything else — barely fits.
    • Landscape phone (568×320): 500px taller than the viewport — map is clipped and
      the user can't see the full map without scrolling the entire page awkwardly.
    • The Leaflet map also needs an explicit height; `height: 100%` alone won't work
      because its parent containers don't have a fixed height set.

  Solution — three responsive tiers with CSS custom-property math:

  1. Mobile portrait  (<640px, Tailwind `sm` breakpoint):
     `height: clamp(280px, 55vh, 420px)`
     — At 320px wide / 568px tall: 55vh = ~312px. Fits well with the header
       (~60px) + page padding (2×12px) + ReportView title (~60px) = ~144px overhead,
       leaving 424px for the map. The clamp floor (280px) guarantees a usable map
       even on very short landscape phones.
     — clamp ceiling (420px) prevents the map from being too large on tall phones
       (e.g. iPhone 14 Pro Max portrait at 932px: 55vh = 513px > 420px ceiling, capped).

  2. Tablet (640px–1023px, Tailwind `md`):
     `height: clamp(380px, 60vh, 560px)`
     — Generous height for a bigger screen; capped so content below (if any) remains
       reachable.

  3. Desktop (1024px+, Tailwind `lg`):
     `height: 560px`
     — Fixed pixel value close to original (was 500px, now 560px for better use of
       available space). Desktop users have enough vertical room; a fixed value is
       simpler and avoids layout jumps on window resize.

  WHY NOT use Tailwind classes here:
  Tailwind's `h-*` utilities only cover fixed rem values and a few special ones
  (`h-screen`). The `clamp()` function requires raw CSS. The `<style scoped>` block
  is the correct place for this, exactly as in the original file.

  NO JS logic, NO Leaflet API, NO event handlers were changed.
*/
#map {
  width: 100%;
  height: clamp(280px, 55vh, 420px);
}

@media (min-width: 640px) {
  #map {
    height: clamp(380px, 60vh, 560px);
  }
}

@media (min-width: 1024px) {
  #map {
    height: 560px;
  }
}
</style>