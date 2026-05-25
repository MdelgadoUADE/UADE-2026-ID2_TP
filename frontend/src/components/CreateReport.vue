<script setup>
import { ref, onMounted, computed } from "vue";

const props = defineProps({
  visible: Boolean,
  street: String,
  lat: Number,
  lng: Number,
});

const emit = defineEmits(["close"]);

const tags = ref([]);
const selectedTag = ref("");

const useCustomTag = ref(false);
const customTag = ref("");
const customDescription = ref("");
const notes = ref("");

const isSubmitting = ref(false);

const isSelectDisabled = computed(() => useCustomTag.value);

onMounted(async () => {
  try {
    const response = await fetch("http://localhost:3000/tags");

    const data = await response.json();

    if (data.success) {
      tags.value = data.tags;
    }
  } catch (error) {
    console.error("Failed to load tags:", error);
  }
});

async function handleSubmit() {
  try {
    isSubmitting.value = true;

    let tagToUse = selectedTag.value;

    /* Creando tag si no existe */
    if (useCustomTag.value) {
      if (!customTag.value.trim()) {
        alert("Debes ingresar un nombre de tag");
        return;
      }

      const tagResponse = await fetch("http://localhost:3000/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          canonical_name: customTag.value,
          description: customDescription.value,
          type: "otros",
        }),
      });

      const tagData = await tagResponse.json();

      if (!tagData.success) {
        throw new Error("No se pudo crear el tag");
      }

      tagToUse = tagData.tag.canonical_name;
    }

    /* Creando reporte */

    const reportResponse = await fetch("http://localhost:3000/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notes: notes.value,

        tags: {
          main: tagToUse,
        },

        report_location: {
          type: "Point",
          coordinates: [props.lng, props.lat],
        },
      }),
    });

    const reportData = await reportResponse.json();

    if (!reportData.success) {
      throw new Error("No se pudo crear el reporte");
    }

    alert("Reporte enviado");

    emit("close");

    /*
      Reset form
    */
    selectedTag.value = "";
    customTag.value = "";
    customDescription.value = "";
    notes.value = "";
    useCustomTag.value = false;
  } catch (error) {
    console.error(error);

    alert("Ocurrió un error enviando el reporte");
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center md:p-4"
  >
    <!-- Modal -->
    <div
      class="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-xl md:rounded-2xl md:shadow-2xl overflow-y-auto flex flex-col p-6 gap-5"
    >
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button
          @click="emit('close')"
          class="text-gray-500 hover:text-black text-lg"
        >
          ✕
        </button>

        <h2 class="text-2xl font-bold">Crear Reporte</h2>
      </div>

      <!-- Location card -->
      <section class="border rounded-xl p-4 bg-blue-50">
        <h3 class="font-semibold text-lg mb-2">Ubicación</h3>

        <p class="text-gray-700">
          {{ street }}
        </p>
      </section>

      <!-- Notes -->
      <section class="border rounded-xl p-4">
        <h3 class="font-semibold text-lg mb-4">Notas</h3>

        <textarea
          v-model="notes"
          rows="4"
          placeholder="Escribe información adicional..."
          class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </section>

      <!-- Tags -->
      <section class="border rounded-xl p-4">
        <h3 class="font-semibold text-lg mb-4">Etiquetas</h3>

        <!-- Existing tag selector -->
        <div class="mb-4">
          <label class="block mb-2 font-medium"> Etiqueta existente </label>

          <select
            v-model="selectedTag"
            :disabled="isSelectDisabled"
            class="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option disabled value="">Seleccione una opción</option>

            <option
              v-for="tag in tags"
              :key="tag._id"
              :value="tag.canonical_name"
            >
              {{ tag.canonical_name }}
            </option>
          </select>
        </div>

        <!-- Custom tag checkbox -->
        <div class="flex items-center gap-2 mb-4">
          <input
            id="customTag"
            type="checkbox"
            v-model="useCustomTag"
            class="h-4 w-4"
          />

          <label for="customTag"> Custom tag </label>
        </div>

        <!-- Custom fields -->
        <template v-if="useCustomTag">
          <div class="space-y-4">
            <div>
              <label class="block mb-2 font-medium"> Custom tag </label>

              <input
                v-model="customTag"
                type="text"
                placeholder="custom tag"
                class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block mb-2 font-medium"> Custom description </label>

              <textarea
                v-model="customDescription"
                rows="3"
                placeholder="custom description"
                class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </template>
      </section>

      <!-- Footer -->
      <div class="flex justify-end gap-3 pt-2">
        <button
          @click="emit('close')"
          class="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>

        <button
          @click="handleSubmit"
          :disabled="isSubmitting"
          class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {{ isSubmitting ? "Enviando..." : "Enviar Reporte" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea {
  resize: vertical;
}
</style>
