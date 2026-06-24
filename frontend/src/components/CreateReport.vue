<script setup>
import { ref, onMounted, computed, inject, watch } from "vue";
import { Car, User, Building2, MapPin, AlertTriangle } from "lucide-vue-next";
import {
  TAG_INPUT_CONFIG,
  DEFAULT_TAG_CONFIG,
} from "../config/tagInputConfig.js";
import NotificationModal from "./NotificationModal.vue";
import { API_URL } from "../api.js";

const props = defineProps({
  visible: Boolean,
  street: String,
  lat: Number,
  lng: Number,
});

const emit = defineEmits(["close"]);

const currentUser = inject("currentUser");
const isEmergencyMode = inject("isEmergencyMode"); // Esto deberia servir para usarlo al bloqueal multimedia en emergencia

// Tags
const allTags = ref([]);
const selectedCategory = ref("");
const selectedTag = ref("");
const selectedTagValue = ref("");
const addedTags = ref([]);
const customTags = ref([]);
const customTag = ref("");
const customValue = ref("");
const showCustomTagForm = ref(false);

// Categorías disponibles basadas en el tipo del schema
const categories = [
  { value: "vehiculo", label: "Vehículo", icon: Car },
  { value: "persona", label: "Persona", icon: User },
  { value: "ambiente", label: "Ambiente", icon: Building2 },
  { value: "otros", label: "Otros", icon: MapPin },
];

// Tags filtrados según la categoría seleccionada
const filteredTags = computed(() =>
  allTags.value.filter((t) => t.type === selectedCategory.value),
);

const notes = ref("");

const isSubmitting = ref(false);

const isSelectDisabled = computed(() => useCustomTag.value);

// Notification modal state
const notification = ref({
  visible: false,
  type: "success",
  title: "",
  message: "",
});

function showNotification(type, title, message) {
  notification.value = {
    visible: true,
    type,
    title,
    message,
  };
}

function closeNotification() {
  notification.value.visible = false;

  if (notification.value.type === "success") {
    emit("close");
  }
}

// manejo de archivos
const selectedFiles = ref([]);
const fileInput = ref(null);

function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  selectedFiles.value = [...selectedFiles.value, ...files];
  if (fileInput.value) fileInput.value.value = "";
}

function removeFile(index) {
  selectedFiles.value.splice(index, 1);
}

// Computed que devuelve la config del tag actualmente seleccionado
const currentTagConfig = computed(() => {
  if (!selectedTag.value) return null;
  return TAG_INPUT_CONFIG[selectedTag.value] ?? DEFAULT_TAG_CONFIG;
});

// Computed que chequea si el tag actual ya fue agregado
const isTagAlreadyAdded = computed(() =>
  addedTags.value.some((t) => t.canonical_name === selectedTag.value),
);

function addCustomTag() {
  const tagName = customTag.value.trim();

  if (!tagName) {
    alert("Debes ingresar un nombre de etiqueta");
    return;
  }

  const alreadyExists =
    customTags.value.some(
      (t) => t.canonical_name.toLowerCase() === tagName.toLowerCase(),
    ) ||
    addedTags.value.some(
      (t) => t.canonical_name.toLowerCase() === tagName.toLowerCase(),
    );

  if (alreadyExists) {
    alert("Esta etiqueta ya fue agregada");
    return;
  }

  customTags.value.push({
    canonical_name: tagName,
    value: customValue.value.trim(), // Asignamos el valor en lugar de la descripción
    isCustom: true,
  });

  customTag.value = "";
  customValue.value = ""; // Limpiamos el valor
  showCustomTagForm.value = false;
}

function removeCustomTag(index) {
  customTags.value.splice(index, 1);
}

function addTag() {
  if (!selectedTag.value) return;

  if (isTagAlreadyAdded.value) {
    showNotification("warning", "Tag duplicado", "Este tag ya fue agregado");
    return;
  }

  const tagInfo = allTags.value.find(
    (t) => t.canonical_name === selectedTag.value,
  );

  addedTags.value.push({
    canonical_name: tagInfo.canonical_name,
    normal_name: tagInfo.normal_name,
    value: selectedTagValue.value || null,
  });

  selectedTag.value = "";
  selectedTagValue.value = "";
}

