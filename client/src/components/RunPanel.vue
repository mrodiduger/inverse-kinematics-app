<template>
  <div class="run-panel">
    <div class="buttons">
      <button v-if="!isRunning" type="button" class="primary" :disabled="!hasTarget" @click="emit('run')">Run</button>
      <button v-else type="button" class="primary" @click="emit('stop')">Stop</button>
      <button type="button" @click="emit('reset')">Reset pose</button>
    </div>

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

const props = defineProps({
  isRunning: { type: Boolean, required: true },
  hasTarget: { type: Boolean, required: true },
  isTargetReachable: { type: Boolean, required: true },
  iteration: { type: Number, required: true },
  distance: { type: Number, default: null },
  outcome: { type: String, default: null },
})

const emit = defineEmits(['run', 'stop', 'reset'])

const status = computed(() => {
  if (!props.hasTarget) return 'Click anywhere on the grid to place a target.'
  if (props.outcome === 'converged') return `Reached the target in ${props.iteration} iterations.`
  if (!props.isTargetReachable) return 'This target is out of reach. The best the arm can do is point at it.'
  if (props.isRunning) return 'Running.'
  if (props.outcome === 'limit') return 'Hit the iteration limit before reaching the target.'
  if (props.outcome === 'stopped') return 'Stopped.'
  return 'Press Run to start.'
})
</script>

<style scoped>
.run-panel {
  display: grid;
  gap: 0.75rem;
}

.buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
