<template>
  <figure class="landscape">
    <figcaption>Distance over every pose <span class="muted">· two links</span></figcaption>

    <div v-if="linkLengths.length !== 2" class="empty">
      With two links every pose is a point on a flat map of the two joint angles.
      Choose 2 links to see it.
    </div>

    <div v-else class="chart">
      <span class="axis-label y">elbow θ<sub>1</sub></span>
      <div class="y-ticks number" aria-hidden="true"><span>π</span><span>0</span><span>−π</span></div>
      <canvas
        ref="canvas"
        :class="{ interactive }"
        role="img"
        :aria-label="description"
        @click="onClick"
      ></canvas>
      <div class="x-ticks number" aria-hidden="true"><span>−π</span><span>0</span><span>π</span></div>
      <span class="axis-label x">shoulder θ<sub>0</sub></span>
    </div>

    <p v-if="linkLengths.length === 2" class="caption">
      Lighter is closer. <span class="solution-key">×</span> marks an exact solution.
      {{ interactive ? 'Click to start the arm from that pose.' : '' }}
    </p>
  </figure>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { readPalette } from '../draw'
import { forwardKinematics, twoLinkSolutions, wrapAngle } from '../simulation'

const BAND_COUNT = 10

const props = defineProps({
  linkLengths: { type: Array, required: true },
  angles: { type: Array, required: true },
  target: { type: Array, default: null },
  path: { type: Array, default: () => [] },
  racers: { type: Array, default: () => [] },
  interactive: { type: Boolean, default: true },
})

const emit = defineEmits(['set-pose'])

const canvas = ref()
let context = null
let palette = null
let heatmap = null
let frameRequest = null
let resizeObserver = null
const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')

const solutions = computed(() => (props.target ? twoLinkSolutions(props.linkLengths, props.target) : []))

const description = computed(() => {
  const count = solutions.value.length
  if (!props.target) return 'Map of joint angles. Place a target to shade it by distance.'
  if (count === 0) return 'Map of joint angles shaded by distance. The target is out of reach, so there is no exact solution.'
  return 'Map of joint angles shaded by distance to the target, with two exact solutions marked.'
})

watch(() => [props.target, props.linkLengths], () => {
  heatmap = null
  requestDraw()
})
watch(() => [props.angles, props.path, props.racers], requestDraw)
watch(() => props.linkLengths.length, async (count) => {
  resizeObserver?.disconnect()
  if (count !== 2) return
  await nextTick()
  setUp()
})

function toScreen([shoulder, elbow]) {
  const size = canvas.value.width
  return [
    (wrapAngle(shoulder) + Math.PI) / (2 * Math.PI) * size,
    (Math.PI - wrapAngle(elbow)) / (2 * Math.PI) * size,
  ]
}

function anglesFromPositions(positions) {
  const [[x0, y0], [x1, y1]] = positions
  const shoulder = Math.atan2(y0, x0)
  return [shoulder, wrapAngle(Math.atan2(y1 - y0, x1 - x0) - shoulder)]
}

function renderHeatmap() {
  const size = canvas.value.width
  const offscreen = document.createElement('canvas')
  offscreen.width = size
  offscreen.height = size
  const offscreenContext = offscreen.getContext('2d')
  const image = offscreenContext.createImageData(size, size)
  const low = parseHex(palette.background)
  const high = parseHex(palette.landscapeHigh)
  const largest = props.linkLengths[0] + props.linkLengths[1] + Math.hypot(...props.target)

  for (let row = 0; row < size; row += 1) {
    const elbow = Math.PI - (row + 0.5) / size * 2 * Math.PI
    for (let column = 0; column < size; column += 1) {
      const shoulder = (column + 0.5) / size * 2 * Math.PI - Math.PI
      const [, [x, y]] = forwardKinematics(props.linkLengths, [shoulder, elbow])
      const distance = Math.hypot(x - props.target[0], y - props.target[1])
      const band = Math.min(Math.floor(Math.sqrt(distance / largest) * BAND_COUNT), BAND_COUNT - 1)
      const mix = band / (BAND_COUNT - 1)
      const offset = (row * size + column) * 4
      for (let channel = 0; channel < 3; channel += 1) {
        image.data[offset + channel] = low[channel] + (high[channel] - low[channel]) * mix
      }
      image.data[offset + 3] = 255
    }
  }

  offscreenContext.putImageData(image, 0, 0)
  return offscreen
}

function requestDraw() {
  if (frameRequest == null && canvas.value) {
    frameRequest = requestAnimationFrame(draw)
  }
}

