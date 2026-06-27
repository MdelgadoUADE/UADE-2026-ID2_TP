<script setup>
import { ref, onMounted, computed, inject, watch } from "vue";
import { Car, User, Building2, MapPin, AlertTriangle } from "lucide-vue-next";
import {
  TAG_INPUT_CONFIG,
  DEFAULT_TAG_CONFIG,
} from "../config/tagInputConfig.js";
import NotificationModal from "./NotificationModal.vue";
import { API_URL } from "../api.js";
import { useAudioRecorder } from "./admin/composables/useAudioRecorder.js";

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

// ── Audio recorder ────────────────────────────────────────────────────────────
const {
  isRecording,
  recordingSeconds,
  audioBlob,
  audioUrl,
  errorMsg: audioError,
  startRecording,
  stopRecording,
  discardRecording,
  formatTime,
  getAudioFile,
} = useAudioRecorder();

function handleAddAudioToReport() {
  const file = getAudioFile();
  if (!file) return;
  selectedFiles.value.push(file);
  discardRecording();
}
// ─────────────────────────────────────────────────────────────────────────────


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

    // subida de archivos a MinIO
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

      // guardar objeto de metadata en BBDD
      uploadedMediaFiles.push({
        original_name: file.name,
        file_name: fileName,
        mime_type: file.type,
      });
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
        attachments: uploadedMediaFiles, // Ahora manda un array de objetos
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
  <div v-if="visible" class="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center md:p-4">
    <div
      class="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-xl md:rounded-2xl md:shadow-2xl overflow-y-auto flex flex-col p-4 sm:p-6 gap-5">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button @click="emit('close')" class="text-gray-500 hover:text-black text-lg shrink-0 p-1">✕</button>
        <h2 class="text-xl sm:text-2xl font-bold">Crear Reporte</h2>
      </div>

      <!-- Location -->
      <section class="border rounded-xl p-4 bg-blue-50">
        <h3 class="font-semibold text-lg mb-2">Ubicación</h3>
        <p class="text-gray-700 break-words">{{ street }}</p>
      </section>

      <!-- Notes -->
      <section class="border rounded-xl p-4">
        <h3 class="font-semibold text-lg mb-4">Notas</h3>
        <textarea v-model="notes" rows="3" placeholder="Escribe información adicional..."
          class="w-full border rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </section>

      <!-- Tags -->
      <section class="border rounded-xl p-4">
        <h3 class="font-semibold text-lg mb-4">Etiquetas</h3>

        <div class="mb-3">
          <label class="block mb-2 font-medium">Categoría</label>
          <div class="grid grid-cols-2 gap-2">
            <button v-for="cat in categories" :key="cat.value" type="button" @click="selectedCategory = cat.value"
              :class="[
                'px-3 py-3 sm:py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2',
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400',
              ]">
              <component :is="cat.icon" class="w-4 h-4 shrink-0" />
              {{ cat.label }}
            </button>
          </div>
        </div>

        <div v-if="selectedCategory" class="mb-3">
          <label class="block mb-2 font-medium">Etiqueta</label>
          <div v-if="filteredTags.length === 0" class="text-sm text-gray-400 italic">
            No hay etiquetas disponibles para esta categoría.
          </div>
          <select v-else v-model="selectedTag"
            class="w-full border rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option disabled value="">Seleccione una etiqueta</option>
            <option v-for="tag in filteredTags" :key="tag._id" :value="tag.canonical_name">
              {{ tag.normal_name }}
            </option>
          </select>
        </div>

        <div v-if="selectedTag && currentTagConfig" class="mb-3">
          <label class="block mb-2 font-medium">
            Valor para <span class="text-blue-600 break-all">{{ selectedTag }}</span>
          </label>
          <select v-if="currentTagConfig.input_type === 'select'" v-model="selectedTagValue"
            class="w-full border rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option disabled value="">Seleccione una opción</option>
            <option v-for="opt in currentTagConfig.options" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <input v-else-if="currentTagConfig.input_type === 'number'" v-model="selectedTagValue" type="number"
            :placeholder="currentTagConfig.placeholder" :min="currentTagConfig.min" :max="currentTagConfig.max"
            :step="currentTagConfig.step ?? 1"
            class="w-full border rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input v-else v-model="selectedTagValue" type="text" :placeholder="currentTagConfig.placeholder"
            class="w-full border rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div class="flex flex-col sm:flex-row gap-3 mt-4 mb-4">
          <button type="button" @click="addTag" :disabled="!selectedTag"
            class="flex-1 px-4 py-3 sm:py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors">
            + Agregar etiqueta
          </button>
          <button v-if="!showCustomTagForm" type="button" @click="showCustomTagForm = true"
            class="flex-1 px-4 py-3 sm:py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 text-sm font-medium transition-colors">
            + Etiqueta personalizada
          </button>
        </div>

        <!-- Custom tag form -->
        <div v-if="showCustomTagForm" class="border border-green-200 bg-green-50 rounded-xl p-4 mb-4 space-y-4">
          <div>
            <label class="block mb-2 font-medium">Nombre de la etiqueta</label>
            <input v-model="customTag" type="text" placeholder="Ej: Poste caído"
              class="w-full border rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block mb-2 font-medium">Valor (Opcional)</label>
            <textarea v-model="customValue" rows="3" placeholder="Ej: 3, Rojo, Roto..."
              class="w-full border rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div class="flex gap-2 w-full">
            <button type="button" @click="addCustomTag"
              class="flex-1 px-4 py-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              Agregar
            </button>
            <button type="button" @click="cancelCustomTag"
              class="flex-1 px-4 py-3 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 bg-white text-sm font-medium">
              Cancelar
            </button>
          </div>
        </div>

        <!-- Added tags list -->
        <div class="mt-6 pt-4 border-t border-gray-200">
          <div v-if="addedTags.length > 0 || customTags.length > 0" class="space-y-2">
            <label class="block text-sm font-medium text-gray-800 mb-3">Etiquetas agregadas</label>
            <div v-for="(tag, index) in customTags" :key="'custom-' + index"
              class="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2 gap-2">
              <div class="flex items-center gap-2 text-sm min-w-0 flex-1">
                <span class="font-medium text-green-700 truncate">{{ tag.canonical_name }}</span>
                <span v-if="tag.value" class="text-gray-500 truncate">→ {{ tag.value }}</span>
                <span v-else class="text-gray-400 italic shrink-0">sin valor</span>
                <span class="text-xs text-green-500 shrink-0">(personalizada)</span>
              </div>
              <button type="button" @click="removeCustomTag(index)"
                class="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none shrink-0 p-1">✕</button>
            </div>
            <div v-for="(tag, index) in addedTags" :key="'normal-' + index"
              class="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 gap-2">
              <div class="flex items-center gap-2 text-sm min-w-0 flex-1">
                <span class="font-medium text-blue-700 truncate">{{ tag.normal_name }}</span>
                <span v-if="tag.value" class="text-gray-500 truncate">→ {{ tag.value }}</span>
                <span v-else class="text-gray-400 italic shrink-0">sin valor</span>
              </div>
              <button type="button" @click="removeTag(index)"
                class="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none shrink-0 p-1">✕</button>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400 italic mt-2">No hay etiquetas agregadas aún.</p>
        </div>
      </section>

      <!-- ADJUNTOS (archivos + grabación de audio) -->
      <div>
        <section v-if="!isEmergencyMode" class="border rounded-xl p-4">
          <h3 class="font-semibold text-lg mb-4">Adjuntos</h3>

          <!-- ── Grabación de audio estilo WhatsApp ── -->
          <div class="mb-4 border border-purple-200 bg-purple-50 rounded-xl p-4">
            <p class="text-sm font-medium text-purple-800 mb-3 flex items-center gap-1.5">
              <Mic class="w-4 h-4" /> Nota de voz
            </p>

            <!-- Error de permisos -->
            <p v-if="audioError" class="text-xs text-red-500 mb-2">{{ audioError }}</p>

            <!-- Estado: sin grabar y sin audio previo -->
            <div v-if="!isRecording && !audioUrl" class="flex items-center gap-3">
              <button type="button" @click="startRecording"
                class="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm">
                <Mic class="w-4 h-4" />
                Grabar audio
              </button>
              <span class="text-xs text-gray-400">Mantené el botón para grabar</span>
            </div>

            <!-- Estado: grabando -->
            <div v-if="isRecording" class="flex items-center gap-3">
              <!-- Indicador pulsante -->
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span class="text-sm font-mono text-red-600 font-semibold min-w-[48px]">
                {{ formatTime(recordingSeconds) }}
              </span>
              <button type="button" @click="stopRecording"
                class="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors text-sm font-medium shadow-sm">
                <Square class="w-3.5 h-3.5 fill-current" />
                Detener
              </button>
            </div>

            <!-- Estado: audio grabado listo para agregar -->
            <div v-if="!isRecording && audioUrl" class="space-y-3">
              <audio :src="audioUrl" controls class="w-full h-10 rounded-lg" />
              <div class="flex gap-2">
                <button type="button" @click="handleAddAudioToReport"
                  class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                  ✓ Adjuntar audio
                </button>
                <button type="button" @click="discardRecording"
                  class="px-3 py-2 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  title="Descartar grabación">
                  <Trash2 class="w-4 h-4" />
                </button>
                <button type="button" @click="discardRecording(); startRecording()"
                  class="px-3 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                  title="Volver a grabar">
                  <Mic class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <!-- ──────────────────────────────────────── -->

          <!-- Selector de archivos tradicional -->
          <input type="file" ref="fileInput" @change="handleFileSelect" accept="image/*,video/*,audio/*" multiple
            class="hidden" />

          <button type="button" @click="$refs.fileInput.click()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2">
            + Seleccionar Archivos
          </button>

          <!-- Lista de archivos seleccionados -->
          <div v-if="selectedFiles.length > 0" class="mt-4 space-y-2">
            <div v-for="(file, index) in selectedFiles" :key="index"
              class="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <!-- Icono según tipo -->
                <span class="shrink-0 text-base">
                  {{ file.type.startsWith('audio/') ? '🎙️' : file.type.startsWith('image/') ? '🖼️' : '📎' }}
                </span>
                <span class="truncate font-medium text-blue-700">{{ file.name }}</span>
                <span class="text-xs text-gray-400 shrink-0">{{ (file.size / 1024).toFixed(0) }} KB</span>
              </div>
              <button type="button" @click="removeFile(index)"
                class="text-gray-400 hover:text-red-500 font-bold text-lg leading-none ml-2 shrink-0">
                ✕
              </button>
            </div>
          </div>
        </section>

        <div v-else class="border border-red-200 bg-red-50 rounded-xl p-4 text-sm text-red-500 flex items-center gap-2">
          <AlertTriangle class="w-4 h-4 shrink-0" />
          Los adjuntos no están disponibles en modo emergencia.
        </div>
      </div>

      <!-- Footer -->
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        <button @click="emit('close')" class="w-full sm:w-auto px-4 py-3 sm:py-2 border rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
        <button @click="handleSubmit" :disabled="isSubmitting"
          class="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
          {{ isSubmitting ? "Enviando..." : "Enviar Reporte" }}
        </button>
      </div>
    </div>

    <NotificationModal :visible="notification.visible" :type="notification.type" :title="notification.title"
      :message="notification.message" @close="closeNotification" />
  </div>
</template>

<style scoped>
textarea {
  resize: vertical;
}
</style>