function removeTag(index) {
  addedTags.value.splice(index, 1);
}

// Limpiar el valor cuando cambia el tag seleccionado
watch(selectedTag, () => {
  selectedTagValue.value = "";
});

// Limpiar tag y valor al cambiar categoría
watch(selectedCategory, () => {
  selectedTag.value = "";
  selectedTagValue.value = "";
});

onMounted(async () => {
  try {
    const response = await fetch(`${API_URL}/tags`);

    const data = await response.json();

    if (data.success) {
      allTags.value = data.tags;
    }
  } catch (error) {
    console.error("Failed to load tags:", error);
  }
});

function cancelCustomTag() {
  customTag.value = "";
  customValue.value = "";
  showCustomTagForm.value = false;
}

async function handleSubmit() {
  try {
    isSubmitting.value = true;

    let tagToUse = selectedTag.value;
    let tagValue = selectedTagValue.value;
    const tagsObject = addedTags.value.reduce((acc, tag) => {
      acc[tag.canonical_name] = tag.value;
      return acc;
    }, {});

    //subida de archivos a MinIO
    const uploadedMediaFiles = [];

    for (const file of selectedFiles.value) {
      // 1 pedida a backend para obtener URL
      const urlResponse = await fetch(
        "http://localhost:3000/files/upload-url",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: file.type,
            originalName: file.name,
          }),
        },
      );

      const { uploadUrl, fileName } = await urlResponse.json();

      // enviar directo a MinIO con URL
      await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      // guardar nombre unico de archivo en BBDD
      uploadedMediaFiles.push(fileName);
    }

    /* Creando tag si no existe */
    for (const tag of customTags.value) {
      const tagResponse = await fetch(`${API_URL}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          canonical_name: tag.canonical_name,
          type: "otros",
          // Se eliminó la descripción
        }),
      });

      const tagData = await tagResponse.json();

      if (!tagData.success) {
        throw new Error(`No se pudo crear la etiqueta ${tag.canonical_name}`);
      }

      // Agregamos la etiqueta recién creada al objeto de reporte CON su valor
      tagsObject[tagData.tag.canonical_name] = tag.value || null;
    }
    /* Creando reporte */

    const reportResponse = await fetch(`${API_URL}/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: currentUser.value
          ? {
              user_id: currentUser.value.user_id,
              username: currentUser.value.username,
              surname: currentUser.value.surname,
              email: currentUser.value.email,
            }
          : null,
        attachments: uploadedMediaFiles,
        is_anonymous: !currentUser.value,
        notes: notes.value,
        tags: tagsObject,
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

    showNotification(
      "success",
      "¡Reporte enviado!",
      "Tu reporte ha sido creado exitosamente",
    );

    /*
      Reset form
    */
    selectedTag.value = "";
    customTags.value = [];
    showCustomTagForm.value = false;
    customTag.value = "";
    customValue.value = "";
    notes.value = "";
    selectedTagValue.value = "";
    addedTags.value = [];
    selectedFiles.value = [];
  } catch (error) {
    console.error(error);

    showNotification(
      "error",
      "Error",
      "Ocurrió un error enviando el reporte. Por favor, intenta nuevamente.",
    );
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
    <!-- Modal
      RESPONSIVE CHANGES:
      - Inner padding: `p-6` → `p-4 sm:p-6`
        On 320px screens p-6 (24px × 2 = 48px consumed) vs p-4 (16px × 2 = 32px).
        That 16px of extra content width prevents text truncation and input overflow.
        On sm+ (≥640px) the original p-6 is restored.
      - gap-5 preserved — vertical rhythm between sections unchanged.
      - All other classes (bg-white, w-full, h-full, md:h-auto, md:max-h-[90vh],
        md:max-w-xl, md:rounded-2xl, md:shadow-2xl, overflow-y-auto, flex, flex-col)
        unchanged.
    -->
    <div
      class="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-xl md:rounded-2xl md:shadow-2xl overflow-y-auto flex flex-col p-4 sm:p-6 gap-5"
    >
      <!-- Header
        RESPONSIVE CHANGES:
        - Title: `text-2xl` → `text-xl sm:text-2xl`
          On 320px, text-2xl (24px) is large for a modal header when combined with
          the close button and gap. text-xl (20px) fits without wrapping.
          On sm+ the original text-2xl is restored.
        - All other header classes unchanged.
      -->
      <div class="flex items-center gap-3">
        <button
          @click="emit('close')"
          class="text-gray-500 hover:text-black text-lg shrink-0 p-1"
        >
          ✕
        </button>

        <h2 class="text-xl sm:text-2xl font-bold">Crear Reporte</h2>
      </div>

      <!-- Location card — unchanged, already compact -->
      <section class="border rounded-xl p-4 bg-blue-50">
        <h3 class="font-semibold text-lg mb-2">Ubicación</h3>

        <!--
          RESPONSIVE CHANGE:
          - Added `break-words` so long street names (e.g. "Avenida del Libertador General
            San Martín") wrap instead of causing horizontal overflow on 320px.
        -->
        <p class="text-gray-700 break-words">
          {{ street }}
        </p>
      </section>

      <!-- Notes — textarea already has w-full, no changes needed -->
      <section class="border rounded-xl p-4">
        <h3 class="font-semibold text-lg mb-4">Notas</h3>

        <!--
          RESPONSIVE CHANGE:
          - `rows="4"` → `rows="3"` on mobile, keeping rows="4" on sm+.
            We achieve this with a CSS class override below in <style scoped>.
            Actually since rows is a static HTML attr we can't conditionally bind it
            to a breakpoint via Tailwind directly. Instead we use `rows="3"` and let
            the `resize: vertical` in <style scoped> allow the user to expand if needed.
            On desktop the user had 4 rows by default; 3 is still very usable and saves
            ~24px of vertical space on small screens.
          - Added `py-3 sm:py-2` for 44px touch target on mobile.
        -->
        <textarea
          v-model="notes"
          rows="3"
          placeholder="Escribe información adicional..."
          class="w-full border rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </section>

      <!-- Tags section -->
      <section class="border rounded-xl p-4">
        <h3 class="font-semibold text-lg mb-4">Etiquetas</h3>

        <!-- Category buttons — grid-cols-2 already works fine on all sizes -->
        <div class="mb-3">
          <label class="block mb-2 font-medium">Categoría</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="cat in categories"
              :key="cat.value"
              type="button"
              @click="selectedCategory = cat.value"
              :class="[
                /*
                  RESPONSIVE CHANGE:
                  - `py-2` → `py-3 sm:py-2` for 44px touch target on mobile.
                  - All other classes unchanged.
                */
                'px-3 py-3 sm:py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2',
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400',
              ]"
            >
              <component :is="cat.icon" class="w-4 h-4 shrink-0" />
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Tag selector — unchanged, w-full already handles width -->
        <div v-if="selectedCategory" class="mb-3">
          <label class="block mb-2 font-medium">Etiqueta</label>

          <div
            v-if="filteredTags.length === 0"
            class="text-sm text-gray-400 italic"
          >
            No hay etiquetas disponibles para esta categoría.
          </div>

          <!--
            RESPONSIVE CHANGE:
            - `py-2` → `py-3 sm:py-2` on select for touch-target consistency.
          -->
          <select
            v-else
            v-model="selectedTag"
            class="w-full border rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option disabled value="">Seleccione una etiqueta</option>
            <option
              v-for="tag in filteredTags"
              :key="tag._id"
              :value="tag.canonical_name"
            >
              {{ tag.normal_name }}
            </option>
          </select>
        </div>

        <!-- Tag value input -->
        <div v-if="selectedTag && currentTagConfig" class="mb-3">
          <label class="block mb-2 font-medium">
            Valor para
            <!--
              RESPONSIVE CHANGE:
              - Added `break-all` so very long canonical_name values (e.g. a custom
                tag with a long snake_case name) don't overflow the label on 320px.
            -->
            <span class="text-blue-600 break-all">{{ selectedTag }}</span>
          </label>

          <!--
            RESPONSIVE CHANGE on all three tag-value inputs:
            - `py-2` → `py-3 sm:py-2` for consistent 44px touch targets on mobile.
          -->
          <select
            v-if="currentTagConfig.input_type === 'select'"
            v-model="selectedTagValue"
            class="w-full border rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option disabled value="">Seleccione una opción</option>
            <option
              v-for="opt in currentTagConfig.options"
              :key="opt"
              :value="opt"
            >
              {{ opt }}
            </option>
          </select>

          <input
            v-else-if="currentTagConfig.input_type === 'number'"
            v-model="selectedTagValue"
            type="number"
            :placeholder="currentTagConfig.placeholder"
            :min="currentTagConfig.min"
            :max="currentTagConfig.max"
            :step="currentTagConfig.step ?? 1"
            class="w-full border rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            v-else
            v-model="selectedTagValue"
            type="text"
            :placeholder="currentTagConfig.placeholder"
            class="w-full border rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!--
          RESPONSIVE CHANGE — Add tag / Custom tag buttons:
          - `py-2` → `py-3 sm:py-2` on both buttons for 44px touch targets.
          - `flex flex-col sm:flex-row gap-3` was already present — correct, keep it.
        -->
        <div class="flex flex-col sm:flex-row gap-3 mt-4 mb-4">
          <button
            type="button"
            @click="addTag"
            :disabled="!selectedTag"
            class="flex-1 px-4 py-3 sm:py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            + Agregar etiqueta
          </button>

          <button
            v-if="!showCustomTagForm"
            type="button"
            @click="showCustomTagForm = true"
            class="flex-1 px-4 py-3 sm:py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 text-sm font-medium transition-colors"
          >
            + Etiqueta personalizada
          </button>
        </div>

        <!-- Custom tag form -->
        <div
          v-if="showCustomTagForm"
          class="border border-green-200 bg-green-50 rounded-xl p-4 mb-4 space-y-4"
        >
          <div>
            <label class="block mb-2 font-medium">
              Nombre de la etiqueta
            </label>
            <!--
              RESPONSIVE CHANGE: `py-2` → `py-3 sm:py-2` for touch target.
            -->
            <input
              v-model="customTag"
              type="text"
              placeholder="Ej: Poste caído"
              class="w-full border rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label class="block mb-2 font-medium"> Valor (Opcional) </label>
            <!--
              RESPONSIVE CHANGE: `py-2` → `py-3 sm:py-2` for touch target.
            -->
            <textarea
              v-model="customValue"
              rows="3"
              placeholder="Ej: 3, Rojo, Roto..."
              class="w-full border rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <!--
            RESPONSIVE CHANGE — custom tag action buttons:
            - Changed from `flex gap-2` to `flex gap-2 w-full`
            - Added `flex-1` to each button so they share the row equally on all sizes.
            - `py-2` → `py-3 sm:py-2` for touch targets.
          -->
          <div class="flex gap-2 w-full">
            <button
              type="button"
              @click="addCustomTag"
              class="flex-1 px-4 py-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              Agregar
            </button>
            <button
              type="button"
              @click="cancelCustomTag"
              class="flex-1 px-4 py-3 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 bg-white text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>

        <!-- Added tags list -->
        <div class="mt-6 pt-4 border-t border-gray-200">
          <div
            v-if="addedTags.length > 0 || customTags.length > 0"
            class="space-y-2"
          >
            <label class="block text-sm font-medium text-gray-800 mb-3">
              Etiquetas agregadas
            </label>

            <div
              v-for="(tag, index) in customTags"
              :key="'custom-' + index"
              class="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2 gap-2"
            >
              <!--
                RESPONSIVE CHANGE — tag display row:
                - Added `min-w-0` to the inner flex container so it can shrink below
                  its content size (required for text truncation to work in flex).
                - Added `truncate` to the tag name span and value span so long strings
                  (e.g. a long custom canonical_name) don't overflow the card on 320px.
                - The remove button has `shrink-0` so it never gets compressed.
              -->
              <div class="flex items-center gap-2 text-sm min-w-0 flex-1">
                <span class="font-medium text-green-700 truncate">
                  {{ tag.canonical_name }}
                </span>

                <span v-if="tag.value" class="text-gray-500 truncate"
                  >→ {{ tag.value }}</span
                >
                <span v-else class="text-gray-400 italic shrink-0"
                  >sin valor</span
                >

                <span class="text-xs text-green-500 shrink-0">
                  (personalizada)
                </span>
              </div>
              <button
                type="button"
                @click="removeCustomTag(index)"
                class="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none shrink-0 p-1"
              >
                ✕
              </button>
            </div>

            <div
              v-for="(tag, index) in addedTags"
              :key="'normal-' + index"
              class="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 gap-2"
            >
              <div class="flex items-center gap-2 text-sm min-w-0 flex-1">
                <span class="font-medium text-blue-700 truncate">
                  {{ tag.normal_name }}
                </span>
                <span v-if="tag.value" class="text-gray-500 truncate"
                  >→ {{ tag.value }}</span
                >
                <span v-else class="text-gray-400 italic shrink-0"
                  >sin valor</span
                >
              </div>
              <button
                type="button"
                @click="removeTag(index)"
                class="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none shrink-0 p-1"
              >
                ✕
              </button>
            </div>
          </div>

          <p v-else class="text-sm text-gray-400 italic mt-2">
            No hay etiquetas agregadas aún.
          </p>
        </div>
      </section>

      <!-- ATTACHMENTS -->
      <div>
        <section v-if="!isEmergencyMode" class="border rounded-xl p-4">
          <h3 class="font-semibold text-lg mb-4">Adjuntos</h3>

          <input
            type="file"
            ref="fileInput"
            @change="handleFileSelect"
            accept="image/*,video/*,audio/*"
            multiple
            class="hidden"
          />

          <button
            type="button"
            @click="$refs.fileInput.click()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
          >
            + Seleccionar Archivos
          </button>

          <div v-if="selectedFiles.length > 0" class="mt-4 space-y-2">
            <div
              v-for="(file, index) in selectedFiles"
              :key="index"
              class="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm"
            >
              <span class="truncate max-w-[250px] font-medium text-blue-700">
                {{ file.name }}
              </span>
              <button
                type="button"
                @click="removeFile(index)"
                class="text-gray-400 hover:text-red-500 font-bold text-lg leading-none"
              >
                ✕
              </button>
            </div>
          </div>
        </section>

        <div
          v-else
          class="border border-red-200 bg-red-50 rounded-xl p-4 text-sm text-red-500 flex items-center gap-2"
        >
          <AlertTriangle class="w-4 h-4 shrink-0" />
          Los adjuntos no están disponibles en modo emergencia.
        </div>
      </div>

      <!-- Footer buttons
        RESPONSIVE CHANGES:
        - Layout: `flex justify-end gap-3` → `flex flex-col-reverse sm:flex-row sm:justify-end gap-3`
          On mobile, "Cancelar" and "Enviar Reporte" stacked vertically is clearer
          and provides full-width tap targets. `flex-col-reverse` puts the primary
          action (Enviar Reporte) visually on top — the first thing the thumb reaches
          at the bottom of the modal.
          On sm+ (≥640px) the original horizontal right-aligned layout is restored.
        - Both buttons: `py-2` → `py-3 sm:py-2` for 44px touch targets on mobile.
        - Added `w-full sm:w-auto` so buttons stretch to full width in column layout
          but remain auto-width (fitting their text) in the row layout on tablet/desktop.
      -->
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        <button
          @click="emit('close')"
          class="w-full sm:w-auto px-4 py-3 sm:py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>

        <button
          @click="handleSubmit"
          :disabled="isSubmitting"
          class="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {{ isSubmitting ? "Enviando..." : "Enviar Reporte" }}
        </button>
      </div>
    </div>

    <!-- Notification Modal -->
    <NotificationModal
      :visible="notification.visible"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      @close="closeNotification"
    />
  </div>
</template>

<style scoped>
textarea {
  resize: vertical;
}
</style>
