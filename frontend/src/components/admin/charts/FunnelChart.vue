<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  // [{ label, count, color }] — ordered from top to bottom
  data:   { type: Array,  required: true },
  height: { type: Number, default: 220 },
})

const canvas = ref(null)
let   ro     = null

function draw() {
  const el = canvas.value
  if (!el || !props.data.length) return

  const dpr = window.devicePixelRatio || 1
  const W   = el.offsetWidth
  const H   = props.height

  el.width  = W * dpr
  el.height = H * dpr

  const ctx = el.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, W, H)

  const data   = props.data.filter(d => d.count > 0)
  if (!data.length) return

  const maxVal = Math.max(...data.map(d => d.count))
  const n      = data.length
  const PAD    = { top: 6, bottom: 6, left: 110, right: 60 }
  const chartW = W - PAD.left - PAD.right
  const rowH   = (H - PAD.top - PAD.bottom) / n - 4
  const gap    = 4

  ctx.font = '11px system-ui, sans-serif'

  data.forEach((d, i) => {
    const pct  = d.count / maxVal
    const barW = Math.max(pct * chartW, 8)
    const y    = PAD.top + i * (rowH + gap)

    // Label
    ctx.fillStyle    = '#6B7280'
    ctx.textAlign    = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(d.label, PAD.left - 8, y + rowH / 2)

    // Bar with rounded right corners
    const x      = PAD.left
    const radius = 4
    ctx.fillStyle = d.color
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + barW - radius, y)
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius)
    ctx.lineTo(x + barW, y + rowH - radius)
    ctx.quadraticCurveTo(x + barW, y + rowH, x + barW - radius, y + rowH)
    ctx.lineTo(x, y + rowH)
    ctx.closePath()
    ctx.fill()

    // Count value
    ctx.fillStyle    = '#374151'
    ctx.textAlign    = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(d.count, x + barW + 6, y + rowH / 2)
  })

  // Tasa de resolución al pie
  const first   = data[0]?.count ?? 0
  const resolved = data.find(d => d.key === 'resolved')?.count ?? 0
  if (first > 0) {
    const pct = Math.round((resolved / first) * 100)
    ctx.fillStyle = '#9CA3AF'
    ctx.font      = '10px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Tasa de resolución: ${pct}%`, PAD.left, H - 2)
  }
}

onMounted(async () => {
  await nextTick()
  draw()
  ro = new ResizeObserver(draw)
  if (canvas.value?.parentElement) ro.observe(canvas.value.parentElement)
})

watch(() => props.data, draw, { deep: true })
onUnmounted(() => ro?.disconnect())
</script>

<template>
  <canvas ref="canvas" :style="{ width: '100%', height: height + 'px', display: 'block' }" />
</template>
