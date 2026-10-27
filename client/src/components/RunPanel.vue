<template>
  <div class="run-panel">
    <div class="buttons">
      <button v-if="!isRunning" type="button" class="primary" :disabled="!hasTarget || isRacing" @click="emit('run')">
        {{ isPaused ? 'resume' : 'run' }}
      </button>
      <button v-else type="button" class="primary" @click="emit('pause')">pause</button>
      <button type="button" :disabled="!hasTarget || isRunning || isRacing" @click="emit('step')">step</button>
      <button type="button" :disabled="isRacing" @click="emit('reset')">reset</button>
    </div>

    <button v-if="!isRacing" type="button" :disabled="!hasTarget || isRunning" @click="emit('race')">
      race all four optimizers
    </button>
    <button v-else type="button" @click="emit('stop-race')">stop race</button>

    <SegmentedControl v-model="stepsPerSecond" legend="speed" name="speed" :options="SPEED_OPTIONS" />
  </div>
</template>

<script setup>
import SegmentedControl from './SegmentedControl.vue'

const SPEED_OPTIONS = [
  { value: 4, label: 'slow' },
  { value: 30, label: 'normal' },
  { value: 240, label: 'fast' },
]

defineProps({
  isRunning: { type: Boolean, required: true },
  isRacing: { type: Boolean, required: true },
  isPaused: { type: Boolean, required: true },
  hasTarget: { type: Boolean, required: true },
})

const emit = defineEmits(['run', 'pause', 'step', 'reset', 'race', 'stop-race'])

const stepsPerSecond = defineModel('stepsPerSecond', { required: true })
</script>

<style scoped>
.run-panel {
  display: grid;
  gap: 0.6rem;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
}
</style>
