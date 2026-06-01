<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  // [{ label, count, color }]
  data:   { type: Array,  required: true },
  donut:  { type: Boolean, default: true },
  size:   { type: Number,  default: 160 },
})

const canvas = ref(null)

function draw() {
  const el = canvas.value
  if (!el || !props.data.length) return

  const dpr  = window.devicePixelRatio || 1
  const S    = props.size
  el.width   = S * dpr
  el.height  = S * dpr

  const ctx  = el.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, S, S)

  const total = props.data.reduce((a, d) => a + d.count, 0)
  if (total === 0) return

  const cx     = S / 2
  const cy     = S / 2
  const radius = S / 2 - 4
  const hole   = props.donut ? radius * 0.58 : 0

  let start = -Math.PI / 2

  for (const d of props.data) {
    const slice = (d.count / total) * Math.PI * 2

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, start, start + slice)
    ctx.closePath()
    ctx.fillStyle = d.color
    ctx.fill()

    start += slice
  }

  // Cut hole for donut
  if (props.donut) {
    ctx.beginPath()
    ctx.arc(cx, cy, hole, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()

    // Center label: biggest slice %
    const biggest = props.data.reduce((a, b) => a.count > b.count ? a : b)
    const pct     = Math.round((biggest.count / total) * 100)
    ctx.fillStyle    = '#111827'
    ctx.font         = `bold 18px system-ui, sans-serif`
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${pct}%`, cx, cy - 7)
    ctx.font         = `11px system-ui, sans-serif`
    ctx.fillStyle    = '#6B7280'
    ctx.fillText(biggest.label, cx, cy + 10)
  }
}

onMounted(async () => { await nextTick(); draw() })
watch(() => props.data, draw, { deep: true })

onUnmounted(() => {})
</script>

<template>
  <canvas
    ref="canvas"
    :style="{ width: size + 'px', height: size + 'px', display: 'block' }"
  />
</template>
    