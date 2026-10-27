<template>
  <div class="shell">
    <AppHeader page="sim" />

    <main class="workspace">
      <h1 class="visually-hidden">Inverse kinematics by gradient descent</h1>
      <TerminalPane title="arm" :detail="armDetail" flush class="pane-arm">
        <ArmCanvas
          :positions="positions"
          :target="target"
          :reach="reach"
          :path="path"
          :joint-steps="isPaused && lastStep ? lastStep.details.angleStep : null"
          :racers="racers"
          @place-target="placeTarget"
        />
      </TerminalPane>

      <TerminalPane title="control" class="pane-control">
        <div class="controls">
          <RunPanel
            v-model:steps-per-second="settings.stepsPerSecond"
            :is-running="isRunning"
            :is-racing="isRacing"
            :is-paused="isPaused"
            :has-target="target != null"
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
          <p class="hint">
            new here? <a href="theory/">read how it works</a>
          </p>
        </div>
      </TerminalPane>

      <TerminalPane title="distance" detail="log scale" class="pane-plot">
        <LossPlot :runs="plotRuns" :tolerance="settings.tolerance" />
      </TerminalPane>

      <TerminalPane title="landscape" detail="θ₀ →, θ₁ ↑" class="pane-landscape">
        <LossLandscape
          :link-lengths="linkLengths"
          :angles="angles"
          :target="target"
          :path="path"
          :racers="racers"
          :interactive="!isBusy"
          @set-pose="setPose"
        />
      </TerminalPane>

      <TerminalPane title="step trace" class="pane-step">
        <StepTrace :step="lastStep" />
      </TerminalPane>
    </main>

    <StatusBar
      :is-running="isRunning"
      :is-racing="isRacing"
      :is-paused="isPaused"
      :target="target"
      :is-target-reachable="isTargetReachable"
      :iteration="iteration"
      :distance="distance"
      :outcome="outcome"
    />
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import AppHeader from './components/AppHeader.vue'
import ArmCanvas from './components/ArmCanvas.vue'
import LossLandscape from './components/LossLandscape.vue'
import LossPlot from './components/LossPlot.vue'
import RunPanel from './components/RunPanel.vue'
import SolverSettings from './components/SolverSettings.vue'
import StatusBar from './components/StatusBar.vue'
import StepTrace from './components/StepTrace.vue'
import TerminalPane from './components/TerminalPane.vue'
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

const armDetail = computed(() => `${settings.linkCount} link${settings.linkCount > 1 ? 's' : ''} · click to place target`)

const plotRuns = computed(() => {
  if (!racers.value.length) return runs.value
  return racers.value.map((racer) => ({
    label: racer.converged ? `${racer.label}, done in ${racer.distances.length - 1}` : racer.label,
    distances: racer.distances,
    optimizer: racer.optimizer,
    isCurrent: true,
  }))
})
</script>

<style scoped>
.shell {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 100dvh;
  padding: 0 0.75rem;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
  padding: 0.75rem 0 1rem;
}

.pane-arm {
  aspect-ratio: 1;
  max-height: 80vh;
}

.pane-plot,
.pane-landscape {
  height: 240px;
}

.controls {
  display: grid;
  gap: 1rem;
}

.hint {
  margin: 0;
  color: var(--muted);
}

@media (min-width: 960px) and (min-height: 620px) {
  .shell {
    height: 100dvh;
    overflow: hidden;
  }

  .workspace {
    grid-template-columns: repeat(3, minmax(0, 1fr)) 19rem;
    grid-template-rows: minmax(0, 1fr) clamp(190px, 30vh, 280px);
    grid-template-areas:
      'arm arm arm control'
      'plot landscape step control';
    min-height: 0;
  }

  .pane-arm {
    grid-area: arm;
    aspect-ratio: auto;
    max-height: none;
  }

  .pane-control {
    grid-area: control;
  }

  .pane-plot {
    grid-area: plot;
    height: auto;
  }

  .pane-landscape {
    grid-area: landscape;
    height: auto;
  }

  .pane-step {
    grid-area: step;
  }
}
</style>
