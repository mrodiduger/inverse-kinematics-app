<template>
  <div id="config">
    <h2>Configuration</h2>
    <div>
      <label for="learningRate">Learning Rate:</label>
      <input id="learningRate" type="number" v-model="learningRate" step="0.0001" min="0.0001" max="1">
      <label for="numLinks">Number of Links:</label>
      <input id="numLinks" type="number" v-model="numLinks" step="1" min="1" max="6">
      <label for="maxIteration">Maximum Number of Iterations:</label>
      <input id="maxIteration" type="number" v-model="maxIteration" step="50" min="50" max="5000">
      <label for="errorThreshold">Error Threshold:</label>
      <input id="errorThreshold" type="number" v-model="errorThreshold" step="0.1" min="0.1" max="5000">
      <label for="lossFunction">Loss Function</label>
      <select class="form-select form-select-lg mb-3" aria-label="Default select example" v-model="lossFunction">
        <option v-for="(item, index) in lossFunctions" :value="index" :key="item"> {{ item }} </option>
      </select>
      <label for="optimizer">Loss Function</label>
      <select class="form-select form-select-lg mb-3" aria-label="Default select example" v-model="optimizer">
        <option v-for="(item, index) in optimizers" :value="index" :key="item"> {{ item }} </option>
      </select>
      
    </div>
  </div>
</template>
  
<script setup>
  
  const learningRate = defineModel('learningRate');
  const numLinks = defineModel('numLinks');
  const maxIteration = defineModel('maxIteration');
  const errorThreshold = defineModel('errorThreshold');
  const lossFunction = defineModel('lossFunction');
  const optimizer = defineModel('optimizer');

  const lossFunctions = ['Squared Error', 'Absolute Error', 'Huber Error'];
  const optimizers = ['SGD', 'Adam', 'Adagrad','RMSprop'];
  
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
  