<script setup>
import { ref, onMounted, computed } from "vue";

defineProps({
  visible: Boolean,
  street: String,
});

const emit = defineEmits(["close"]);

const tags = ref([]);
const selectedTags = ref("");

const useCustomTag = ref(false);

const customTag = ref("");
const customDescription = ref("");

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
</script>

<template>
  <div v-if="visible" class="overlay">
    <div class="modal">
      <button class="close-btn" @click="emit('close')">✕</button>

      <h2>Crear reporte</h2>

      <p class="street">
        {{ street }}
      </p>

      <form>
        <!-- Tipo de reporte a crear -->
        <div class="field">
          <label>Tag</label>
          <select v-model="selectedTags" :disabled="isSelectDisabled" required>
            <option disabled value="">Seleccione un tag</option>
            <option
              v-for="tag in tags"
              :key="tag._id"
              :value="tag.canonical_name"
            >
              {{ tag.canonical_name }}
            </option>
          </select>
        </div>
        <!-- custom tag checkbox --->
        <div class="checkbox-field">
          <input id="customTag" type="checkbox" v-model="useCustomTag" />

          <label for="customTag">Custom Tag</label>
        </div>

        <div class="field">
          <label>Custom Descripción</label>
          <textarea
            v-model="customDescription"
            rows="4"
            placeholder="Describe el problema..."
          ></textarea>
        </div>

        <button class="submit-btn" type="submit">Continuar</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);

  display: flex;
  justify-content: center;
  align-items: center;

  z-index: 2000;
}

.modal {
  background: white;
  width: 420px;
  max-width: 90vw;

  padding: 24px;
  border-radius: 12px;

  position: relative;

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.close-btn {
  position: absolute;
  right: 14px;
  top: 14px;

  border: none;
  background: none;
  cursor: pointer;
  font-size: 18px;
}

.street {
  color: #666;
  margin-bottom: 20px;
}

.field {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

input,
textarea {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  cursor: pointer;
}

select {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}

select:disabled {
  background-color: #f0f0f0;
  color: #888;
  cursor: not-allowed;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.checkbox-field label {
  margin: 0;
  font-weight: normal;
}
</style>
