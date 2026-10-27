import { computed, onUnmounted, ref, watch } from 'vue'
import { createSimulation, forwardKinematics, restPose, workspace } from './simulation'

export const LINK_LENGTH = 1

export function useSolver(settings) {
  const angles = ref(restPose(settings.linkCount))
  const target = ref(null)
  const iteration = ref(0)
  const outcome = ref(null)
  const isRunning = ref(false)

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

  let simulation = null
  let frameRequest = null

  watch(() => settings.linkCount, reset)

  function run() {
    if (!target.value || isRunning.value) return

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
    iteration.value = 0
    outcome.value = null
    isRunning.value = true
    frameRequest = requestAnimationFrame(onFrame)
  }

  function onFrame() {
    const state = simulation.step()
    angles.value = state.angles
    iteration.value = state.iteration

    if (state.done) {
      finish(state.converged ? 'converged' : 'limit')
    } else {
      frameRequest = requestAnimationFrame(onFrame)
    }
  }

  function finish(result) {
    cancelAnimationFrame(frameRequest)
    frameRequest = null
    simulation = null
    isRunning.value = false
    outcome.value = result
  }

  function stop() {
    if (isRunning.value) finish('stopped')
  }

  function reset() {
    finish(null)
    angles.value = restPose(settings.linkCount)
    iteration.value = 0
  }

  function placeTarget(point) {
    target.value = point
    simulation?.setTarget(point)
    if (!isRunning.value) outcome.value = null
  }

  onUnmounted(() => finish(null))

  return {
    angles,
    target,
    iteration,
    outcome,
    isRunning,
    positions,
    reach,
    distance,
    isTargetReachable,
    run,
    stop,
    reset,
    placeTarget,
  }
}
