<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  // [{ label, value }]
  data:       { type: Array,  required: true },
  color:      { type: String, default: '#3B82F6' },
  fillColor:  { type: String, default: 'rgba(59, 130, 246, 0.08)' },
  showValues: { type: Boolean, default: false },
  height:     { type: Number,  default: 220 },
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

  const data    = props.data
  const maxVal  = Math.max(...data.map(d => d.value), 1) * 1.15
  const PAD     = { top: 18, right: 14, bottom: 26, left: 30 }
  const chartW  = W - PAD.left - PAD.right
  const chartH  = H - PAD.top  - PAD.bottom

  ctx.font = '10.5px system-ui, sans-serif'

  // ── Líneas guía horizontales + eje Y ──
  const gridSteps = 4
  ctx.strokeStyle = '#F3F4F6'
  ctx.fillStyle   = '#9CA3AF'
  ctx.textAlign   = 'right'
  ctx.textBaseline = 'middle'
  for (let i = 0; i <= gridSteps; i++) {
    const val = Math.round((maxVal / gridSteps) * i)
    const y   = PAD.top + chartH - (val / maxVal) * chartH
    ctx.beginPath()
    ctx.moveTo(PAD.left, y)
    ctx.lineTo(PAD.left + chartW, y)
    ctx.stroke()
    ctx.fillText(val, PAD.left - 6, y)
  }

  if (data.length === 1) {
    // Un solo punto: dibujar marcador centrado, sin línea
    const x = PAD.left + chartW / 2
    const y = PAD.top + chartH - (data[0].value / maxVal) * chartH
    ctx.fillStyle = props.color
    ctx.beginPath()
    ctx.arc(x, y, 3.5, 0, Math.PI * 2)
    ctx.fill()
  } else {
    const stepX = chartW / (data.length - 1)
    const points = data.map((d, i) => ({
      x: PAD.left + i * stepX,
      y: PAD.top + chartH - (d.value / maxVal) * chartH,
    }))

    // ── Área bajo la curva ──
    ctx.beginPath()
    ctx.moveTo(points[0].x, PAD.top + chartH)
    points.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(points[points.length - 1].x, PAD.top + chartH)
    ctx.closePath()
    ctx.fillStyle = props.fillColor
    ctx.fill()

    // ── Línea ──
    ctx.beginPath()
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.strokeStyle = props.color
    ctx.lineWidth   = 2
    ctx.lineJoin    = 'round'
    ctx.stroke()

    // ── Puntos ──
    points.forEach((p, i) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = props.color
      ctx.stroke()

      if (props.showValues && data[i].value > 0) {
        ctx.fillStyle = '#374151'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(data[i].value, p.x, p.y - 6)
      }
    })

    // ── Labels eje X (mostrar subset si hay muchos puntos) ──
    const maxLabels = Math.floor(chartW / 38)
    const labelEvery = Math.max(1, Math.ceil(data.length / maxLabels))

    ctx.fillStyle = '#6B7280'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    points.forEach((p, i) => {
      if (i % labelEvery === 0 || i === points.length - 1) {
        ctx.fillText(data[i].label, p.x, PAD.top + chartH + 6)
      }
    })
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