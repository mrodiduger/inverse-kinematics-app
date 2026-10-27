import { onUnmounted, ref, shallowRef, watch } from 'vue'
import { createSimulation, OPTIMIZERS } from './simulation'

// Runs every optimizer, each with its default learning rate, from the
// solver's current pose to its target.
export function useRace(settings, solver) {
  const racers = shallowRef([])
  const isRacing = ref(false)
  let frameRequest = null

  watch([solver.target, () => settings.linkCount, solver.angles], clear)

  function start() {
    if (!solver.target.value || solver.isRunning.value) return
    clear()

    racers.value = OPTIMIZERS.map(({ name, learningRate }, optimizer) => ({
      optimizer,
      name,
      label: `${name}, lr ${learningRate}`,
      simulation: createSimulation({
        learningRate,
        optimizer,
        lossFunction: settings.lossFunction,
        maxIteration: settings.maxIteration,
        tolerance: settings.tolerance,
        linkLengths: solver.linkLengths.value,
        initialAngles: solver.angles.value,
        target: solver.target.value,
      }),
      positions: solver.positions.value,
      path: [solver.positions.value],
      distances: [solver.distance.value],
      done: false,
      converged: false,
    }))
    isRacing.value = true
    frameRequest = requestAnimationFrame(onFrame)
  }

  function onFrame() {
    racers.value = racers.value.map((racer) => {
      if (racer.done) return racer

      const state = racer.simulation.step()
      return {
        ...racer,
        positions: state.positions,
        path: [...racer.path, state.positions],
        distances: [...racer.distances, state.distance],
        done: state.done,
        converged: state.converged,
      }
    })

    if (racers.value.every((racer) => racer.done)) {
      stop()
    } else {
      frameRequest = requestAnimationFrame(onFrame)
    }
  }

  function stop() {
    cancelAnimationFrame(frameRequest)
    frameRequest = null
    isRacing.value = false
  }

  function clear() {
    stop()
    racers.value = []
  }

  onUnmounted(stop)

  return { racers, isRacing, start, stop, clear }
}
