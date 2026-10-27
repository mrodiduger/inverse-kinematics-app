<template>
  <div id="config">
    <h2>Configuration</h2>
    <div>
      <label for="learningRate">Learning rate</label>
      <input id="learningRate" type="number" v-model="learningRate" step="any" min="0">
      <label for="numLinks">Number of links</label>
      <select id="numLinks" class="form-select mb-3" v-model="numLinks">
        <option v-for="count in 6" :key="count" :value="count">{{ count }}</option>
      </select>
      <label for="maxIteration">Maximum iterations</label>
      <input id="maxIteration" type="number" v-model="maxIteration" step="50" min="50" max="5000">
      <label for="tolerance">Tolerance (link lengths)</label>
      <input id="tolerance" type="number" v-model="tolerance" step="0.005" min="0.001" max="1">
      <label for="lossFunction">Loss function</label>
      <select id="lossFunction" class="form-select form-select-lg mb-3" v-model="lossFunction">
        <option v-for="(name, index) in LOSS_FUNCTIONS" :key="name" :value="index">{{ name }}</option>
      </select>
      <label for="optimizer">Optimizer</label>
      <select id="optimizer" class="form-select form-select-lg mb-3" v-model="optimizer">
        <option v-for="({ name }, index) in OPTIMIZERS" :key="name" :value="index">{{ name }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { LOSS_FUNCTIONS, OPTIMIZERS } from '../simulation'

const learningRate = defineModel('learningRate')
const numLinks = defineModel('numLinks')
const maxIteration = defineModel('maxIteration')
const tolerance = defineModel('tolerance')
const lossFunction = defineModel('lossFunction')
const optimizer = defineModel('optimizer')
</script>

<style scoped>
#config {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin: 10px;
  background-color: #f9f9f9;
  width: 100%;
}

label {
  margin-right: 10px;
}

input {
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
</style>
