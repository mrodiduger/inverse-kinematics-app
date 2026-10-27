<template>
  <div class="run-panel">
    <div class="buttons">
      <button v-if="!isRunning" type="button" class="primary" :disabled="!hasTarget || isRacing" @click="emit('run')">
        {{ isPaused ? 'Resume' : 'Run' }}
      </button>
      <button v-else type="button" class="primary" @click="emit('pause')">Pause</button>
      <button type="button" :disabled="!hasTarget || isRunning || isRacing" @click="emit('step')">Step</button>
      <button type="button" :disabled="isRacing" @click="emit('reset')">Reset</button>
    </div>

    <button v-if="!isRacing" type="button" :disabled="!hasTarget || isRunning" @click="emit('race')">
      Race all four optimizers
    </button>
    <button v-else type="button" @click="emit('stop-race')">Stop race</button>

    <SegmentedControl v-model="stepsPerSecond" legend="Speed" name="speed" :options="SPEED_OPTIONS" />

    <dl class="readouts">
      <div>
        <dt>Iteration</dt>
        <dd class="number">{{ iteration }}</dd>
      </div>
      <div>
        <dt>Distance</dt>
        <dd class="number">{{ distance == null ? '–' : distance.toFixed(3) }}</dd>
      </div>
    </dl>

    <p class="status" role="status">{{ status }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SegmentedControl from './SegmentedControl.vue'

const SPEED_OPTIONS = [
  { value: 4, label: 'Slow' },
  { value: 30, label: 'Normal' },
  { value: 240, label: 'Fast' },
]

const props = defineProps({
  isRunning: { type: Boolean, required: true },
  isRacing: { type: Boolean, default: false },
  isPaused: { type: Boolean, required: true },
  hasTarget: { type: Boolean, required: true },
  isTargetReachable: { type: Boolean, required: true },
  iteration: { type: Number, required: true },
  distance: { type: Number, default: null },
  outcome: { type: String, default: null },
})

const emit = defineEmits(['run', 'pause', 'step', 'reset', 'race', 'stop-race'])

const stepsPerSecond = defineModel('stepsPerSecond', { required: true })

const status = computed(() => {
  if (!props.hasTarget) return 'Click anywhere on the grid to place a target.'
  if (props.outcome === 'converged') return `Reached the target in ${props.iteration} iterations.`
  if (props.isRacing) return 'Racing every optimizer, each with its default learning rate, from the same pose.'
  if (!props.isTargetReachable) return 'This target is out of reach. The best the arm can do is point at it.'
  if (props.isRunning) return 'Running.'
  if (props.isPaused) return 'Paused. Press Step to go one iteration at a time.'
  if (props.outcome === 'limit') return 'Hit the iteration limit before reaching the target.'
  return 'Press Run to animate, or Step to go one iteration at a time.'
})
</script>

<style scoped>
.run-panel {
  display: grid;
  gap: 0.75rem;
}

.buttons {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  gap: 0.5rem;
}

.readouts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin: 0;
}

.readouts dt {
  font-size: 0.8rem;
  color: var(--muted);
}

.readouts dd {
  margin: 0;
  font-size: 1.25rem;
}

.status {
  min-height: 2.8em;
  margin: 0;
  color: var(--muted);
}
</style>
