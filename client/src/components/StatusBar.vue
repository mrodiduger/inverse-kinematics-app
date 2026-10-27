<template>
  <footer class="status-bar">
    <span :class="['mode', mode]">{{ mode }}</span>
    <span class="field"><span class="key">iter</span> <span class="number">{{ String(iteration).padStart(4, '0') }}</span></span>
    <span class="field"><span class="key">dist</span> <span class="number">{{ distance == null ? '–.–––' : distance.toFixed(3) }}</span></span>
    <span class="field target"><span class="key">target</span> <span class="number">{{ targetText }}</span></span>
    <span class="message" role="status">{{ message }}</span>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isRunning: { type: Boolean, required: true },
  isRacing: { type: Boolean, required: true },
  isPaused: { type: Boolean, required: true },
  target: { type: Array, default: null },
  isTargetReachable: { type: Boolean, required: true },
  iteration: { type: Number, required: true },
  distance: { type: Number, default: null },
  outcome: { type: String, default: null },
})

const mode = computed(() => {
  if (props.isRacing) return 'race'
  if (props.isRunning) return 'run'
  if (props.isPaused) return 'paused'
  if (props.outcome === 'converged') return 'done'
  return 'idle'
})

const targetText = computed(() => (
  props.target ? props.target.map((value) => value.toFixed(2).padStart(5)).join(', ') : 'none'
))

const message = computed(() => {
  if (!props.target) return 'click the arm view to place a target'
  if (props.isRacing) return 'racing all four optimizers from the same pose'
  if (props.outcome === 'converged') return `reached the target in ${props.iteration} iterations`
  if (!props.isTargetReachable) return 'target out of reach: the arm can only point at it'
  if (props.isRunning) return 'descending'
  if (props.isPaused) return 'paused: step to go one iteration at a time'
  if (props.outcome === 'limit') return 'hit the iteration limit before reaching the target'
  return 'run to animate, step to go one iteration at a time'
})
</script>

<style scoped>
.status-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: baseline;
  gap: 1.25rem;
  padding: 0.3rem 0.25rem;
  border-top: 1px solid var(--rule);
  background: var(--background);
  white-space: nowrap;
  overflow: hidden;
}

.mode {
  min-width: 6ch;
  padding: 0 0.4rem;
  background: var(--rule);
  color: var(--ink);
  text-align: center;
  text-transform: uppercase;
}

.mode.run,
.mode.race {
  background: var(--accent);
  color: var(--background);
}

.mode.done {
  color: var(--accent);
}

.key {
  color: var(--muted);
}

.message {
  overflow: hidden;
  color: var(--muted);
  text-overflow: ellipsis;
}

@media (max-width: 720px) {
  .target {
    display: none;
  }
}
</style>
