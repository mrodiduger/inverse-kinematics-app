<template>
  <div id="sidebar">
    <Config
      v-model:learningRate.number="learningRate"
      v-model:numLinks.number="numLinks"
      v-model:maxIteration.number="maxIteration"
      v-model:tolerance.number="tolerance"
      v-model:lossFunction="lossFunction"
      v-model:optimizer="optimizer"
    />
    <p>Iteration: {{ iteration }}</p>
    <p>Distance to target: {{ distance == null ? '–' : distance.toFixed(3) }}</p>
    <p class="status">{{ status }}</p>
    <button type="button" class="btn btn-primary" :disabled="isRunning || !target" @click="simulate">Simulate</button>
    <button type="button" class="btn btn-primary" :disabled="!isRunning" @click="stopByUser">Stop</button>
    <button type="button" class="btn btn-outline-secondary" :disabled="isRunning" @click="resetPose">Reset pose</button>
  </div>
  <div id="canvas">
    <canvas ref="canvasElement" class="arm-canvas" @click="placeTarget"></canvas>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import Config from './Config.vue'
import { createSimulation, forwardKinematics, OPTIMIZERS, restPose, workspace } from '../simulation'
import { createView } from '../view'
import { drawScene } from '../draw'

const LINK_LENGTH = 1

const learningRate = ref(OPTIMIZERS[0].learningRate)
const numLinks = ref(2)
const maxIteration = ref(500)
const tolerance = ref(0.01)
const lossFunction = ref(0)
const optimizer = ref(0)

const angles = ref(restPose(numLinks.value))
const target = ref(null)
const iteration = ref(0)
const outcome = ref(null)
const isRunning = ref(false)

const linkLengths = computed(() => new Array(numLinks.value).fill(LINK_LENGTH))
const positions = computed(() => forwardKinematics(linkLengths.value, angles.value))
const reach = computed(() => workspace(linkLengths.value))

const distance = computed(() => {
  if (!target.value) return null
  const [x, y] = positions.value[positions.value.length - 1]
  return Math.hypot(x - target.value[0], y - target.value[1])
})

const isTargetReachable = computed(() => {
  const radius = Math.hypot(...target.value)
  return radius >= reach.value.inner - tolerance.value && radius <= reach.value.outer + tolerance.value
})

const status = computed(() => {
  if (!target.value) return 'Click the canvas to place a target.'
  if (isRunning.value) return 'Running…'
  if (outcome.value === 'converged') return `Reached the target in ${iteration.value} iterations.`
  if (!isTargetReachable.value) return 'The target is out of reach. The arm can only get as close as possible.'
  if (outcome.value === 'limit') return 'Hit the iteration limit before reaching the target.'
  if (outcome.value === 'stopped') return 'Stopped.'
  return ''
})

const canvasElement = ref()
let canvasContext = null
let view = null
let simulation = null
let frameRequest = null
let resizeObserver = null

watch(numLinks, (linkCount) => {
  stop()
  angles.value = restPose(linkCount)
  iteration.value = 0
  outcome.value = null
})

watch(optimizer, (optimizerId) => {
  learningRate.value = OPTIMIZERS[optimizerId].learningRate
})

watch([positions, target], requestDraw)

function simulate() {
  simulation = createSimulation({
    learningRate: learningRate.value,
    maxIteration: maxIteration.value,
    tolerance: tolerance.value,
    lossFunction: lossFunction.value,
    optimizer: optimizer.value,
    linkLengths: linkLengths.value,
    initialAngles: angles.value,
    target: target.value,
  })
  iteration.value = 0
  outcome.value = null
  isRunning.value = true
  requestDraw()
}

function step() {
  const state = simulation.step()
  angles.value = state.angles
  iteration.value = state.iteration

  if (state.done) {
    stop()
    outcome.value = state.converged ? 'converged' : 'limit'
  }
}

function stop() {
  simulation = null
  isRunning.value = false
}

function stopByUser() {
  stop()
  outcome.value = 'stopped'
}

function resetPose() {
  angles.value = restPose(numLinks.value)
  iteration.value = 0
  outcome.value = null
}

function requestDraw() {
  if (frameRequest == null) {
    frameRequest = requestAnimationFrame(onFrame)
  }
}

function onFrame() {
  frameRequest = null
  if (simulation) {
    step()
  }
  draw()
  if (simulation) {
    requestDraw()
  }
}

function draw() {
  const canvas = canvasElement.value
  view = createView(canvas.width, canvas.height, reach.value.outer)
  drawScene(canvasContext, view, { positions: positions.value, target: target.value }, window.devicePixelRatio)
}

function resizeCanvas() {
  const canvas = canvasElement.value
  const pixelRatio = window.devicePixelRatio
  canvas.width = Math.round(canvas.clientWidth * pixelRatio)
  canvas.height = Math.round(canvas.clientHeight * pixelRatio)
  requestDraw()
}

function placeTarget(event) {
  const canvas = canvasElement.value
  const bounds = canvas.getBoundingClientRect()
  const point = [
    (event.clientX - bounds.left) * canvas.width / bounds.width,
    (event.clientY - bounds.top) * canvas.height / bounds.height,
  ]
  target.value = view.toWorld(point)
  simulation?.setTarget(target.value)
  if (!isRunning.value) {
    outcome.value = null
  }
}

onMounted(() => {
  canvasContext = canvasElement.value.getContext('2d')
  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(canvasElement.value)
})

onUnmounted(() => {
  stop()
  cancelAnimationFrame(frameRequest)
  resizeObserver.disconnect()
})
</script>

<style scoped>
#sidebar {
  float: left;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 10px;
}

#sidebar button {
  width: 100%;
}

#sidebar button:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.status {
  min-height: 3em;
  text-align: center;
}

.arm-canvas {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  margin: 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
  cursor: crosshair;
}

@media screen and (min-width: 800px) {
  #sidebar {
    width: 15vw;
    height: 95vh;
  }

  .arm-canvas {
    width: 80vw;
  }
}
</style>
