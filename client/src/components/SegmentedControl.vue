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
  margin-bottom: 0.35rem;
}

.options {
  display: flex;
  border: 1px solid var(--rule);
  border-radius: 4px;
  overflow: hidden;
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
  padding: 0.35rem 0.4rem;
  text-align: center;
  font-size: 0.85rem;
  white-space: nowrap;
  color: var(--muted);
}

input:checked + span {
  background: var(--ink);
  color: var(--surface);
}

input:focus-visible + span {
  outline: 2px solid var(--target);
  outline-offset: -2px;
}

input:disabled + span {
  opacity: 0.5;
}
</style>
