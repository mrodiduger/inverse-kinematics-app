<template>
  <header class="masthead">
    <h1>Inverse kinematics by gradient descent</h1>
    <p>
      Click the grid to place a target. The arm searches for joint angles that reach it by
      repeatedly stepping downhill on the distance to the target.
      <a href="theory/">How the maths works</a>
    </p>
  </header>

  <main class="layout">
    <section class="stage" aria-label="Arm">
      <ArmCanvas
        :positions="positions"
        :target="target"
        :reach="reach"
        :path="path"
        :joint-steps="isPaused && lastStep ? lastStep.details.angleStep : null"
        :racers="racers"
        @place-target="placeTarget"
      />
    </section>

    <aside class="panel">
      <RunPanel
        v-model:steps-per-second="settings.stepsPerSecond"
        :is-running="isRunning"
        :is-racing="isRacing"
        :is-paused="isPaused"
        :has-target="target != null"
        :is-target-reachable="isTargetReachable"
        :iteration="iteration"
        :distance="distance"
        :outcome="outcome"
        @run="run"
        @pause="pause"
        @step="step"
        @reset="reset"
        @race="startRace"
        @stop-race="stopRace"
      />
      <SolverSettings
        v-model:link-count="settings.linkCount"
        v-model:loss-function="settings.lossFunction"
        v-model:optimizer="settings.optimizer"
        v-model:learning-rate="settings.learningRate"
        v-model:max-iteration="settings.maxIteration"
        v-model:tolerance="settings.tolerance"
        :disabled="isBusy"
      />
    </aside>

    <section class="figures" aria-label="Charts">
      <LossPlot :runs="plotRuns" :tolerance="settings.tolerance" />
      <LossLandscape
        :link-lengths="linkLengths"
        :angles="angles"
        :target="target"
        :path="path"
        :racers="racers"
        :interactive="!isBusy"
        @set-pose="setPose"
      />
    </section>

    <div class="reading">
      <StepBreakdown :step="lastStep" />
    </div>
  </main>

  <footer class="footer">
    <a href="https://github.com/mrodiduger/inverse-kinematics-app">Source on GitHub</a>
  </footer>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import ArmCanvas from './components/ArmCanvas.vue'
import LossLandscape from './components/LossLandscape.vue'
import LossPlot from './components/LossPlot.vue'
import RunPanel from './components/RunPanel.vue'
import SolverSettings from './components/SolverSettings.vue'
import StepBreakdown from './components/StepBreakdown.vue'
import { OPTIMIZERS } from './simulation'
import { useRace } from './useRace'
import { useSolver } from './useSolver'

const settings = reactive({
  linkCount: 2,
  lossFunction: 0,
  optimizer: 0,
  learningRate: OPTIMIZERS[0].learningRate,
  maxIteration: 500,
  tolerance: 0.01,
  stepsPerSecond: 30,
})

watch(() => settings.optimizer, (optimizer) => {
  settings.learningRate = OPTIMIZERS[optimizer].learningRate
})

const solver = useSolver(settings)
const {
  angles,
  linkLengths,
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
  setPose,
  placeTarget,
} = solver

const { racers, isRacing, start: startRace, stop: stopRace } = useRace(settings, solver)

const isBusy = computed(() => isRunning.value || isRacing.value)

const plotRuns = computed(() => {
  if (!racers.value.length) return runs.value
  return racers.value.map((racer) => ({
    label: racer.converged ? `${racer.label}, reached in ${racer.distances.length - 1}` : racer.label,
    distances: racer.distances,
    optimizer: racer.optimizer,
    isCurrent: true,
  }))
})
</script>

<style scoped>
.masthead {
  margin-bottom: 1.5rem;
}

.masthead h1 {
  margin: 0 0 0.4rem;
  font-family: var(--font-serif);
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.masthead p {
  max-width: 62ch;
  margin: 0;
  color: var(--muted);
}

.layout {
  display: grid;
  gap: 1.5rem;
}

.stage {
  aspect-ratio: 1;
  max-height: 75vh;
  border: 1px solid var(--rule);
  overflow: hidden;
}

.panel {
  display: grid;
  align-content: start;
  gap: 1.5rem;
}

.figures {
  display: grid;
  gap: 2rem;
  align-items: start;
}

@media (min-width: 640px) {
  .figures {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

.reading {
  display: grid;
  gap: 2.5rem;
  margin-top: 1rem;
}

.footer {
  margin-top: 3rem;
  padding-top: 1rem;
  border-top: 1px solid var(--rule);
  font-size: 0.85rem;
}

@media (min-width: 960px) {
  .stage {
    aspect-ratio: auto;
    height: min(70vh, 720px);
    max-height: none;
  }

  .layout {
    grid-template-columns: minmax(0, 1fr) 19rem;
    column-gap: 2rem;
  }

  .panel {
    grid-row: span 2;
  }

  .figures,
  .reading {
    grid-column: 1;
  }
}
</style>
