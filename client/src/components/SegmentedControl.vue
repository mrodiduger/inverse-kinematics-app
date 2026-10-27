<template>
  <fieldset class="segmented">
    <legend>{{ legend }}</legend>
    <div class="options">
      <label v-for="option in options" :key="option.value">
        <input v-model="model" type="radio" :name="name" :value="option.value">
        <span>{{ option.label }}</span>
      </label>
    </div>
  </fieldset>
</template>

<script setup>
defineProps({
  legend: { type: String, required: true },
  name: { type: String, required: true },
  options: { type: Array, required: true },
})

const model = defineModel({ required: true })
</script>

<style scoped>
.segmented {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}

legend {
  margin-bottom: 0.2rem;
  padding: 0;
  color: var(--muted);
}

.options {
  display: flex;
  border: 1px solid var(--rule);
}

label {
  flex: 1;
  position: relative;
}

label + label {
  border-left: 1px solid var(--rule);
}

input {
  position: absolute;
  opacity: 0;
  inset: 0;
  margin: 0;
  cursor: pointer;
}

span {
  display: block;
  padding: 0.15rem 0.3rem;
  text-align: center;
  text-transform: lowercase;
  white-space: nowrap;
  color: var(--muted);
}

label:hover span {
  color: var(--bright);
}

input:checked + span {
  background: var(--accent);
  color: var(--background);
}

input:focus-visible + span {
  outline: 1px solid var(--bright);
  outline-offset: -3px;
}

input:disabled + span {
  opacity: 0.4;
}
</style>
