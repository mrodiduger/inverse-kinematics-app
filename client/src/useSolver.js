import { computed, onUnmounted, ref, shallowRef, triggerRef, watch } from 'vue'
import {
  createSimulation,
  forwardKinematics,
  LOSS_FUNCTIONS,
  OPTIMIZERS,
  restPose,
  workspace,
} from './simulation'

export const LINK_LENGTH = 1
const MAX_PREVIOUS_RUNS = 3
const MAX_STEPS_PER_FRAME = 20

function describeRun(settings) {
  const optimizer = OPTIMIZERS[settings.optimizer].name
  const loss = LOSS_FUNCTIONS[settings.lossFunction].toLowerCase()
  return `${optimizer}, ${loss}, lr ${settings.learningRate}`
}

export function useSolver(settings) {
  const angles = ref(restPose(settings.linkCount))
  const target = ref(null)
  const iteration = ref(0)
  const outcome = ref(null)
  const isRunning = ref(false)
  const isPaused = ref(false)
  const lastStep = shallowRef(null)

  const path = shallowRef([])
  const distances = shallowRef([])
  const runLabel = ref('')
  const previousRuns = shallowRef([])

  const linkLengths = computed(() => new Array(settings.linkCount).fill(LINK_LENGTH))
  const positions = computed(() => forwardKinematics(linkLengths.value, angles.value))
  const reach = computed(() => workspace(linkLengths.value))

  const distance = computed(() => {
    if (!target.value) return null
    const [x, y] = positions.value[positions.value.length - 1]
    return Math.hypot(x - target.value[0], y - target.value[1])
  })

  const isTargetReachable = computed(() => {
    if (!target.value) return true
    const radius = Math.hypot(...target.value)
    return radius >= reach.value.inner - settings.tolerance
      && radius <= reach.value.outer + settings.tolerance
  })

  const runs = computed(() => {
    const current = distances.value.length > 1
      ? [{ label: runLabel.value, distances: distances.value, isCurrent: true }]
      : []
    return [...current, ...previousRuns.value]
  })

  let simulation = null
  let simulationSettings = null
  let frameRequest = null
  let lastFrameTime = null
  let stepBudget = 0

  watch(() => settings.linkCount, () => {
    reset()
    previousRuns.value = []
  })

  watch(
    () => [settings.learningRate, settings.lossFunction, settings.optimizer, settings.maxIteration, settings.tolerance],
    () => {
      if (isPaused.value) finish(null)
    },
  )

  function archiveRun() {
    if (distances.value.length > 1) {
      previousRuns.value = [
        { label: runLabel.value, distances: distances.value, isCurrent: false },
        ...previousRuns.value,
      ].slice(0, MAX_PREVIOUS_RUNS)
    }
    path.value = []
    distances.value = []
  }

  function startSimulation() {
    simulationSettings = {
      lossFunction: settings.lossFunction,
      optimizer: settings.optimizer,
      learningRate: settings.learningRate,
    }
    simulation = createSimulation({
      learningRate: settings.learningRate,
      maxIteration: settings.maxIteration,
      tolerance: settings.tolerance,
      lossFunction: settings.lossFunction,
      optimizer: settings.optimizer,
      linkLengths: linkLengths.value,
      initialAngles: angles.value,
      target: target.value,
    })
    archiveRun()
    path.value = [positions.value]
    distances.value = [distance.value]
    runLabel.value = describeRun(settings)
    iteration.value = 0
    outcome.value = null
    lastStep.value = null
  }

  function advance() {
    const state = simulation.step()
    angles.value = state.angles
    iteration.value = state.iteration
    lastStep.value = { ...state, settings: simulationSettings }
    path.value.push(state.positions)
    distances.value.push(state.distance)
    triggerRef(path)
    triggerRef(distances)

    if (state.done) finish(state.converged ? 'converged' : 'limit')
  }

  function run() {
    if (!target.value || isRunning.value) return
    if (!simulation) startSimulation()

    isRunning.value = true
    isPaused.value = false
    lastFrameTime = null
    stepBudget = 1
    frameRequest = requestAnimationFrame(onFrame)
  }

  function onFrame(time) {
    if (lastFrameTime != null) {
      stepBudget += (time - lastFrameTime) * settings.stepsPerSecond / 1000
    }
    lastFrameTime = time

    const stepCount = Math.min(Math.floor(stepBudget), MAX_STEPS_PER_FRAME)
    stepBudget -= Math.floor(stepBudget)
    for (let index = 0; index < stepCount && simulation; index += 1) {
      advance()
    }

    if (simulation) frameRequest = requestAnimationFrame(onFrame)
  }

  function pause() {
    if (!isRunning.value) return
    cancelAnimationFrame(frameRequest)
    frameRequest = null
    isRunning.value = false
    isPaused.value = true
  }

  function step() {
    if (!target.value || isRunning.value) return
    if (!simulation) startSimulation()
    isPaused.value = true
    advance()
  }

  function finish(result) {
    cancelAnimationFrame(frameRequest)
    frameRequest = null
    simulation = null
    isRunning.value = false
    isPaused.value = false
    outcome.value = result
  }

  function reset() {
    finish(null)
    archiveRun()
    angles.value = restPose(settings.linkCount)
    iteration.value = 0
    lastStep.value = null
  }

  function placeTarget(point) {
    target.value = point
    simulation?.setTarget(point)
    if (!simulation) {
      outcome.value = null
      lastStep.value = null
      path.value = []
      distances.value = []
      previousRuns.value = []
    }
  }

  onUnmounted(() => finish(null))

  return {
    target,
    iteration,
    outcome,
    isRunning,
    isPaused,
    lastStep,
    positions,
    path,
    runs,
    reach,
    distance,
    isTargetReachable,
    run,
    pause,
    step,
    reset,
    placeTarget,
  }
}
