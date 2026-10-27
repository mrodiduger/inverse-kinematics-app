<template>
  <fieldset class="settings" :disabled="disabled">
    <SegmentedControl v-model="linkCount" legend="links" name="links" :options="linkOptions" />
    <SegmentedControl v-model="lossFunction" legend="loss" name="loss" :options="lossOptions" />
    <SegmentedControl v-model="optimizer" legend="optimizer" name="optimizer" :options="optimizerOptions" />

    <div>
      <label for="learning-rate" class="row">
        <span class="label">learning rate</span>
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
        <span class="label">max iterations</span>
        <input v-model.number="maxIteration" type="number" min="10" max="5000" step="50" class="number">
      </label>
      <label>
        <span class="label">tolerance</span>
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
  gap: 0.7rem;
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}

.row {
  display: flex;
  justify-content: space-between;
}

.row output {
  color: var(--bright);
}

.label {
  color: var(--muted);
}

.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.pair input {
  display: block;
  margin-top: 0.2rem;
}
</style>
