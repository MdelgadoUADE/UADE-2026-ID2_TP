<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  // [{ label, count, color }]
  data:        { type: Array,   required: true },
  horizontal:  { type: Boolean, default: false },
  showValues:  { type: Boolean, default: true },
  height:      { type: Number,  default: 200 },
})

const canvas = ref(null)
let   ro     = null

function draw() {
  const el  = canvas.value
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
  const maxVal  = Math.max(...data.map(d => d.count), 1)
  const PAD     = { top: 8, right: 16, bottom: props.horizontal ? 8 : 28, left: props.horizontal ? 100 : 8 }
  const chartW  = W - PAD.left - PAD.right
  const chartH  = H - PAD.top  - PAD.bottom

  ctx.font      = '11px system-ui, sans-serif'
  ctx.textAlign = 'left'

  if (props.horizontal) {
    // ── Horizontal bars ──
    const barH    = Math.min(28, (chartH / data.length) - 6)
    const spacing = chartH / data.length

    data.forEach((d, i) => {
      const y    = PAD.top + i * spacing + (spacing - barH) / 2
      const barW = (d.count / maxVal) * chartW

      // Label
      ctx.fillStyle = '#6B7280'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(d.label, PAD.left - 6, y + barH / 2)

      // Bar
      ctx.fillStyle = d.color
      const radius = 4
      const bx = PAD.left, bw = Math.max(barW, radius * 2)
      ctx.beginPath()
      ctx.moveTo(bx + radius, y)
      ctx.lineTo(bx + bw - radius, y)
      ctx.quadraticCurveTo(bx + bw, y, bx + bw, y + radius)
      ctx.lineTo(bx + bw, y + barH - radius)
      ctx.quadraticCurveTo(bx + bw, y + barH, bx + bw - radius, y + barH)
      ctx.lineTo(bx + radius, y + barH)
      ctx.quadraticCurveTo(bx, y + barH, bx, y + barH - radius)
      ctx.lineTo(bx, y + radius)
      ctx.quadraticCurveTo(bx, y, bx + radius, y)
      ctx.closePath()
      ctx.fill()

      // Value
      if (props.showValues && d.count > 0) {
        ctx.fillStyle = '#374151'
        ctx.textAlign = 'left'
        ctx.fillText(d.count, PAD.left + bw + 6, y + barH / 2)
      }
    })

  } else {
    // ── Vertical bars ──
    const barW    = Math.min(40, (chartW / data.length) - 8)
    const spacing = chartW / data.length

    data.forEach((d, i) => {
      const x    = PAD.left + i * spacing + (spacing - barW) / 2
      const barH = (d.count / maxVal) * chartH
      const y    = PAD.top + chartH - barH

      // Bar
      ctx.fillStyle = d.color
      const radius = 4
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + barW - radius, y)
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius)
      ctx.lineTo(x + barW, y + barH)
      ctx.lineTo(x, y + barH)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()

      // Value on top
      if (props.showValues && d.count > 0) {
        ctx.fillStyle = '#374151'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(d.count, x + barW / 2, y - 2)
      }

      // Label below
      ctx.fillStyle = '#6B7280'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(d.label, x + barW / 2, PAD.top + chartH + 6)
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
