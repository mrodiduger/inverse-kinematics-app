<template>
  <canvas
    ref="canvas"
    class="arm-canvas"
    aria-label="Robot arm. Click to place the target."
    @click="onClick"
  ></canvas>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { drawScene, readPalette } from '../draw'
import { createView } from '../view'

const props = defineProps({
  positions: { type: Array, required: true },
  target: { type: Array, default: null },
  reach: { type: Object, required: true },
  path: { type: Array, default: () => [] },
  jointSteps: { type: Array, default: null },
})

const emit = defineEmits(['place-target'])

const canvas = ref()
let context = null
let view = null
let palette = null
let frameRequest = null
let resizeObserver = null
const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')

watch(() => [props.positions, props.target, props.reach, props.path, props.jointSteps], requestDraw)

function requestDraw() {
  if (frameRequest == null) {
    frameRequest = requestAnimationFrame(draw)
  }
}

function draw() {
  frameRequest = null
  view = createView(canvas.value.width, canvas.value.height, props.reach.outer)
  drawScene(context, view, props, palette, window.devicePixelRatio)
}

function resize() {
  const pixelRatio = window.devicePixelRatio
  canvas.value.width = Math.round(canvas.value.clientWidth * pixelRatio)
  canvas.value.height = Math.round(canvas.value.clientHeight * pixelRatio)
  requestDraw()
}

function updatePalette() {
  palette = readPalette(canvas.value)
  requestDraw()
}

function onClick(event) {
  const bounds = canvas.value.getBoundingClientRect()
  const point = [
    (event.clientX - bounds.left) * canvas.value.width / bounds.width,
    (event.clientY - bounds.top) * canvas.value.height / bounds.height,
  ]
  emit('place-target', view.toWorld(point))
}

onMounted(() => {
  context = canvas.value.getContext('2d')
  palette = readPalette(canvas.value)
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas.value)
  colorScheme.addEventListener('change', updatePalette)
})

onUnmounted(() => {
  cancelAnimationFrame(frameRequest)
  resizeObserver.disconnect()
  colorScheme.removeEventListener('change', updatePalette)
})
</script>

<style scoped>
.arm-canvas {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--canvas-background);
  cursor: crosshair;
  touch-action: manipulation;
}
</style>
