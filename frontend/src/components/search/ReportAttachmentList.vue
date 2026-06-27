<script setup>
import { ref, watch } from 'vue'
import { API_URL } from '../../api.js'

const props = defineProps({
  attachments: Array
})

// Mapa: fileName → { url, loading, error }
const resolvedUrls = ref({})

// Detecta si un nombre de archivo corresponde a un audio
function isAudio(fileName) {
  return /\.(webm|mp4|mp3|ogg|wav|aac|m4a)$/i.test(fileName)
}

function isImage(fileName) {
  return /\.(jpe?g|png|gif|webp|svg)$/i.test(fileName)
}

function fileIcon(fileName) {
  if (isAudio(fileName)) return '🎙️'
  if (isImage(fileName)) return '🖼️'
  return '📎'
}

// Obtiene URL firmada desde el backend para reproducir / descargar
async function resolveUrl(fileName) {
  if (resolvedUrls.value[fileName]) return
  resolvedUrls.value[fileName] = { url: null, loading: true, error: null }
  try {
    const res = await fetch(`${API_URL}/files/download-url/${fileName}`)
    const data = await res.json()
    resolvedUrls.value[fileName] = { url: data.downloadUrl, loading: false, error: null }
  } catch (err) {
    resolvedUrls.value[fileName] = { url: null, loading: false, error: 'No se pudo cargar el archivo' }
  }
}

// Cada vez que cambia la lista de adjuntos, resolvemos las URLs de los audios
// (los demás se resuelven on-demand con el botón "Ver")
watch(
  () => props.attachments,
  (list) => {
    if (!list) return
    list.forEach((f) => {
      if (isAudio(f)) resolveUrl(f)
    })
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <h3 class="font-semibold text-lg mb-4">Adjuntos</h3>

    <div v-if="attachments?.length" class="space-y-3">
      <div v-for="attachment in attachments" :key="attachment" class="border rounded-xl p-3 bg-gray-50">
        <!-- Cabecera del adjunto -->
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="text-base shrink-0">{{ fileIcon(attachment) }}</span>
            <span class="font-mono text-xs text-gray-600 truncate">{{ attachment }}</span>
          </div>

          <!-- Botón "Ver / Descargar" para no-audios -->
          <template v-if="!isAudio(attachment)">
            <button v-if="!resolvedUrls[attachment]" @click="resolveUrl(attachment)"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium shrink-0">
              Ver
            </button>
            <a v-else-if="resolvedUrls[attachment]?.url" :href="resolvedUrls[attachment].url" target="_blank"
              rel="noopener" class="text-blue-600 hover:text-blue-800 text-sm font-medium shrink-0">
              Abrir ↗
            </a>
            <span v-else-if="resolvedUrls[attachment]?.loading" class="text-xs text-gray-400 shrink-0">Cargando…</span>
            <span v-else-if="resolvedUrls[attachment]?.error" class="text-xs text-red-400 shrink-0">Error</span>
          </template>
        </div>

        <!-- ── Reproductor de audio nativo ── -->
        <template v-if="isAudio(attachment)">
          <div v-if="resolvedUrls[attachment]?.loading" class="flex items-center gap-2 text-xs text-gray-400 py-1">
            <span class="animate-spin">⏳</span> Cargando audio…
          </div>
          <div v-else-if="resolvedUrls[attachment]?.error" class="text-xs text-red-400 py-1">
            {{ resolvedUrls[attachment].error }}
          </div>
          <audio v-else-if="resolvedUrls[attachment]?.url" :src="resolvedUrls[attachment].url" controls
            preload="metadata" class="w-full h-10 rounded-lg" />
        </template>
      </div>
    </div>

    <div v-else class="text-gray-400 text-sm italic">
      Sin adjuntos
    </div>
  </div>
</template>