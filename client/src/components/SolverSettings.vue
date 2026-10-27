<template>
  <fieldset class="settings" :disabled="disabled">
    <SegmentedControl v-model="linkCount" legend="Links" name="links" :options="linkOptions" />
    <SegmentedControl v-model="lossFunction" legend="Loss" name="loss" :options="lossOptions" />
    <SegmentedControl v-model="optimizer" legend="Optimizer" name="optimizer" :options="optimizerOptions" />

    <div>
      <label for="learning-rate" class="row">
        Learning rate
        <output for="learning-rate" class="number">{{ learningRate }}</output>
      </label>
      <input
        id="learning-rate"
        type="range"
        min="-3"
        max="1"
        step="0.05"
        :value="Math.log10(learningRate)"
        @input="setLearningRate($event.target.value)"
      >
    </div>

    <div class="pair">
      <label>
        Max iterations
        <input v-model.number="maxIteration" type="number" min="10" max="5000" step="50" class="number">
      </label>
      <label>
        Tolerance
        <input v-model.number="tolerance" type="number" min="0.001" max="0.5" step="0.005" class="number">
      </label>
    </div>
  </fieldset>
</template>

<script setup>
import SegmentedControl from './SegmentedControl.vue'
import { LOSS_FUNCTIONS, OPTIMIZERS } from '../simulation'

defineProps({
  disabled: { type: Boolean, default: false },
})

const linkCount = defineModel('linkCount', { required: true })
const lossFunction = defineModel('lossFunction', { required: true })
const optimizer = defineModel('optimizer', { required: true })
const learningRate = defineModel('learningRate', { required: true })
const maxIteration = defineModel('maxIteration', { required: true })
const tolerance = defineModel('tolerance', { required: true })

const linkOptions = [1, 2, 3, 4, 5, 6].map((count) => ({ value: count, label: String(count) }))
const lossOptions = LOSS_FUNCTIONS.map((name, index) => ({ value: index, label: name.replace(' error', '') }))
const optimizerOptions = OPTIMIZERS.map(({ name }, index) => ({ value: index, label: name }))

function setLearningRate(exponent) {
  learningRate.value = Number((10 ** Number(exponent)).toPrecision(2))
}
</script>

<style scoped>
.settings {
  display: grid;
  gap: 1rem;
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}

.row {
  display: flex;
  justify-content: space-between;
}

input[type='range'] {
  width: 100%;
  accent-color: var(--ink);
}

.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.pair input {
  display: block;
  width: 100%;
  margin-top: 0.35rem;
}
</style>
