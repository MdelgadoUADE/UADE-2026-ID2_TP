<script setup>
import { ref, onMounted, computed, inject, watch } from "vue";
import { Car, User, Building2, MapPin } from 'lucide-vue-next'
import { TAG_INPUT_CONFIG, DEFAULT_TAG_CONFIG } from '../config/tagInputConfig.js'



const props = defineProps({
  visible: Boolean,
  street: String,
  lat: Number,
  lng: Number,
});

const emit = defineEmits(["close"]);

const currentUser = inject('currentUser')
const isEmergencyMode = inject('isEmergencyMode') // Esto deberia servir para usarlo al bloqueal multimedia en emergencia


// Tags
const allTags = ref([])
const selectedCategory = ref('')
const selectedTag = ref('')
const selectedTagValue = ref('')
const addedTags = ref([])
const useCustomTag = ref(false);
const customTag = ref("");
const customDescription = ref("");

// Categorías disponibles basadas en el tipo del schema
const categories = [
  { value: 'vehiculo', label: 'Vehículo', icon: Car },
  { value: 'persona',  label: 'Persona',  icon: User },
  { value: 'ambiente', label: 'Ambiente', icon: Building2 },
  { value: 'otros',    label: 'Otros',    icon: MapPin },
]

// Tags filtrados según la categoría seleccionada
const filteredTags = computed(() =>
  allTags.value.filter(t => t.type === selectedCategory.value)
)

const notes = ref("");

const isSubmitting = ref(false);

const isSelectDisabled = computed(() => useCustomTag.value);

// Computed que devuelve la config del tag actualmente seleccionado
const currentTagConfig = computed(() => {
  if (!selectedTag.value) return null
  return TAG_INPUT_CONFIG[selectedTag.value] ?? DEFAULT_TAG_CONFIG
})

// Computed que chequea si el tag actual ya fue agregado
const isTagAlreadyAdded = computed(() =>
  addedTags.value.some(t => t.canonical_name === selectedTag.value)
)

function addTag() {
  if (!selectedTag.value) return
  if (isTagAlreadyAdded.value) {
    alert('Este tag ya fue agregado')
    return
  }
    addedTags.value.push({
    canonical_name: selectedTag.value,
    value: selectedTagValue.value || null
  })

  // Reset selección
  selectedTag.value = ''
  selectedTagValue.value = ''
}

function removeTag(index) {
  addedTags.value.splice(index, 1)
}

// Limpiar el valor cuando cambia el tag seleccionado
watch(selectedTag, () => {
  selectedTagValue.value = ''
})


// Limpiar tag y valor al cambiar categoría
watch(selectedCategory, () => {
  selectedTag.value = ''
  selectedTagValue.value = ''
})

onMounted(async () => {
  try {
    const response = await fetch("http://localhost:3000/tags");

    const data = await response.json();

    if (data.success) {
      allTags.value = data.tags;
    }
  } catch (error) {
    console.error("Failed to load tags:", error);
  }
});

async function handleSubmit() {
  try {
    isSubmitting.value = true;

    let tagToUse = selectedTag.value
    let tagValue = selectedTagValue.value
    const tagsObject = addedTags.value.reduce((acc, tag) => {
      acc[tag.canonical_name] = tag.value
      return acc
    }, {})

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
        user: currentUser.value
          ? {
            user_id: currentUser.value.user_id,
            username: currentUser.value.username,
            surname: currentUser.value.surname,
            email: currentUser.value.email,
          }
          : null,
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
    selectedTagValue.value = '';
    addedTags.value = []

  
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

        <!-- Paso 1: Categoría -->
        <div class="mb-3">
          <label class="block mb-2 font-medium">Categoría</label>
          <div class="grid grid-cols-2 gap-2">
            <button v-for="cat in categories" :key="cat.value" type="button" @click="selectedCategory = cat.value"
              :class="[
                'px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2',
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              ]">
              <component :is="cat.icon" class="w-4 h-4" />
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Paso 2: Tag de la categoría -->
        <div v-if="selectedCategory" class="mb-3">
          <label class="block mb-2 font-medium">Etiqueta</label>

          <div v-if="filteredTags.length === 0" class="text-sm text-gray-400 italic">
            No hay etiquetas disponibles para esta categoría.
          </div>

          <select v-else v-model="selectedTag"
            class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option disabled value="">Seleccione una etiqueta</option>
            <option v-for="tag in filteredTags" :key="tag._id" :value="tag.canonical_name">
              {{ tag.canonical_name }}
            </option>
          </select>
        </div>

        <!-- Paso 3: Valor del tag -->
        <div v-if="selectedTag && currentTagConfig" class="mb-3">
          <label class="block mb-2 font-medium">
            Valor para <span class="text-blue-600">{{ selectedTag }}</span>
          </label>

          <select v-if="currentTagConfig.input_type === 'select'" v-model="selectedTagValue"
            class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option disabled value="">Seleccione una opción</option>
            <option v-for="opt in currentTagConfig.options" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>

          <input v-else-if="currentTagConfig.input_type === 'number'" v-model="selectedTagValue" type="number"
            :placeholder="currentTagConfig.placeholder" :min="currentTagConfig.min" :max="currentTagConfig.max"
            :step="currentTagConfig.step ?? 1"
            class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <input v-else v-model="selectedTagValue" type="text" :placeholder="currentTagConfig.placeholder"
            class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <!-- Botón agregar -->
        <button type="button" @click="addTag" :disabled="!selectedTag"
          class="mb-4 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium">
          + Agregar etiqueta
        </button>

        <!-- Tags agregados -->
        <div v-if="addedTags.length > 0" class="space-y-2">
          <label class="block text-sm font-medium text-gray-600">Etiquetas agregadas</label>
          <div v-for="(tag, index) in addedTags" :key="index"
            class="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            <div class="flex items-center gap-2 text-sm">
              <span class="font-medium text-blue-700">{{ tag.canonical_name }}</span>
              <span v-if="tag.value" class="text-gray-500">→ {{ tag.value }}</span>
              <span v-else class="text-gray-400 italic">sin valor</span>
            </div>
            <button type="button" @click="removeTag(index)"
              class="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none">
              ✕
            </button>
          </div>
        </div>

        <p v-else class="text-sm text-gray-400 italic">No hay etiquetas agregadas aún.</p>

        <!-- Custom tag (sin cambios) -->
        <div class="flex items-center gap-2 mt-4 mb-4">
          <input id="customTag" type="checkbox" v-model="useCustomTag" class="h-4 w-4" />
          <label for="customTag">Custom tag</label>
        </div>

        <template v-if="useCustomTag">
          <div class="space-y-4">
            <div>
              <label class="block mb-2 font-medium">Custom tag</label>
              <input v-model="customTag" type="text" placeholder="custom tag"
                class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block mb-2 font-medium">Custom description</label>
              <textarea v-model="customDescription" rows="3" placeholder="custom description"
                class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
      
      <!-- ATTACHMENTS (no implementados)--> 
      <div>
        <section v-if="!isEmergencyMode" class="border rounded-xl p-4">
          <!-- upload de archivos -->
        </section>
        <div v-else class="border border-red-200 bg-red-50 rounded-xl p-4 text-sm text-red-500 flex items-center gap-2">
          <AlertTriangle class="w-4 h-4" />
          Los adjuntos no están disponibles en modo emergencia.
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
textarea {
  resize: vertical;
}
</style>
