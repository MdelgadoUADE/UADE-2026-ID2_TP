// frontend/src/components/composables/useAudioRecorder.js
import { ref } from 'vue'

export function useAudioRecorder() {
  const isRecording = ref(false)
  const recordingSeconds = ref(0)
  const audioBlob = ref(null)
  const audioUrl = ref(null)
  const errorMsg = ref('')

  let mediaRecorder = null
  let chunks = []
  let timerInterval = null

  async function startRecording() {
    errorMsg.value = ''
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Preferimos webm/opus (mejor soporte en Chrome/Firefox). Safari grabará en mp4.
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'

      mediaRecorder = new MediaRecorder(stream, { mimeType })
      chunks = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        audioBlob.value = blob
        audioUrl.value = URL.createObjectURL(blob)
        // Liberar microfono
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start(250) // chunk cada 250ms para tener datos parciales
      isRecording.value = true
      recordingSeconds.value = 0
      timerInterval = setInterval(() => { recordingSeconds.value++ }, 1000)
    } catch (err) {
      errorMsg.value = 'No se pudo acceder al micrófono. Verificá los permisos.'
      console.error('AudioRecorder error:', err)
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording.value) {
      mediaRecorder.stop()
      isRecording.value = false
      clearInterval(timerInterval)
    }
  }

  function discardRecording() {
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
    audioBlob.value = null
    audioUrl.value = null
    recordingSeconds.value = 0
    errorMsg.value = ''
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Convierte el blob grabado en un File listo para subir a MinIO
  function getAudioFile() {
    if (!audioBlob.value) return null
    const ext = audioBlob.value.type.includes('mp4') ? 'mp4' : 'webm'
    return new File([audioBlob.value], `audio-nota-${Date.now()}.${ext}`, {
      type: audioBlob.value.type,
    })
  }

  return {
    isRecording,
    recordingSeconds,
    audioBlob,
    audioUrl,
    errorMsg,
    startRecording,
    stopRecording,
    discardRecording,
    formatTime,
    getAudioFile,
  }
}