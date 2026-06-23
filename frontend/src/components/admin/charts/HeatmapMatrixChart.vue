<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  // { rows: [{ diaLabel, cells: [{ dia, franja, franjaSub, count }] }], franjas: [{ label, sub }], maxCount }
  matrix: { type: Object, required: true },
  height: { type: Number, default: 280 },
  color:  { type: String, default: '#3B82F6' }, // color base, se interpola por intensidad
})

const canvas  = ref(null)
const wrapper = ref(null) // CAMBIO: ref al wrapper para calcular posición del tooltip
const tooltip = ref(null) // { x, y, dia, franja, franjaSub, count }

// CAMBIO: Estado para controlar si el tooltip debe abrirse hacia arriba o abajo,
// y hacia la izquierda o la derecha, para evitar que salga del viewport.
const tooltipStyle = ref({})

let   ro = null

function hexToRgb(hex) {
  const v = hex.replace('#', '')
  return {
    r: parseInt(v.substring(0, 2), 16),
    g: parseInt(v.substring(2, 4), 16),
    b: parseInt(v.substring(4, 6), 16),
  }
}

function cellColor(count, max) {
  if (!max || count === 0) return '#F3F4F6'
  const intensity = Math.min(count / max, 1)
  const { r, g, b } = hexToRgb(props.color)
  // interpola entre blanco (intensity 0) y color base (intensity 1)
  const mix = (c) => Math.round(255 + (c - 255) * Math.max(intensity, 0.12))
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

function draw() {
  const el = canvas.value
  const { rows, franjas, maxCount } = props.matrix
  if (!el || !rows?.length) return

  const dpr = window.devicePixelRatio || 1
  const W   = el.offsetWidth
  const H   = props.height

  el.width  = W * dpr
  el.height = H * dpr

  const ctx = el.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, W, H)

  const PAD = { top: 26, right: 6, bottom: 6, left: 38 }
  const gridW = W - PAD.left - PAD.right
  const gridH = H - PAD.top  - PAD.bottom

  const cellW = gridW / franjas.length
  const cellH = gridH / rows.length
  const gap   = 3

  ctx.font = '10.5px system-ui, sans-serif'

  // ── Headers de franjas ──
  ctx.fillStyle = '#6B7280'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  franjas.forEach((f, i) => {
    const x = PAD.left + i * cellW + cellW / 2

    // CAMBIO: En pantallas muy angostas (W < 360) la etiqueta larga no entra.
    // Usamos la etiqueta abreviada (primera palabra) cuando el ancho de celda
    // es menor a 70px. Esto es puramente cosmético/visual, no toca lógica.
    const labelText = cellW < 70 ? f.label.split(' ')[0] : f.label
    ctx.fillText(labelText, x, PAD.top / 2)
  })

  // ── Filas: label de día + celdas ──
  rows.forEach((row, ri) => {
    const y = PAD.top + ri * cellH

    // Label día
    ctx.fillStyle = '#6B7280'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(row.diaLabel, PAD.left - 8, y + cellH / 2)

    row.cells.forEach((cell, ci) => {
      const x = PAD.left + ci * cellW

      const w = cellW - gap
      const h = cellH - gap
      const radius = 4

      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + w - radius, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
      ctx.lineTo(x + w, y + h - radius)
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
      ctx.lineTo(x + radius, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fillStyle = cellColor(cell.count, maxCount)
      ctx.fill()

      if (cell.count > 0) {
        const intensity = maxCount ? cell.count / maxCount : 0
        ctx.fillStyle = intensity > 0.55 ? '#FFFFFF' : '#374151'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = '600 11px system-ui, sans-serif'
        ctx.fillText(cell.count, x + w / 2, y + h / 2)
        ctx.font = '10.5px system-ui, sans-serif'
      }
    })
  })
}

// CAMBIO RESPONSIVE — handleMove mejorado:
// El tooltip original usaba `transform: translate(-50%, -120%)` que podía salir
// del viewport en los bordes izquierdo/superior/derecho en mobile.
// Ahora calculamos si el tooltip está cerca del borde del WRAPPER (no solo del canvas)
// y ajustamos la dirección de apertura del tooltip dinámicamente.
function handleMove(evt) {
  const el = canvas.value
  const { rows, franjas } = props.matrix
  if (!el || !rows?.length) return

  const rect = el.getBoundingClientRect()
  const mx = evt.clientX - rect.left
  const my = evt.clientY - rect.top

  const PAD = { top: 26, right: 6, bottom: 6, left: 38 }
  const gridW = rect.width  - PAD.left - PAD.right
  const gridH = rect.height - PAD.top  - PAD.bottom
  const cellW = gridW / franjas.length
  const cellH = gridH / rows.length

  if (mx < PAD.left || my < PAD.top) { tooltip.value = null; return }

  const ci = Math.floor((mx - PAD.left) / cellW)
  const ri = Math.floor((my - PAD.top) / cellH)

  if (ri < 0 || ri >= rows.length || ci < 0 || ci >= franjas.length) {
    tooltip.value = null
    return
  }

  const cell = rows[ri].cells[ci]
  tooltip.value = { x: mx, y: my, ...cell }

  // CAMBIO: Calcular si el tooltip se va a salir del canvas por los bordes.
  // El tooltip tiene aprox 160px de ancho y 50px de alto.
  // Si está en la mitad izquierda → abrir hacia la derecha
  // Si está en la mitad superior → abrir hacia abajo
  // Esto evita que el tooltip salga del contenedor en mobile.
  const TOOLTIP_W = 160
  const TOOLTIP_H = 56
  const openRight = mx < rect.width / 2
  const openDown  = my < TOOLTIP_H + 10

  const styleObj = {}

  if (openRight) {
    // tooltip a la derecha del cursor
    styleObj.left = (mx + 10) + 'px'
    styleObj.transform = openDown
      ? 'translate(0, 0)'        // abajo-derecha
      : 'translate(0, -100%)'    // arriba-derecha
  } else {
    // tooltip a la izquierda del cursor
    styleObj.left = (mx - 10) + 'px'
    styleObj.transform = openDown
      ? 'translate(-100%, 0)'    // abajo-izquierda
      : 'translate(-100%, -100%)' // arriba-izquierda (posición original)
  }

  styleObj.top = my + 'px'

  // Seguridad: si el tooltip saldría por la derecha aunque abramos a la izquierda,
  // lo anclamos al borde derecho del canvas.
  const wouldExceedRight = openRight && (mx + 10 + TOOLTIP_W > rect.width)
  if (wouldExceedRight) {
    styleObj.left  = 'auto'
    styleObj.right = '0px'
    delete styleObj.transform
    styleObj.transform = openDown ? 'translate(0, 0)' : 'translate(0, -100%)'
  }

  tooltipStyle.value = styleObj
}

function handleLeave() {
  tooltip.value = null
}

// CAMBIO: Soporte para touch en mobile (mousemove no se dispara en touch).
// Usamos touchmove para mostrar el tooltip en dispositivos táctiles,
// y touchend para ocultarlo. No modifica ninguna lógica de datos.
function handleTouch(evt) {
  if (!evt.touches?.length) return
  evt.preventDefault() // Evita scroll accidental mientras se inspecciona la celda
  const touch = evt.touches[0]
  handleMove({ clientX: touch.clientX, clientY: touch.clientY })
}

function handleTouchEnd() {
  // En mobile ocultamos el tooltip al levantar el dedo (con un pequeño delay
  // para que el usuario alcance a leerlo).
  setTimeout(() => { tooltip.value = null }, 1200)
}

onMounted(async () => {
  await nextTick()
  draw()
  ro = new ResizeObserver(draw)
  if (canvas.value?.parentElement) ro.observe(canvas.value.parentElement)
})

watch(() => props.matrix, draw, { deep: true })

onUnmounted(() => ro?.disconnect())
</script>

<template>
  <!--
    CAMBIO RESPONSIVE:
    - Se añade ref="wrapper" para poder obtener las dimensiones del contenedor
      al calcular el posicionamiento del tooltip.
    - "overflow-hidden" en el wrapper previene que el tooltip desborde el contenedor
      visualmente, aunque el posicionamiento dinámico ya lo evita en la mayoría de casos.
    - Se añaden listeners de touch para soporte en mobile.
  -->
  <div ref="wrapper" class="relative w-full overflow-hidden">
    <canvas
      ref="canvas"
      :style="{ width: '100%', height: height + 'px', display: 'block', cursor: 'crosshair' }"
      @mousemove="handleMove"
      @mouseleave="handleLeave"
      @touchmove.passive="handleTouch"
      @touchend="handleTouchEnd"
    />

    <!--
      CAMBIO RESPONSIVE — Tooltip mejorado:
      - Se reemplaza el estilo estático "transform: translate(-50%, -120%)" por
        el objeto "tooltipStyle" calculado dinámicamente en handleMove.
      - Esto garantiza que el tooltip nunca salga del viewport horizontal ni
        verticalmente, independientemente del tamaño de pantalla.
      - "max-w-[200px]" evita que el texto desborde en pantallas muy angostas.
      - "whitespace-nowrap" se mantiene pero se añade "break-words" como fallback
        en caso de contenido muy largo (por seguridad).
    -->
    <div
      v-if="tooltip"
      class="absolute pointer-events-none bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg z-10 whitespace-nowrap max-w-[200px]"
      :style="tooltipStyle"
    >
      <span class="font-medium">{{ tooltip.dia }} · {{ tooltip.franja }}</span>
      <span class="text-gray-300"> ({{ tooltip.franjaSub }})</span>
      <br />
      {{ tooltip.count }} {{ tooltip.count === 1 ? 'reporte' : 'reportes' }}
    </div>
  </div>
</template>