function draw() {
  frameRequest = null
  if (!canvas.value || !context) return

  const size = canvas.value.width
  const px = (value) => value * window.devicePixelRatio
  context.clearRect(0, 0, size, size)

  if (props.target) {
    heatmap ??= renderHeatmap()
    context.drawImage(heatmap, 0, 0)
  } else {
    context.fillStyle = palette.background
    context.fillRect(0, 0, size, size)
  }

  context.strokeStyle = palette.axis
  context.lineWidth = px(1)
  context.beginPath()
  context.moveTo(size / 2, 0)
  context.lineTo(size / 2, size)
  context.moveTo(0, size / 2)
  context.lineTo(size, size / 2)
  context.stroke()

  if (props.racers.length) {
    props.racers.forEach(({ path, optimizer }) => drawTrajectory(path, palette.optimizers[optimizer], px))
    props.racers.forEach(({ positions, optimizer }) => drawPoint(anglesFromPositions(positions), palette.optimizers[optimizer], px))
  } else {
    drawTrajectory(props.path, palette.arm, px)
  }
  drawPoint(props.angles, palette.arm, px)
  solutions.value.forEach((solution) => drawCross(solution, px))
}

function drawTrajectory(path, color, px) {
  if (path.length < 2) return

  const size = canvas.value.width
  context.strokeStyle = color
  context.lineWidth = px(1.5)
  context.lineJoin = 'round'
  context.beginPath()
  let previous = null
  path.forEach((positions) => {
    const point = toScreen(anglesFromPositions(positions))
    const wrapsAround = previous
      && (Math.abs(point[0] - previous[0]) > size / 2 || Math.abs(point[1] - previous[1]) > size / 2)
    if (!previous || wrapsAround) context.moveTo(...point)
    else context.lineTo(...point)
    previous = point
  })
  context.stroke()
}

function drawPoint(angles, color, px) {
  const [x, y] = toScreen(angles)
  context.fillStyle = color
  context.strokeStyle = palette.background
  context.lineWidth = px(2)
  context.beginPath()
  context.arc(x, y, px(4.5), 0, 2 * Math.PI)
  context.fill()
  context.stroke()
}

function drawCross(angles, px) {
  const [x, y] = toScreen(angles)
  const arm = px(5)
  context.strokeStyle = palette.target
  context.lineWidth = px(2)
  context.beginPath()
  context.moveTo(x - arm, y - arm)
  context.lineTo(x + arm, y + arm)
  context.moveTo(x + arm, y - arm)
  context.lineTo(x - arm, y + arm)
  context.stroke()
}

function parseHex(hex) {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function resize() {
  if (!canvas.value) return
  const size = Math.round(canvas.value.clientWidth * window.devicePixelRatio)
  canvas.value.width = size
  canvas.value.height = size
  heatmap = null
  requestDraw()
}

function updatePalette() {
  if (!canvas.value) return
  palette = readPalette(canvas.value)
  heatmap = null
  requestDraw()
}

function onClick(event) {
  if (!props.interactive) return
  const bounds = canvas.value.getBoundingClientRect()
  const shoulder = (event.clientX - bounds.left) / bounds.width * 2 * Math.PI - Math.PI
  const elbow = Math.PI - (event.clientY - bounds.top) / bounds.height * 2 * Math.PI
  emit('set-pose', [shoulder, elbow])
}

function setUp() {
  if (!canvas.value) return
  context = canvas.value.getContext('2d')
  palette = readPalette(canvas.value)
  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas.value)
}

onMounted(() => {
  setUp()
  colorScheme.addEventListener('change', updatePalette)
})

onUnmounted(() => {
  cancelAnimationFrame(frameRequest)
  resizeObserver?.disconnect()
  colorScheme.removeEventListener('change', updatePalette)
})
</script>

<style scoped>
.landscape {
  margin: 0;
}

figcaption {
  margin-bottom: 0.35rem;
}

.muted {
  color: var(--muted);
}

.empty {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  max-width: 320px;
  padding: 1.5rem;
  border: 1px dashed var(--rule);
  color: var(--muted);
  font-size: 0.85rem;
  text-align: center;
}

.chart {
  display: grid;
  grid-template-columns: auto auto minmax(0, 320px);
  grid-template-rows: auto auto auto;
  column-gap: 0.35rem;
  align-items: stretch;
}

canvas {
  grid-column: 3;
  grid-row: 1;
  display: block;
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid var(--rule);
}

canvas.interactive {
  cursor: crosshair;
}

.axis-label {
  color: var(--muted);
  font-size: 0.8rem;
}

.axis-label.y {
  grid-column: 1;
  grid-row: 1;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  text-align: center;
}

.axis-label.x {
  grid-column: 3;
  grid-row: 3;
  text-align: center;
}

.y-ticks {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
}

.x-ticks {
  grid-column: 3;
  grid-row: 2;
  display: flex;
  justify-content: space-between;
}

.y-ticks,
.x-ticks {
  color: var(--muted);
  font-size: 10px;
  line-height: 1.4;
}

.caption {
  margin: 0.5rem 0 0;
  color: var(--muted);
  font-size: 0.8rem;
}

.solution-key {
  color: var(--target);
  font-weight: 600;
}
</style>
