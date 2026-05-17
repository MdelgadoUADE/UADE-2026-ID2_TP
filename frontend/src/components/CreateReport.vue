<script setup>
import { ref, onMounted } from "vue";

defineProps({
  visible: Boolean,
  street: String,
});

const emit = defineEmits(["close"]);

const reportTypes = ref([]);
const selectedType = ref("");

onMounted(async () => {
  try {
    const response = await fetch("http://localhost:3000/report-types");

    const data = await response.json();

    if (data.success) {
      reportTypes.value = data.reportTypes;
    }
  } catch (error) {
    console.error("Failed to load report types:", error);
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
          <label>Tipo de reporte</label>

          <select v-model="selectedType" required>
            <option disabled value="">Seleccione una opción</option>

            <option
              v-for="type in reportTypes"
              :key="type._id"
              :value="type.slug"
            >
              {{ type.name }}
            </option>
          </select>
        </div>

        <div class="field">
          <label>Descripción</label>
          <textarea
            rows="4"
            placeholder="Describe el problema..."
            required
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
</style>
